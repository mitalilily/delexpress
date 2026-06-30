import { and, asc, desc, eq, ilike, isNotNull, isNull, notInArray, or } from 'drizzle-orm'
import { db } from '../models/client'
import { SHADOWFAX_COURIER_ID } from '../models/services/couriers/shadowfax.catalog'
import { ShadowfaxService } from '../models/services/couriers/shadowfax.service'
import { extractShadowfaxTrackingUpdate } from '../models/services/couriers/shadowfaxTracking.utils'
import { processShadowfaxWebhook } from '../models/services/webhookProcessor'
import { b2b_orders } from '../models/schema/b2bOrders'
import { b2c_orders } from '../models/schema/b2cOrders'
import { tracking_events } from '../models/schema/trackingEvents'

const terminalStatuses = ['delivered', 'cancelled', 'rto_delivered']

const normalize = (value: unknown) => String(value || '').trim().toLowerCase()

export async function pollShadowfaxTracking(
  batchSize = Number(process.env.SHADOWFAX_TRACKING_POLL_BATCH_SIZE || 50),
) {
  const safeBatchSize = Math.max(1, batchSize)

  const pendingB2c = await db
    .select()
    .from(b2c_orders)
    .where(
      and(
        isNotNull(b2c_orders.awb_number),
        or(
          eq(b2c_orders.integration_type, 'shadowfax'),
          ilike(b2c_orders.courier_partner, '%shadowfax%'),
          eq(b2c_orders.courier_id, SHADOWFAX_COURIER_ID),
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
                ilike(b2b_orders.courier_partner, '%shadowfax%'),
                eq(b2b_orders.courier_id, String(SHADOWFAX_COURIER_ID)),
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

  const shadowfax = new ShadowfaxService()

  for (const { order, orderType } of pending) {
    const awb = String(order.awb_number || '').trim()
    if (!awb) continue

    try {
      const raw = await shadowfax.trackOrder(awb)
      const trackingUpdate = extractShadowfaxTrackingUpdate(raw)
      const mappedStatus = trackingUpdate.internalStatus

      if (!mappedStatus || mappedStatus === 'unknown') continue

      const rawStatus = trackingUpdate.statusId || trackingUpdate.statusText || mappedStatus
      const deliveryMessage = trackingUpdate.remark || trackingUpdate.description || rawStatus

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
        !!deliveryMessage && normalize(order.delivery_message) !== normalize(deliveryMessage)
      const latestEventMatches =
        orderType === 'b2c' &&
        latestEvent &&
        normalize(latestEvent.statusCode) === normalize(mappedStatus) &&
        normalize(latestEvent.statusText) === normalize(rawStatus) &&
        normalize(latestEvent.location) === normalize(trackingUpdate.location)

      if (
        !statusChanged &&
        !locationChanged &&
        !messageChanged &&
        (orderType === 'b2b' || latestEventMatches)
      ) {
        continue
      }

      const result = await processShadowfaxWebhook(raw)
      if (!result.success) {
        console.warn(
          `[Cron] Shadowfax tracking poll skipped AWB ${awb}: ${result.reason || 'unknown'}`,
        )
      }
    } catch (err: any) {
      console.error(`Shadowfax tracking failed for ${awb}:`, err?.message || err)
    }
  }
}
