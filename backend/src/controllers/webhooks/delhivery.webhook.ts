import { Request, Response } from 'express'
import { and, eq, gte, isNull } from 'drizzle-orm'
import { db } from '../../models/client'
import {
  processDelhiveryDocumentWebhook,
  processDelhiveryWebhook,
} from '../../models/services/webhookProcessor'
import { extractDelhiveryTrackingUpdate } from '../../models/services/couriers/delhiveryTracking.utils'
import {
  detectDelhiveryDocumentType,
  type DelhiveryDocumentType,
} from '../../models/services/couriers/delhiveryDocument.utils'
import { pending_webhooks } from '../../schema/schema'

const DELHIVERY_PENDING_DEDUPE_WINDOW_MS = 10 * 60 * 1000

const buildPendingDelhiveryPayload = (payload: any, documentType?: DelhiveryDocumentType | null) => ({
  __provider: 'delhivery',
  ...(documentType ? { __delhiveryDocumentType: documentType } : {}),
  body: payload,
})

const queuePendingDelhiveryWebhook = async ({
  awb,
  status,
  payload,
  documentType = null,
}: {
  awb: string
  status: string
  payload: any
  documentType?: DelhiveryDocumentType | null
}) => {
  const dedupeWindowStart = new Date(Date.now() - DELHIVERY_PENDING_DEDUPE_WINDOW_MS)
  const [existingPending] = await db
    .select({ id: pending_webhooks.id })
    .from(pending_webhooks)
    .where(
      and(
        eq(pending_webhooks.awb_number, String(awb)),
        eq(pending_webhooks.status, String(status || 'unknown')),
        isNull(pending_webhooks.processed_at),
        gte(pending_webhooks.created_at, dedupeWindowStart),
      ),
    )
    .limit(1)

  if (existingPending) {
    return false
  }

  await db.insert(pending_webhooks).values({
    awb_number: awb,
    status,
    payload: buildPendingDelhiveryPayload(payload, documentType),
  })

  return true
}

const getDelhiveryAwb = (payload: any) => {
  const trackingUpdate = extractDelhiveryTrackingUpdate(payload)
  const shipment = payload?.Shipment || payload

  return (
    trackingUpdate.waybill ||
    shipment?.AWB ||
    payload?.AWB ||
    payload?.waybill ||
    payload?.waybillId ||
    payload?.waybill_id ||
    shipment?.Waybill ||
    payload?.Waybill ||
    null
  )
}

const createDelhiveryDocumentPushHandler =
  (defaultDocumentType: DelhiveryDocumentType | null = null) =>
  async (req: Request, res: Response) => {
    const timestamp = new Date().toISOString()
    const payload = req.body
    const awb = getDelhiveryAwb(payload)
    const documentType = detectDelhiveryDocumentType(payload, defaultDocumentType)

    console.log('='.repeat(80))
    console.log(`[${timestamp}] Delhivery Document Push Webhook Received`)
    console.log(`   Type: ${documentType || 'Unknown'}`)
    console.log(`   AWB: ${awb || 'N/A'}`)
    console.log(`   IP: ${req.ip || req.socket.remoteAddress || 'unknown'}`)
    console.log(`   Headers:`, JSON.stringify(req.headers, null, 2))
    console.log(`   Full Payload:`, JSON.stringify(payload, null, 2))
    console.log('='.repeat(80))

    try {
      if (!awb) {
        console.error('Delhivery document push webhook rejected: Missing AWB/waybill')
        return res.status(400).json({ message: 'Missing AWB/waybill' })
      }

      const result = await processDelhiveryDocumentWebhook(payload, documentType)

      if (result.success) {
        console.log(`Delhivery document push webhook processed successfully for AWB: ${awb}`)
        return res.status(200).json({ success: true })
      }

      if (result.reason === 'order_not_found') {
        const queued = await queuePendingDelhiveryWebhook({
          awb: String(awb),
          status: `delhivery:document:${documentType || 'unknown'}`,
          payload,
          documentType,
        })

        if (queued) {
          console.warn(
            `Stored Delhivery ${documentType || 'document'} webhook for AWB ${awb} (order not yet created).`,
          )
        } else {
          console.warn(
            `Duplicate pending Delhivery ${documentType || 'document'} webhook skipped for AWB ${awb}.`,
          )
        }

        return res.status(202).json({ success: true, queued: true })
      }

      console.warn(`Delhivery document push webhook partially processed for AWB: ${awb}`)
      return res.status(202).json({ success: false })
    } catch (err: any) {
      console.error('='.repeat(80))
      console.error(`Delhivery document push webhook error for AWB: ${awb || 'unknown'}`)
      console.error(`   Error Message: ${err?.message || err}`)
      console.error(`   Error Stack:`, err?.stack)
      console.error(`   Payload:`, JSON.stringify(payload, null, 2))
      console.error('='.repeat(80))
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  }

/**
 * Delhivery Scan Push Webhook Handler
 * Handles shipment status updates (Manifested, In Transit, Delivered, RTO, etc.)
 */
export const delhiveryScanPushHandler = async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString()
  const payload = req.body
  const trackingUpdate = extractDelhiveryTrackingUpdate(payload)
  const awb = trackingUpdate.waybill
  const status = trackingUpdate.rawStatus || payload?.status || 'unknown'

  console.log('='.repeat(80))
  console.log(`[${timestamp}] Delhivery Scan Push Webhook Received`)
  console.log(`   AWB: ${awb || 'N/A'}`)
  console.log(`   Status: ${status}`)
  console.log(`   IP: ${req.ip || req.socket.remoteAddress || 'unknown'}`)
  console.log(`   Headers:`, JSON.stringify(req.headers, null, 2))
  console.log(`   Full Payload:`, JSON.stringify(payload, null, 2))
  console.log('='.repeat(80))

  try {
    if (!awb) {
      console.error('Delhivery scan push webhook rejected: Missing AWB/waybill')
      return res.status(400).json({ message: 'Missing AWB/waybill' })
    }

    const result = await processDelhiveryWebhook(payload)

    if (!result.success && result.reason === 'order_not_found') {
      const queued = await queuePendingDelhiveryWebhook({
        awb: String(awb),
        status: String(status || 'unknown'),
        payload,
      })

      if (queued) {
        console.warn(`Stored Delhivery scan push webhook for AWB ${awb} (order not yet created).`)
      } else {
        console.warn(`Duplicate pending webhook skipped for AWB ${awb} (within dedupe window).`)
      }
      return res.status(202).json({ success: true, queued: true })
    }

    if (result.success) {
      console.log(`Delhivery scan push webhook processed successfully for AWB: ${awb}`)
      return res.status(200).json({ success: true })
    }

    console.warn(
      `Delhivery scan push webhook partially processed for AWB: ${awb}, reason: ${result.reason}`,
    )
    return res.status(202).json({ success: false })
  } catch (err: any) {
    console.error('='.repeat(80))
    console.error(`Delhivery scan push webhook error for AWB: ${awb || 'unknown'}`)
    console.error(`   Error Message: ${err?.message || err}`)
    console.error(`   Error Stack:`, err?.stack)
    console.error(`   Payload:`, JSON.stringify(payload, null, 2))
    console.error('='.repeat(80))
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

export const delhiveryDocumentPushHandler = createDelhiveryDocumentPushHandler()
export const delhiveryQcImagePushHandler = createDelhiveryDocumentPushHandler('QCImage')
export const delhiverySorterImagePushHandler = createDelhiveryDocumentPushHandler('SorterImage')
export const delhiveryEpodPushHandler = createDelhiveryDocumentPushHandler('EPOD')

/**
 * Legacy unified webhook handler (for backward compatibility)
 * Auto-detects webhook type and routes accordingly
 * @deprecated Use delhiveryScanPushHandler or delhiveryDocumentPushHandler instead
 */
export const delhiveryWebhookHandler = async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString()
  const payload = req.body
  const trackingUpdate = extractDelhiveryTrackingUpdate(payload)
  const shipment = trackingUpdate.shipment || payload?.Shipment
  const awb = trackingUpdate.waybill
  const status = trackingUpdate.rawStatus || payload?.status || 'unknown'
  const documentType = detectDelhiveryDocumentType(payload, null)
  const isDocumentPush = Boolean(documentType || payload?.DocumentType)

  console.log('='.repeat(80))
  console.log(`[${timestamp}] Delhivery Webhook Received`)
  console.log(
    `   Type: ${isDocumentPush ? `Document Push (${documentType || 'document'})` : 'Scan Push (Status Update)'}`,
  )
  console.log(`   AWB: ${awb || 'N/A'}`)
  console.log(`   Status: ${status}`)
  console.log(`   IP: ${req.ip || req.socket.remoteAddress || 'unknown'}`)
  console.log(`   Headers:`, JSON.stringify(req.headers, null, 2))
  console.log(`   Full Payload:`, JSON.stringify(payload, null, 2))
  console.log('='.repeat(80))

  try {
    if (!awb) {
      console.error('Delhivery webhook rejected: Missing AWB/waybill')
      return res.status(400).json({ message: 'Missing AWB/waybill' })
    }

    if (isDocumentPush) {
      const result = await processDelhiveryDocumentWebhook(payload, documentType)

      if (result.success) {
        console.log(`Delhivery document webhook processed successfully for AWB: ${awb}`)
        return res.status(200).json({ success: true })
      }

      if (result.reason === 'order_not_found') {
        const queued = await queuePendingDelhiveryWebhook({
          awb: String(awb),
          status: `delhivery:document:${documentType || 'unknown'}`,
          payload,
          documentType,
        })

        if (queued) {
          console.warn(`Stored Delhivery document webhook for AWB ${awb} (order not yet created).`)
        } else {
          console.warn(`Duplicate pending Delhivery document webhook skipped for AWB ${awb}.`)
        }

        return res.status(202).json({ success: true, queued: true })
      }

      console.warn(`Delhivery document webhook partially processed for AWB: ${awb}`)
      return res.status(202).json({ success: false })
    }

    const result = await processDelhiveryWebhook(payload)

    if (!result.success && result.reason === 'order_not_found') {
      const queued = await queuePendingDelhiveryWebhook({
        awb: String(awb),
        status: String(status || 'unknown'),
        payload,
      })

      if (queued) {
        console.warn(`Stored Delhivery webhook for AWB ${awb} (order not yet created).`)
      } else {
        console.warn(`Duplicate pending webhook skipped for AWB ${awb} (within dedupe window).`)
      }
      return res.status(202).json({ success: true, queued: true })
    }

    if (result.success) {
      console.log(`Delhivery webhook processed successfully for AWB: ${awb}`)
      return res.status(200).json({ success: true })
    }

    console.warn(`Delhivery webhook partially processed for AWB: ${awb}, reason: ${result.reason}`)
    return res.status(202).json({ success: false })
  } catch (err: any) {
    console.error('='.repeat(80))
    console.error(`Delhivery webhook error for AWB: ${awb || 'unknown'}`)
    console.error(`   Error Message: ${err?.message || err}`)
    console.error(`   Error Stack:`, err?.stack)
    console.error(`   Payload:`, JSON.stringify(payload, null, 2))
    console.error('='.repeat(80))
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}
