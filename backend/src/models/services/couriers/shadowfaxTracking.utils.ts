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

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const normalized = String(value).trim()
    if (normalized) return normalized
  }
  return ''
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

const getFlow = (payload: any): ShadowfaxFlow => {
  const flowText = normalizeText(
    payload?.flow,
    payload?.flow_type,
    payload?.operation_type,
    payload?.operation,
    payload?.order_type,
    payload?.shipment_type,
    payload?.business_type,
  )
  if (flowText.includes('warehouse')) return 'warehouse'
  if (flowText.includes('marketplace')) return 'marketplace'
  return 'unknown'
}

const mapMarketPlaceStatus = (statusId: string, statusText: string) => {
  const status = normalizeStatusId(statusId)
  const text = normalizeText(statusText)
  const signal = `${status} ${text}`.trim()

  if (!signal) return 'in_transit'

  if (
    signal.includes('cancelled_by_seller') ||
    signal.includes('cancelled_by_customer') ||
    signal.includes('cancelled')
  ) {
    return 'cancelled'
  }

  if (
    signal.includes('lost') ||
    signal.includes('seller_not_contactable') ||
    signal.includes('nc') ||
    signal.includes('pickup_not_attempted') ||
    signal.includes('na') ||
    signal.includes('item_misrouted') ||
    signal.includes('reopen_ndr')
  ) {
    return 'ndr'
  }

  if (
    signal.includes('rts_d') ||
    signal.includes('returned_to_client') ||
    signal.includes('returned to client') ||
    signal.includes('return_delivered')
  ) {
    return 'rto_delivered'
  }

  if (
    signal.includes('rts') ||
    signal.includes('rto') ||
    signal.includes('in_transit_return') ||
    signal.includes('recd_at_rev_hub') ||
    signal.includes('rts_in_process') ||
    signal.includes('rts_nd') ||
    signal.includes('rts_ofd')
  ) {
    return 'rto_in_transit'
  }

  if (signal.includes('delivered')) return 'delivered'
  if (signal.includes('ofd') || signal.includes('assigned_for_delivery')) return 'out_for_delivery'
  if (signal.includes('hold') || signal.includes('cid') || signal.includes('delay')) return 'on_hold'
  if (signal.includes('pickup') || signal.includes('assigned_for_seller_pickup')) {
    return 'pickup_initiated'
  }
  if (signal.includes('manifest') || signal.includes('new')) return 'booked'
  if (signal.includes('hub') || signal.includes('dc') || signal.includes('bag')) return 'in_transit'
  if (signal.includes('picked')) return 'in_transit'

  return 'in_transit'
}

const mapWarehouseStatus = (statusId: string, statusText: string) => {
  const status = normalizeStatusId(statusId)
  const text = normalizeText(statusText)
  const signal = `${status} ${text}`.trim()

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
    signal.includes('returned to client') ||
    signal.includes('return_to_origin delivered')
  ) {
    return 'rto_delivered'
  }
  if (
    signal.includes('rto') ||
    signal.includes('in_transit_return') ||
    signal.includes('recd_at_rev_hub')
  ) {
    return 'rto_in_transit'
  }
  if (signal.includes('delivered')) return 'delivered'
  if (signal.includes('ofd') || signal.includes('assigned_for_delivery')) return 'out_for_delivery'
  if (signal.includes('hold') || signal.includes('cid')) return 'on_hold'
  if (signal.includes('pickup') || signal.includes('received_from_client_warehouse')) {
    return 'pickup_initiated'
  }
  if (signal.includes('manifest') || signal.includes('new')) return 'booked'
  return 'in_transit'
}

export const mapShadowfaxStatusToInternal = (
  statusId?: unknown,
  statusText?: unknown,
  flow?: ShadowfaxFlow,
) => {
  const id = normalizeStatusId(statusId)
  const text = pickString(statusText)
  const detectedFlow = flow || getFlow({ flow })

  if (detectedFlow === 'warehouse') {
    return mapWarehouseStatus(id, text)
  }

  return mapMarketPlaceStatus(id, text)
}

export const extractShadowfaxTrackingUpdate = (payload: any): ShadowfaxTrackingUpdate => {
  const body = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  const flow = getFlow(payload)
  const statusId = pickString(
    body?.status_id,
    body?.statusId,
    body?.status_code,
    body?.statusCode,
    body?.status,
    body?.current_status,
    body?.state,
    payload?.status_id,
    payload?.statusId,
    payload?.status_code,
    payload?.statusCode,
    payload?.status,
    payload?.current_status,
    payload?.state,
  )
  const statusText = pickString(
    body?.status,
    body?.status_name,
    body?.statusName,
    body?.remark,
    body?.remarks,
    body?.description,
    body?.message,
    payload?.status,
    payload?.status_name,
    payload?.remark,
    payload?.remarks,
    payload?.description,
    payload?.message,
  )

  return {
    flow,
    awb: pickString(
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
    ) || null,
    referenceNo: pickString(
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
      ) || null,
    description:
      pickString(
        body?.description,
        body?.desc,
        body?.details,
        payload?.description,
        payload?.desc,
        payload?.details,
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
      ) || null,
    internalStatus: mapShadowfaxStatusToInternal(statusId, statusText, flow),
    raw: payload,
  }
}
