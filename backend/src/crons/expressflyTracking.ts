import { and, asc, eq, ilike, isNotNull, isNull, ne, notInArray, or } from 'drizzle-orm'
import { db } from '../models/client'
import { b2c_orders } from '../models/schema/b2cOrders'
import { ExpressflyService } from '../models/services/couriers/expressfly.service'
import { persistExpressflyTracking } from '../models/services/expressflyTracking.service'

const terminalStatuses = ['delivered', 'cancelled', 'rto_delivered']

export type ExpressflyTrackingPollResult = {
  selected: number
  fetched: number
  succeeded: number
  failed: number
  inserted: number
  skipped: number
}

const isActiveOrder = (includeTerminal: boolean) =>
  includeTerminal
    ? undefined
    : or(
        notInArray(b2c_orders.order_status, terminalStatuses),
        isNull(b2c_orders.order_status),
      )

/**
 * Polls ExpressFly without calling webhook processors. The tracking persistence
 * service only inserts unseen scans and updates the shipment's latest status;
 * wallet/RTO side effects are intentionally not part of this path.
 */
export async function pollExpressflyTracking(
  batchSize = Number(process.env.EXPRESSFLY_TRACKING_POLL_BATCH_SIZE || 50),
  options: { includeTerminal?: boolean } = {},
): Promise<ExpressflyTrackingPollResult> {
  const safeBatchSize = Math.min(200, Math.max(1, batchSize))
  const includeTerminal = options.includeTerminal === true
  const activeCondition = isActiveOrder(includeTerminal)
  const where = and(
    isNotNull(b2c_orders.awb_number),
    ne(b2c_orders.awb_number, ''),
    or(
      eq(b2c_orders.integration_type, 'expressfly'),
      ilike(b2c_orders.courier_partner, '%expressfly%'),
    ),
    activeCondition,
  )

  const orders = await db
    .select({
      orderNumber: b2c_orders.order_number,
      awbNumber: b2c_orders.awb_number,
      shipmentId: b2c_orders.shipment_id,
    })
    .from(b2c_orders)
    .where(where)
    .orderBy(asc(b2c_orders.updated_at))
    .limit(safeBatchSize)

  const result: ExpressflyTrackingPollResult = {
    selected: orders.length,
    fetched: 0,
    succeeded: 0,
    failed: 0,
    inserted: 0,
    skipped: 0,
  }
  if (!orders.length) return result

  const service = new ExpressflyService()
  for (const order of orders) {
    const awb = String(order.awbNumber || '').trim()
    if (!awb) {
      result.skipped += 1
      continue
    }

    try {
      const raw = await service.trackShipment(
        awb,
        [order.shipmentId, order.orderNumber].filter(Boolean) as string[],
      )
      result.fetched += 1
      const persisted = await persistExpressflyTracking(raw.raw ?? raw, awb)
      if (!persisted.success) {
        result.skipped += 1
        console.warn(`[Cron] ExpressFly tracking skipped AWB ${awb}: ${persisted.reason || 'unknown'}`)
        continue
      }
      result.succeeded += 1
      result.inserted += persisted.inserted
    } catch (error: any) {
      result.failed += 1
      console.error(`[Cron] ExpressFly tracking failed for ${awb}:`, error?.message || error)
    }
  }

  return result
}
