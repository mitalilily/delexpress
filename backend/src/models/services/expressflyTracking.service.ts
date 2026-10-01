import { and, eq, or } from 'drizzle-orm'
import { db } from '../client'
import { b2b_orders } from '../schema/b2bOrders'
import { b2c_orders } from '../schema/b2cOrders'
import { tracking_events } from '../schema/trackingEvents'
import { logTrackingEvent } from './trackingEvents.service'

export type ExpressflyTrackingEvent = {
  statusCode: string
  statusText: string
  location: string
  eventTime: string | null
  raw: any
}

const text = (value: unknown) => String(value ?? '').trim()
const columnText = (value: unknown, maxLength: number) => text(value).slice(0, maxLength)

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    const result = text(value)
    if (result) return result
  }
  return ''
}

const toIso = (value: unknown) => {
  const raw = text(value)
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString()
}

const getNested = (payload: any) => [
  payload,
  payload?.data,
  payload?.result,
  payload?.order,
  payload?.data?.order,
  payload?.data?.order_info,
  payload?.data?.status_info,
  payload?.status_info,
]

const firstFromNested = (payload: any, keys: string[]) => {
  for (const item of getNested(payload)) {
    if (!item || typeof item !== 'object') continue
    for (const key of keys) {
      const value = item[key]
      if (text(value)) return value
    }
  }
  return ''
}

const asEvent = (item: any, fallback: any = {}) => {
  const statusCode = firstText(
    item?.status_code,
    item?.statusCode,
    item?.status_id,
    item?.statusId,
    item?.code,
    item?.event_code,
    item?.eventCode,
    item?.status,
    fallback?.status_code,
    fallback?.statusCode,
    fallback?.status,
  )
  const statusText = firstText(
    item?.status_text,
    item?.statusText,
    item?.remarks,
    item?.remark,
    item?.message,
    item?.description,
    item?.activity,
    item?.scan_status,
    item?.scanStatus,
    item?.status,
    statusCode,
  )
  const location = firstText(
    item?.location,
    item?.city,
    item?.hub,
    item?.facility,
    item?.current_location,
    item?.scan_location,
  )
  const eventTime = toIso(
    firstText(
      item?.event_time,
      item?.eventTime,
      item?.created_at,
      item?.createdAt,
      item?.timestamp,
      item?.scanDateTime,
      item?.scan_datetime,
      item?.date,
      item?.time,
      fallback?.event_time,
      fallback?.eventTime,
    ),
  )

  if (!statusCode && !statusText) return null
  return {
    statusCode: statusCode || statusText,
    statusText: statusText || statusCode,
    location,
    eventTime,
    raw: item,
  }
}

const eventArrays = (payload: any) => {
  const values = [
    payload?.events,
    payload?.tracking_events,
    payload?.trackingHistory,
    payload?.history,
    payload?.scans,
    payload?.scan_events,
    payload?.tracking_details,
    payload?.data?.events,
    payload?.data?.tracking_events,
    payload?.data?.trackingHistory,
    payload?.data?.history,
    payload?.data?.scans,
    payload?.data?.scan_events,
    payload?.data?.tracking_details,
    payload?.result?.events,
    payload?.result?.tracking_events,
    payload?.result?.history,
  ]
  return values.filter(Array.isArray).flat()
}

export const extractExpressflyAwb = (payload: any) =>
  firstFromNested(payload, [
    'awb',
    'awb_number',
    'awbNumber',
    'waybill',
    'tracking_number',
    'trackingNumber',
    'shipment_awb',
    'shippingPackageCode',
    'shipping_package_code',
  ])

export const normalizeExpressflyTrackingPayload = (payload: any, fallbackAwb?: string) => {
  const fallback = payload?.data?.status_info ?? payload?.status_info ?? payload
  const events = eventArrays(payload)
    .map((item) => asEvent(item, fallback))
    .filter(Boolean) as ExpressflyTrackingEvent[]

  if (!events.length) {
    const current = asEvent(fallback)
    if (current) events.push(current)
  }

  return {
    awb: extractExpressflyAwb(payload) || text(fallbackAwb),
    events,
  }
}

export const mapExpressflyStatus = (value: unknown) => {
  const status = text(value).toLowerCase()
  if (!status) return null
  if (status.includes('deliver')) return 'delivered'
  if (status.includes('rto') || status.includes('return')) return 'rto'
  if (status.includes('cancel')) return 'cancelled'
  if (status.includes('out for') || status.includes('dispatch')) return 'out_for_delivery'
  if (status.includes('pick')) return 'pickup_initiated'
  if (status.includes('manifest') || status.includes('book') || status.includes('create')) return 'booked'
  if (status.includes('transit') || status.includes('received') || status.includes('hub')) return 'in_transit'
  return null
}

type LocalOrder = {
  id: string
  userId: string
  orderNumber: string
  awbNumber: string | null
  shipmentId: string | null
  orderStatus: string | null
  kind: 'b2c' | 'b2b'
}

const findLocalOrder = async (reference: string): Promise<LocalOrder | null> => {
  const value = text(reference)
  if (!value) return null

  const [b2c] = await db
    .select({
      id: b2c_orders.id,
      userId: b2c_orders.user_id,
      orderNumber: b2c_orders.order_number,
      awbNumber: b2c_orders.awb_number,
      shipmentId: b2c_orders.shipment_id,
      orderStatus: b2c_orders.order_status,
    })
    .from(b2c_orders)
    .where(or(eq(b2c_orders.awb_number, value), eq(b2c_orders.shipment_id, value), eq(b2c_orders.order_number, value)))
    .limit(1)

  if (b2c) return { ...b2c, kind: 'b2c' }

  const [b2b] = await db
    .select({
      id: b2b_orders.id,
      userId: b2b_orders.user_id,
      orderNumber: b2b_orders.order_number,
      awbNumber: b2b_orders.awb_number,
      shipmentId: b2b_orders.shipment_id,
      orderStatus: b2b_orders.order_status,
    })
    .from(b2b_orders)
    .where(or(eq(b2b_orders.awb_number, value), eq(b2b_orders.shipment_id, value), eq(b2b_orders.order_number, value)))
    .limit(1)

  return b2b ? { ...b2b, kind: 'b2b' } : null
}

const eventKey = (event: ExpressflyTrackingEvent) =>
  [event.statusCode, event.statusText, event.location, event.eventTime]
    .map((value) => text(value).toLowerCase())
    .join('|')

export const persistExpressflyTracking = async (payload: any, reference?: string) => {
  const normalized = normalizeExpressflyTrackingPayload(payload, reference)
  const lookupReference = normalized.awb || text(reference)
  const order = await findLocalOrder(lookupReference)
  if (!order) return { success: false, reason: 'order_not_found', awb: lookupReference, inserted: 0 }
  if (!normalized.events.length) {
    return { success: false, reason: 'no_tracking_events', awb: order.awbNumber, inserted: 0 }
  }

  const existing = await db
    .select({ statusCode: tracking_events.status_code, statusText: tracking_events.status_text, location: tracking_events.location, raw: tracking_events.raw })
    .from(tracking_events)
    .where(eq(tracking_events.order_id, order.id))
  const keys = new Set(
    existing.map((row) =>
      [row.statusCode, row.statusText, row.location, (row.raw as any)?._expressfly_event_time]
        .map((value) => text(value).toLowerCase())
        .join('|'),
    ),
  )

  let inserted = 0
  for (const event of normalized.events) {
    const key = eventKey(event)
    if (keys.has(key)) continue
    await logTrackingEvent({
      orderId: order.id,
      userId: order.userId,
      awbNumber: order.awbNumber || normalized.awb,
      courier: 'ExpressFly',
      statusCode: event.statusCode,
      statusText: event.statusText,
      location: event.location,
      raw: { ...(event.raw || {}), _expressfly_event_time: event.eventTime },
    })
    keys.add(key)
    inserted += 1
  }

  const latest = normalized.events[normalized.events.length - 1]
  const mappedStatus = mapExpressflyStatus(latest.statusText || latest.statusCode)
  if (mappedStatus) {
    const update = {
      order_status: mappedStatus,
      delivery_location: columnText(latest.location, 100) || null,
      delivery_message: columnText(latest.statusText || latest.statusCode, 100),
      updated_at: new Date(),
    }
    if (order.kind === 'b2c') await db.update(b2c_orders).set(update).where(eq(b2c_orders.id, order.id))
    else await db.update(b2b_orders).set(update).where(eq(b2b_orders.id, order.id))
  }

  return { success: true, awb: order.awbNumber || normalized.awb, orderNumber: order.orderNumber, inserted, totalEvents: normalized.events.length }
}
