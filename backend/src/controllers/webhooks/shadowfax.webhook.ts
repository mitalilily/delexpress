import { Request, Response } from 'express'
import { and, eq, gte, isNull } from 'drizzle-orm'
import { db } from '../../models/client'
import { processShadowfaxWebhook } from '../../models/services/webhookProcessor'
import { pending_webhooks } from '../../schema/schema'
import {
  DEFAULT_EXPRESSOPRO_WEBHOOK_SECRET,
  getWebhookHeaderValue,
  verifyWebhookSecret,
} from './webhookSecret'

const SHADOWFAX_WEBHOOK_SECRET_HEADERS = [
  'x-shadowfax-webhook-secret',
  'x-shadowfax-webhook-signature',
  'x-webhook-secret',
  'x-webhook-signature',
  'authorization',
]

const extractShadowfaxEventPayload = (payload: any) => {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  if (Array.isArray(payload?.data) && payload.data.length > 0) {
    return payload.data[0]
  }
  return payload
}

export const shadowfaxWebhookHandler = async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString()
  const payload = req.body
  const rawBody = (req as any).rawBody || (req.body ? JSON.stringify(req.body) : '')
  const receivedSecret = getWebhookHeaderValue(req.headers, SHADOWFAX_WEBHOOK_SECRET_HEADERS)
  if (
    !verifyWebhookSecret({
      configuredSecret: DEFAULT_EXPRESSOPRO_WEBHOOK_SECRET,
      receivedSecret,
      rawBody,
    })
  ) {
    console.warn('⚠️ Shadowfax webhook rejected: invalid or missing secret')
    return res.status(401).json({ success: false, message: 'invalid webhook secret' })
  }
  const event = extractShadowfaxEventPayload(payload)
  const awb =
    event?.awb ||
    event?.awb_number ||
    event?.waybill ||
    event?.waybill_number ||
    event?.tracking_number ||
    event?.tracking_id ||
    null
  const statusId = event?.status_id || event?.statusId || event?.status_code || event?.status || 'unknown'

  console.log('='.repeat(80))
  console.log(`📦 [${timestamp}] Shadowfax Webhook Received`)
  console.log(`   AWB: ${awb || 'N/A'}`)
  console.log(`   Status ID: ${statusId}`)
  console.log(`   IP: ${req.ip || req.socket.remoteAddress || 'unknown'}`)
  console.log(`   Full Payload:`, JSON.stringify(payload, null, 2))
  console.log('='.repeat(80))

  try {
    const result = await processShadowfaxWebhook(payload)

    if (!result.success && result.reason === 'missing_awb') {
      return res.status(400).json({ success: false, message: 'Missing AWB/order reference' })
    }

    if (!result.success && result.reason === 'order_not_found') {
      const dedupeWindowStart = new Date(Date.now() - 10 * 60 * 1000)
      const [existingPending] = await db
        .select({ id: pending_webhooks.id })
        .from(pending_webhooks)
        .where(
          and(
            eq(pending_webhooks.awb_number, String(awb || 'unknown')),
            eq(pending_webhooks.status, `shadowfax:${String(statusId || 'unknown')}`),
            isNull(pending_webhooks.processed_at),
            gte(pending_webhooks.created_at, dedupeWindowStart),
          ),
        )
        .limit(1)

      if (!existingPending) {
        await db.insert(pending_webhooks).values({
          awb_number: awb || null,
          status: `shadowfax:${String(statusId || 'unknown')}`,
          payload: {
            __provider: 'shadowfax',
            body: payload,
          },
        })
        console.warn(`⚠️ Stored Shadowfax webhook for AWB ${awb || 'N/A'} (order not yet created).`)
      } else {
        console.warn(
          `⚠️ Duplicate pending Shadowfax webhook skipped for AWB ${awb || 'N/A'} (within dedupe window).`,
        )
      }

      return res.status(202).json({ success: true, queued: true })
    }

    if (!result.success) {
      return res.status(202).json({ success: false, reason: result.reason })
    }

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('❌ Shadowfax webhook processing failed:', err?.message || err)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
