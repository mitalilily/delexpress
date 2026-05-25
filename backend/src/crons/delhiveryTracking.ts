import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, notInArray, or } from 'drizzle-orm'
import { db } from '../models/client'
import { DelhiveryService } from '../models/services/couriers/delhivery.service'
import { extractDelhiveryTrackingUpdate } from '../models/services/couriers/delhiveryTracking.utils'
import { processDelhiveryWebhook } from '../models/services/webhookProcessor'
import { b2b_orders } from '../models/schema/b2bOrders'
import { b2c_orders } from '../models/schema/b2cOrders'
import { tracking_events } from '../models/schema/trackingEvents'

const terminalStatuses = ['delivered', 'cancelled', 'rto_delivered']
const delhiveryB2cCourierIds = [99, 100]
const delhiveryB2bCourierIds = ['99', '100']

const normalize = (value: unknown) => String(value || '').trim().toLowerCase()

export async function pollDelhiveryTracking(
  batchSize = Number(process.env.DELHIVERY_TRACKING_POLL_BATCH_SIZE || 50),
) {
  const safeBatchSize = Math.max(1, batchSize)
  const pendingB2c = await db
    .select()
    .from(b2c_orders)
    .where(
      and(
        isNotNull(b2c_orders.awb_number),
        or(
          eq(b2c_orders.integration_type, 'delhivery'),
          ilike(b2c_orders.courier_partner, '%delhivery%'),
          inArray(b2c_orders.courier_id, delhiveryB2cCourierIds),
        ),
        or(notInArray(b2c_orders.order_status, terminalStatuses), isNull(b2c_orders.order_status)),
      ),
    )
    .orderBy(asc(b2c_orders.updated_at))
    .limit(safeBatchSize)

  const remainingBatch = Math.max(0, safeBatchSize - pendingB2c.length)
  const pendingB2b =
    remainingBatch > 0
      ? await db
          .select()
          .from(b2b_orders)
          .where(
            and(
              isNotNull(b2b_orders.awb_number),
              or(
                ilike(b2b_orders.courier_partner, '%delhivery%'),
                inArray(b2b_orders.courier_id, delhiveryB2bCourierIds),
              ),
              or(
                notInArray(b2b_orders.order_status, terminalStatuses),
                isNull(b2b_orders.order_status),
              ),
            ),
          )
          .orderBy(asc(b2b_orders.updated_at))
          .limit(remainingBatch)
      : []

  const pending = [
    ...pendingB2c.map((order) => ({ order, orderType: 'b2c' as const })),
    ...pendingB2b.map((order) => ({ order, orderType: 'b2b' as const })),
  ]

  if (!pending.length) return

  const delhivery = new DelhiveryService()

  for (const { order, orderType } of pending) {
    const awb = String(order.awb_number || '').trim()
    if (!awb) continue

    try {
      const raw = await delhivery.trackShipment(awb)
      const trackingUpdate = extractDelhiveryTrackingUpdate(raw)
      const mappedStatus = trackingUpdate.internalStatus

      if (!mappedStatus || mappedStatus === 'unknown') continue

      const [latestEvent] =
        orderType === 'b2c'
          ? await db
              .select({
                statusCode: tracking_events.status_code,
                statusText: tracking_events.status_text,
                location: tracking_events.location,
              })
              .from(tracking_events)
              .where(eq(tracking_events.order_id, order.id))
              .orderBy(desc(tracking_events.created_at))
              .limit(1)
          : []

      const statusChanged = normalize(order.order_status) !== normalize(mappedStatus)
      const locationChanged =
        !!trackingUpdate.location &&
        normalize(order.delivery_location) !== normalize(trackingUpdate.location)
      const messageChanged =
        !!(trackingUpdate.instructions || trackingUpdate.rawStatus) &&
        normalize(order.delivery_message) !==
          normalize(trackingUpdate.instructions || trackingUpdate.rawStatus)
      const latestEventMatches =
        orderType === 'b2c' &&
        latestEvent &&
        normalize(latestEvent.statusCode) === normalize(mappedStatus) &&
        normalize(latestEvent.statusText) === normalize(trackingUpdate.rawStatus || mappedStatus) &&
        normalize(latestEvent.location) === normalize(trackingUpdate.location)

      if (
        !statusChanged &&
        !locationChanged &&
        !messageChanged &&
        (orderType === 'b2b' || latestEventMatches)
      ) {
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
