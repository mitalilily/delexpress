import { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../../models/client'
import { courier_credentials } from '../../models/schema/courierCredentials'
import { persistExpressflyTracking } from '../../models/services/expressflyTracking.service'
import {
  getWebhookHeaderValue,
  verifyWebhookSecret,
} from './webhookSecret'

const SECRET_HEADERS = [
  'x-expressfly-webhook-secret',
  'x-expressfly-webhook-signature',
  'x-expressfly-signature',
  'x-webhook-secret',
  'x-webhook-signature',
  'authorization',
]

const loadSecret = async () => {
  try {
    const [row] = await db
      .select({ webhookSecret: courier_credentials.webhookSecret })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'expressfly'))
      .limit(1)
    return String(row?.webhookSecret || process.env.EXPRESSFLY_WEBHOOK_SECRET || '').trim()
  } catch (error: any) {
    console.error('ExpressFly webhook secret lookup failed:', error?.message || error)
    return String(process.env.EXPRESSFLY_WEBHOOK_SECRET || '').trim()
  }
}

export const expressflyWebhookHandler = async (req: Request, res: Response) => {
  const configuredSecret = await loadSecret()
  const receivedSecret = getWebhookHeaderValue(req.headers, SECRET_HEADERS)
  const rawBody = (req as any).rawBody || (req.body ? JSON.stringify(req.body) : '')

  if (!configuredSecret) {
    console.error('ExpressFly webhook rejected: EXPRESSFLY_WEBHOOK_SECRET is not configured')
    return res.status(503).json({ success: false, message: 'ExpressFly webhook is not configured' })
  }

  if (!verifyWebhookSecret({ configuredSecret, receivedSecret, rawBody })) {
    console.warn('ExpressFly webhook rejected: invalid credentials')
    return res.status(401).json({ success: false, message: 'invalid webhook credentials' })
  }

  try {
    const result = await persistExpressflyTracking(req.body)
    if (!result.success && result.reason === 'order_not_found') {
      return res.status(202).json({ success: true, queued: true, reason: result.reason })
    }
    if (!result.success) return res.status(202).json(result)
    return res.status(200).json(result)
  } catch (error: any) {
    console.error('ExpressFly webhook processing failed:', error?.message || error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
