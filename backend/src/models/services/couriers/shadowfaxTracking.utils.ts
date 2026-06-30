type ShadowfaxFlow = 'marketplace' | 'warehouse' | 'unknown'

export type ShadowfaxTrackingUpdate = {
  flow: ShadowfaxFlow
  awb: string | null
  referenceNo: string | null
  statusId: string
  statusText: string
  remark: string | null
  description: string | null
  location: string | null
  eventTime: string | null
  internalStatus: string
  raw: any
}

const MARKETPLACE_ONLY_STATUS_IDS = new Set([
  'assigned_for_seller_pickup',
  'ofp',
  'recd_at_rev_hub',
  'cancelled_by_seller',
  'seller_initiated_delay',
  'seller_not_contactable',
  'pickup_not_attempted',
  'rts',
  'rts_d',
  'rts_in_process',
  'rts_ofd',
  'rts_nd',
  'pickup_on_hold',
])

const WAREHOUSE_ONLY_STATUS_IDS = new Set([
  'received_from_client_warehouse',
  'rto',
  'rto_d',
])

const PICKUP_INITIATION_HINTS = [
  'assigned_for_seller_pickup',
  'assigned for seller pickup',
  'assigned for pickup',
  'pickup scheduled',
  'pickup requested',
  'pickup request created',
  'pickup created',
  'pickup booked',
  'pickup assigned',
  'collection scheduled',
  'collection booked',
  'manifest generated',
]

const hasPickupInitiationSignal = (signal: string) =>
  PICKUP_INITIATION_HINTS.some((hint) => signal.includes(hint))

const MARKETPLACE_STATUS_MAP: Record<string, string> = {
  new: 'booked',
  picked: 'in_transit',
  assigned_for_seller_pickup: 'pickup_initiated',
  ofp: 'pickup_initiated',
  recd_at_rev_hub: 'rto_in_transit',
  item_manifested: 'in_transit',
  recd_at_fwd_hub: 'in_transit',
  recd_at_fwd_dc: 'in_transit',
  cancelled_by_seller: 'cancelled',
  assigned_for_delivery: 'out_for_delivery',
  ofd: 'out_for_delivery',
  delivered: 'delivered',
  cid: 'on_hold',
  seller_initiated_delay: 'on_hold',
  seller_not_contactable: 'ndr',
  nc: 'ndr',
  pickup_not_attempted: 'ndr',
  na: 'ndr',
  cancelled_by_customer: 'cancelled',
  rts: 'rto_in_transit',
  rts_d: 'rto_delivered',
  rts_in_process: 'rto_in_transit',
  rts_ofd: 'rto_in_transit',
  rts_nd: 'ndr',
  lost: 'ndr',
  on_hold: 'on_hold',
  pickup_on_hold: 'on_hold',
  reopen_ndr: 'ndr',
  in_transit_return: 'rto_in_transit',
  bag_received: 'in_transit',
  bag_received_at_via: 'in_transit',
  bag_in_transit: 'in_transit',
  pincode_updated: 'in_transit',
  item_misrouted: 'ndr',
}

const WAREHOUSE_STATUS_MAP: Record<string, string> = {
  new: 'booked',
  received_from_client_warehouse: 'pickup_initiated',
  item_manifested: 'in_transit',
  bag_in_transit: 'in_transit',
  bag_received_at_via: 'in_transit',
  bag_received: 'in_transit',
  ofd: 'out_for_delivery',
  cid: 'on_hold',
  on_hold: 'on_hold',
  reopen_ndr: 'ndr',
  delivered: 'delivered',
  rto: 'rto',
  rto_d: 'rto_delivered',
  lost: 'ndr',
  item_misrouted: 'ndr',
  pincode_updated: 'in_transit',
  in_transit_return: 'rto_in_transit',
  recd_at_fwd_dc: 'in_transit',
  recd_at_fwd_hub: 'in_transit',
  assigned_for_delivery: 'out_for_delivery',
  nc: 'ndr',
  na: 'ndr',
  cancelled_by_customer: 'cancelled',
}

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const normalized = String(value).trim()
    if (normalized) return normalized
  }
  return ''
}

const getShadowfaxBody = (payload: any) => {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  if (Array.isArray(payload?.data) && payload.data.length > 0) {
    return payload.data[0]
  }
  return payload
}

const getShadowfaxOrderDetails = (payload: any) => {
  const body = getShadowfaxBody(payload)
  const orderDetails =
    body?.order_details && typeof body.order_details === 'object'
      ? body.order_details
      : payload?.order_details && typeof payload.order_details === 'object'
        ? payload.order_details
        : payload?.data?.order_details && typeof payload.data.order_details === 'object'
          ? payload.data.order_details
          : null

  return orderDetails
}

const getShadowfaxTrackingDetails = (payload: any) => {
  const body = getShadowfaxBody(payload)

  if (Array.isArray(body?.tracking_details)) return body.tracking_details
  if (Array.isArray(payload?.tracking_details)) return payload.tracking_details
  if (Array.isArray(payload?.data?.tracking_details)) return payload.data.tracking_details

  return []
}

const normalizeStatusId = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

const normalizeText = (...values: unknown[]) =>
  values
    .map((value) =>
      String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' '),
    )
    .filter(Boolean)
    .join(' ')

const detectFlowFromStatusId = (statusId: string): ShadowfaxFlow => {
  if (!statusId) return 'unknown'
  if (WAREHOUSE_ONLY_STATUS_IDS.has(statusId)) return 'warehouse'
  if (MARKETPLACE_ONLY_STATUS_IDS.has(statusId)) return 'marketplace'
  return 'unknown'
}

const getFlow = (payload: any, statusId?: string, statusText?: string): ShadowfaxFlow => {
  const flowText = normalizeText(
    payload?.flow,
    payload?.flow_type,
    payload?.operation_type,
    payload?.operation,
    payload?.order_type,
    payload?.shipment_type,
    payload?.business_type,
  )

  if (flowText.includes('warehouse') || flowText.includes('client warehouse')) {
    return 'warehouse'
  }
  if (flowText.includes('marketplace') || flowText.includes('seller pickup')) {
    return 'marketplace'
  }

  const statusHint = detectFlowFromStatusId(normalizeStatusId(statusId))
  if (statusHint !== 'unknown') return statusHint

  const signal = normalizeText(statusId, statusText)
  if (
    signal.includes('received from client warehouse') ||
    signal.includes('forward dc') ||
    signal.includes('forward hub') ||
    signal.includes('return to origin')
  ) {
    return 'warehouse'
  }
  if (
    signal.includes('seller pickup') ||
    signal.includes('reverse hub') ||
    signal.includes('return to seller') ||
    signal.includes('marketplace')
  ) {
    return 'marketplace'
  }

  return 'unknown'
}

const mapMarketplaceFallback = (statusId: string, statusText: string) => {
  const signal = normalizeText(statusId, statusText)
  if (!signal) return 'in_transit'

  if (signal.includes('cancelled')) return 'cancelled'
  if (
    signal.includes('lost') ||
    signal.includes('item_misrouted') ||
    signal.includes('seller_not_contactable') ||
    signal.includes('pickup_not_attempted') ||
    signal.includes('nc') ||
    signal.includes('na') ||
    signal.includes('reopen_ndr')
  ) {
    return 'ndr'
  }
  if (
    signal.includes('rts_d') ||
    signal.includes('rto delivered') ||
    signal.includes('returned to client') ||
    signal.includes('return_delivered')
  ) {
    return 'rto_delivered'
  }
  if (
    signal.includes('rts') ||
    signal.includes('rto') ||
    signal.includes('in_transit_return') ||
    signal.includes('reverse hub')
  ) {
    return 'rto_in_transit'
  }
  if (signal.includes('delivered')) return 'delivered'
  if (
    signal.includes('ofd') ||
    signal.includes('assigned for delivery') ||
    signal.includes('out for delivery')
  ) {
    return 'out_for_delivery'
  }
  if (signal.includes('hold') || signal.includes('cid') || signal.includes('delay')) return 'on_hold'
  if (signal.includes('pickup') || hasPickupInitiationSignal(signal)) {
    return 'pickup_initiated'
  }
  if (signal.includes('new')) return 'booked'
  if (signal.includes('manifest')) return 'booked'
  if (
    signal.includes('hub') ||
    signal.includes('dc') ||
    signal.includes('bag') ||
    signal.includes('picked')
  ) {
    return 'in_transit'
  }
  return 'in_transit'
}

const mapWarehouseFallback = (statusId: string, statusText: string) => {
  const signal = normalizeText(statusId, statusText)
  if (!signal) return 'in_transit'

  if (signal.includes('cancelled')) return 'cancelled'
  if (
    signal.includes('lost') ||
    signal.includes('item_misrouted') ||
    signal.includes('na') ||
    signal.includes('nc') ||
    signal.includes('reopen_ndr')
  ) {
    return 'ndr'
  }
  if (
    signal.includes('rto_d') ||
    signal.includes('rto delivered') ||
    signal.includes('returned to client') ||
    signal.includes('return to origin delivered')
  ) {
    return 'rto_delivered'
  }
  if (signal.includes('rto')) return 'rto'
  if (signal.includes('in_transit_return')) return 'rto_in_transit'
  if (signal.includes('delivered')) return 'delivered'
  if (
    signal.includes('ofd') ||
    signal.includes('assigned for delivery') ||
    signal.includes('out for delivery')
  ) {
    return 'out_for_delivery'
  }
  if (signal.includes('hold') || signal.includes('cid')) return 'on_hold'
  if (
    signal.includes('received from client warehouse') ||
    signal.includes('pickup') ||
    hasPickupInitiationSignal(signal)
  ) {
    return 'pickup_initiated'
  }
  if (signal.includes('new')) return 'booked'
  if (signal.includes('manifest')) return 'booked'
  return 'in_transit'
}

export const mapShadowfaxStatusToInternal = (
  statusId?: unknown,
  statusText?: unknown,
  flow?: ShadowfaxFlow,
) => {
  const id = normalizeStatusId(statusId)
  const text = pickString(statusText)
  const detectedFlow = flow || detectFlowFromStatusId(id)

  if (detectedFlow === 'warehouse') {
    return WAREHOUSE_STATUS_MAP[id] || mapWarehouseFallback(id, text)
  }

  if (detectedFlow === 'marketplace') {
    return MARKETPLACE_STATUS_MAP[id] || mapMarketplaceFallback(id, text)
  }

  return (
    MARKETPLACE_STATUS_MAP[id] ||
    WAREHOUSE_STATUS_MAP[id] ||
    mapMarketplaceFallback(id, text) ||
    mapWarehouseFallback(id, text)
  )
}

export const extractShadowfaxTrackingUpdate = (payload: any): ShadowfaxTrackingUpdate => {
  const body = getShadowfaxBody(payload)
  const orderDetails = getShadowfaxOrderDetails(payload)
  const trackingDetails = getShadowfaxTrackingDetails(payload)
  const latestTrackingEvent =
    trackingDetails.length > 0 ? trackingDetails[trackingDetails.length - 1] : null

  const statusId = pickString(
    body?.status_id,
    body?.statusId,
    body?.status_code,
    body?.statusCode,
    body?.state,
    payload?.status_id,
    payload?.statusId,
    payload?.status_code,
    payload?.statusCode,
    payload?.state,
    latestTrackingEvent?.status_id,
    latestTrackingEvent?.statusId,
    latestTrackingEvent?.status_code,
    latestTrackingEvent?.statusCode,
    latestTrackingEvent?.status,
    latestTrackingEvent?.current_status,
    body?.status,
    body?.current_status,
    payload?.status,
    payload?.current_status,
    orderDetails?.status,
    orderDetails?.status_display,
  )
  const statusText = pickString(
    body?.status,
    body?.status_name,
    body?.statusName,
    body?.status_text,
    body?.statusText,
    body?.status_description,
    body?.statusDescription,
    body?.status_label,
    body?.statusLabel,
    body?.tracking_status,
    body?.trackingStatus,
    body?.remark,
    body?.remarks,
    body?.description,
    body?.message,
    payload?.status,
    payload?.status_name,
    payload?.status_text,
    payload?.statusText,
    payload?.status_description,
    payload?.statusDescription,
    payload?.status_label,
    payload?.statusLabel,
    payload?.tracking_status,
    payload?.trackingStatus,
    payload?.remark,
    payload?.remarks,
    payload?.description,
    payload?.message,
    latestTrackingEvent?.remarks,
    latestTrackingEvent?.remark,
    latestTrackingEvent?.status,
    latestTrackingEvent?.status_id,
    orderDetails?.status_display,
    orderDetails?.status,
  )
  const flow = getFlow(payload, statusId, statusText)

  return {
    flow,
    awb:
      pickString(
        body?.awb,
        body?.awb_number,
        body?.waybill,
        body?.waybill_number,
        body?.tracking_number,
        body?.tracking_id,
        body?.order_awb,
        payload?.awb,
        payload?.awb_number,
        payload?.waybill,
        payload?.tracking_number,
        payload?.tracking_id,
        payload?.order_awb,
        latestTrackingEvent?.awb_number,
        latestTrackingEvent?.awb,
        orderDetails?.awb_number,
        orderDetails?.awb,
      ) || null,
    referenceNo:
      pickString(
        body?.reference_no,
        body?.referenceNo,
        body?.order_id,
        body?.orderId,
        body?.order_number,
        body?.orderNumber,
        body?.shipment_id,
        payload?.reference_no,
        payload?.referenceNo,
        payload?.order_id,
        payload?.orderId,
        payload?.order_number,
        payload?.shipment_id,
        latestTrackingEvent?.reference_no,
        latestTrackingEvent?.referenceNo,
        orderDetails?.client_order_id,
        orderDetails?.order_id,
        orderDetails?.order_number,
      ) || null,
    statusId: statusId || 'unknown',
    statusText: statusText || statusId || 'unknown',
    remark:
      pickString(
        body?.remark,
        body?.remarks,
        body?.reason,
        body?.message,
        payload?.remark,
        payload?.remarks,
        payload?.reason,
        payload?.message,
        latestTrackingEvent?.remarks,
        latestTrackingEvent?.remark,
        latestTrackingEvent?.status,
        orderDetails?.status_display,
      ) || null,
    description:
      pickString(
        body?.description,
        body?.desc,
        body?.details,
        payload?.description,
        payload?.desc,
        payload?.details,
        orderDetails?.status_display,
      ) || null,
    location:
      pickString(
        body?.location,
        body?.hub,
        body?.hub_name,
        body?.facility_name,
        payload?.location,
        payload?.hub,
        payload?.hub_name,
        payload?.facility_name,
        latestTrackingEvent?.location,
        orderDetails?.destination_hub,
        orderDetails?.pickup_details?.city,
      ) || null,
    eventTime:
      pickString(
        body?.event_time,
        body?.eventTime,
        body?.timestamp,
        body?.updated_at,
        payload?.event_time,
        payload?.eventTime,
        payload?.timestamp,
        payload?.updated_at,
        body?.event_timestamp,
        payload?.event_timestamp,
        latestTrackingEvent?.created,
        latestTrackingEvent?.updated_at,
        orderDetails?.updated_at,
      ) || null,
    internalStatus: mapShadowfaxStatusToInternal(statusId, statusText, flow),
    raw: payload,
  }
}
