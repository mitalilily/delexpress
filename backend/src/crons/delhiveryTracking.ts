import { and, desc, eq, isNull, notInArray, or } from 'drizzle-orm'
import { db } from '../models/client'
import { DelhiveryService } from '../models/services/couriers/delhivery.service'
import { extractDelhiveryTrackingUpdate } from '../models/services/couriers/delhiveryTracking.utils'
import { processDelhiveryWebhook } from '../models/services/webhookProcessor'
import { b2c_orders } from '../models/schema/b2cOrders'
import { tracking_events } from '../models/schema/trackingEvents'

const terminalStatuses = ['delivered', 'cancelled', 'rto_delivered']

const normalize = (value: unknown) => String(value || '').trim().toLowerCase()

export async function pollDelhiveryTracking(
  batchSize = Number(process.env.DELHIVERY_TRACKING_POLL_BATCH_SIZE || 50),
) {
  const pending = await db
    .select()
    .from(b2c_orders)
    .where(
      and(
        eq(b2c_orders.integration_type, 'delhivery'),
        or(notInArray(b2c_orders.order_status, terminalStatuses), isNull(b2c_orders.order_status)),
      ),
    )
    .limit(Math.max(1, batchSize))

  if (!pending.length) return

  const delhivery = new DelhiveryService()

  for (const order of pending) {
    const awb = String(order.awb_number || '').trim()
    if (!awb) continue

    try {
      const raw = await delhivery.trackShipment(awb)
      const trackingUpdate = extractDelhiveryTrackingUpdate(raw)
      const mappedStatus = trackingUpdate.internalStatus

      if (!mappedStatus || mappedStatus === 'unknown') continue

      const [latestEvent] = await db
        .select({
          statusCode: tracking_events.status_code,
          statusText: tracking_events.status_text,
          location: tracking_events.location,
        })
        .from(tracking_events)
        .where(eq(tracking_events.order_id, order.id))
        .orderBy(desc(tracking_events.created_at))
        .limit(1)

      const statusChanged = normalize(order.order_status) !== normalize(mappedStatus)
      const locationChanged =
        !!trackingUpdate.location &&
        normalize(order.delivery_location) !== normalize(trackingUpdate.location)
      const messageChanged =
        !!(trackingUpdate.instructions || trackingUpdate.rawStatus) &&
        normalize(order.delivery_message) !==
          normalize(trackingUpdate.instructions || trackingUpdate.rawStatus)
      const latestEventMatches =
        latestEvent &&
        normalize(latestEvent.statusCode) === normalize(mappedStatus) &&
        normalize(latestEvent.statusText) === normalize(trackingUpdate.rawStatus || mappedStatus) &&
        normalize(latestEvent.location) === normalize(trackingUpdate.location)

      if (!statusChanged && !locationChanged && !messageChanged && latestEventMatches) {
        continue
      }

      const result = await processDelhiveryWebhook(raw)
      if (!result.success) {
        console.warn(
          `[Cron] Delhivery tracking poll skipped AWB ${awb}: ${result.reason || 'unknown'}`,
        )
      }
    } catch (err: any) {
      console.error(`Delhivery tracking failed for ${awb}:`, err?.message || err)
    }
  }
}

