type DelhiveryScanEvent = {
  statusCode: string
  statusText: string
  location: string
  eventTime: string | null
  instructions: string | null
  raw: any
}

export type DelhiveryTrackingUpdate = {
  shipment: any
  statusInfo: any
  waybill: string | null
  referenceNo: string | null
  rawStatus: string
  statusType: string
  statusCode: string
  internalStatus: string
  location: string | null
  instructions: string | null
  eventTime: string | null
  edd: string | null
  courierCost: number | null
  scannedWeight: number | null
  chargedWeight: number | null
  volumetricWeight: number | null
  scanEvents: DelhiveryScanEvent[]
}

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const normalized = String(value).trim()
    if (normalized) return normalized
  }
  return ''
}

const pickNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return null
}

const normalizeText = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')

const getTimeValue = (value: string | null) => {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

const getShipmentWrapper = (payload: any) => {
  if (payload?.Shipment) return payload
  if (Array.isArray(payload?.ShipmentData)) return payload.ShipmentData[0] || {}
  if (payload?.ShipmentData?.Shipment) return payload.ShipmentData
  if (payload?.shipment) return { Shipment: payload.shipment }
  return payload || {}
}

const getStatusObject = (shipment: any, payload: any) => {
  const status = shipment?.Status ?? shipment?.status ?? payload?.Status ?? payload?.status
  return status && typeof status === 'object' ? status : {}
}

const getScanDetails = (shipment: any): any[] => {
  const scans = shipment?.Scans ?? shipment?.scans ?? shipment?.Scan ?? shipment?.scan
  if (!scans) return []

  if (Array.isArray(scans)) {
    return scans
      .map((entry) => entry?.ScanDetail ?? entry?.scanDetail ?? entry?.scan_detail ?? entry)
      .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
      .filter(Boolean)
  }

  const detail = scans?.ScanDetail ?? scans?.scanDetail ?? scans?.scan_detail ?? scans
  return (Array.isArray(detail) ? detail : [detail]).filter(Boolean)
}

const delhiveryNdrStatusCodes = new Set([
  'eod-3',
  'eod-6',
  'eod-11',
  'eod-15',
  'eod-16',
  'eod-43',
  'eod-69',
  'eod-74',
  'eod-86',
  'eod-104',
  'st-108',
])

const isKnownNdrStatusCode = (statusCode?: unknown) => {
  const code = normalizeText(statusCode).replace(/\s+/g, '-')
  return delhiveryNdrStatusCodes.has(code)
}

export const mapDelhiveryStatusToInternal = (
  statusType?: unknown,
  status?: unknown,
  instructionText?: unknown,
  statusCode?: unknown,
): string => {
  const type = pickString(statusType).toUpperCase()
  const statusText = normalizeText(status)
  const code = normalizeText(statusCode)
  const instruction = normalizeText(instructionText)
  const signal = [type.toLowerCase(), statusText, code, instruction].filter(Boolean).join(' ')

  if (isKnownNdrStatusCode(statusCode)) {
    return 'ndr'
  }

  if (
    signal.includes('seller cancelled') ||
    signal.includes('seller canceled') ||
    signal.includes('shipment has been cancelled') ||
    signal.includes('shipment has been canceled') ||
    signal.includes('cancelled') ||
    signal.includes('canceled') ||
    type === 'CN'
  ) {
    return 'cancelled'
  }

  if (type === 'DL') {
    if (statusText.includes('rto')) return 'rto_delivered'
    if (statusText.includes('dto')) return 'delivered'
    if (statusText.includes('delivered')) return 'delivered'
  }

  if (
    statusText.includes('rto delivered') ||
    signal.includes('return delivered') ||
    signal.includes('delivered to origin')
  ) {
    return 'rto_delivered'
  }

  if (type === 'RT' || signal.includes('return to origin') || signal.includes('rto')) {
    if (statusText.includes('pending')) return 'rto'
    if (statusText.includes('delivered')) return 'rto_delivered'
    return 'rto_in_transit'
  }

  if (
    type === 'ND' ||
    signal.includes('ndr') ||
    signal.includes('undelivered') ||
    signal.includes('not delivered') ||
    signal.includes('delivery attempted') ||
    signal.includes('attempted') ||
    signal.includes('customer not available') ||
    signal.includes('consignee not available') ||
    signal.includes('door locked') ||
    signal.includes('premises closed') ||
    signal.includes('address issue') ||
    signal.includes('incorrect address') ||
    signal.includes('refused') ||
    signal.includes('otp')
  ) {
    return 'ndr'
  }

  if (type === 'PP') {
    if (statusText.includes('dispatched')) return 'pickup_initiated'
    return 'pickup_initiated'
  }

  if (type === 'PU') {
    if (statusText.includes('dispatched')) return 'out_for_delivery'
    return 'in_transit'
  }

  if (
    statusText.includes('out for delivery') ||
    statusText.includes('ofd') ||
    statusText.includes('dispatched')
  ) {
    return 'out_for_delivery'
  }

  if (statusText.includes('delivered')) return 'delivered'

  if (
    statusText.includes('manifested') ||
    statusText.includes('manifest') ||
    statusText.includes('softdata') ||
    statusText.includes('data uploaded') ||
    statusText.includes('booked')
  ) {
    return 'booked'
  }

  if (
    statusText.includes('not picked') ||
    statusText.includes('pickup scheduled') ||
    statusText.includes('pickup requested') ||
    statusText.includes('pickup') ||
    statusText === 'open' ||
    statusText === 'scheduled'
  ) {
    return 'pickup_initiated'
  }

  if (
    statusText.includes('in transit') ||
    statusText.includes('transit') ||
    statusText.includes('pending') ||
    statusText.includes('reached') ||
    statusText.includes('arrived')
  ) {
    return 'in_transit'
  }

  if (type === 'UD') {
    if (statusText === 'manifested') return 'booked'
    if (statusText === 'not picked') return 'pickup_initiated'
    if (statusText === 'dispatched') return 'out_for_delivery'
    return 'in_transit'
  }

  return statusText ? 'in_transit' : 'unknown'
}

export const extractDelhiveryTrackingUpdate = (payload: any): DelhiveryTrackingUpdate => {
  const wrapper = getShipmentWrapper(payload)
  const shipment = wrapper?.Shipment ?? wrapper?.shipment ?? wrapper ?? {}
  const statusInfo = getStatusObject(shipment, payload)
  const scanEvents = getScanDetails(shipment)
    .map((detail): DelhiveryScanEvent => {
      const statusCode = pickString(
        detail?.ScanType,
        detail?.StatusType,
        detail?.StatusCode,
        detail?.statusType,
        detail?.status_type,
        detail?.statusCode,
        detail?.status_code,
      )
      const statusText = pickString(
        detail?.ScanStatus,
        detail?.Status,
        detail?.statusText,
        detail?.status_text,
        detail?.scanStatus,
        detail?.scan_status,
        detail?.status,
        detail?.Instructions,
        detail?.Remarks,
        detail?.Scan,
      )
      return {
        statusCode,
        statusText,
        location: pickString(
          detail?.ScanLocation,
          detail?.ScannedLocation,
          detail?.StatusLocation,
          detail?.Location,
          detail?.scanLocation,
          detail?.scan_location,
          detail?.current_location,
          detail?.location,
        ),
        eventTime:
          pickString(
            detail?.ScanDateTime,
            detail?.StatusDateTime,
            detail?.ScanDate,
            detail?.ScanTime,
            detail?.scanDateTime,
            detail?.scan_datetime,
            detail?.statusDateTime,
            detail?.status_datetime,
            detail?.scan_time,
          ) || null,
        instructions: pickString(detail?.Instructions, detail?.Remarks, detail?.message) || null,
        raw: detail,
      }
    })
    .sort((a, b) => getTimeValue(b.eventTime) - getTimeValue(a.eventTime))

  const latestScan = scanEvents[0]
  const statusValue =
    typeof shipment?.Status === 'string'
      ? shipment.Status
      : typeof payload?.Status === 'string'
        ? payload.Status
        : ''

  const rawStatus = pickString(
    statusInfo?.Status,
    statusInfo?.status,
    statusValue,
    shipment?.current_status,
    shipment?.CurrentStatus,
    shipment?.status_display,
    shipment?.shipment_status,
    shipment?.scan_status,
    shipment?.status,
    payload?.CurrentStatus,
    payload?.current_status,
    payload?.status_display,
    payload?.shipment_status,
    payload?.scan_status,
    payload?.status,
    payload?.event,
    latestScan?.statusText,
  )
  const statusType = pickString(
    statusInfo?.StatusType,
    statusInfo?.status_type,
    statusInfo?.statusType,
    shipment?.StatusType,
    shipment?.statusType,
    shipment?.status_type,
    payload?.StatusType,
    payload?.statusType,
    payload?.status_type,
    payload?.scan_type,
    latestScan?.statusCode,
  )
  const statusCode = pickString(
    statusInfo?.StatusCode,
    statusInfo?.status_code,
    statusInfo?.statusCode,
    shipment?.StatusCode,
    shipment?.statusCode,
    shipment?.status_code,
    payload?.StatusCode,
    payload?.statusCode,
    payload?.status_code,
    payload?.scan_code,
    latestScan?.statusCode,
  )
  const instructions = pickString(
    statusInfo?.Instructions,
    statusInfo?.instructions,
    statusInfo?.Remark,
    statusInfo?.Remarks,
    statusInfo?.remark,
    statusInfo?.remarks,
    shipment?.Instructions,
    shipment?.instructions,
    shipment?.Remarks,
    shipment?.Remark,
    shipment?.ndr_reason,
    shipment?.NDRReason,
    shipment?.Reason,
    shipment?.reason,
    payload?.Instructions,
    payload?.instructions,
    payload?.NDRReason,
    payload?.ndr_reason,
    payload?.Reason,
    payload?.reason,
    payload?.remarks,
    payload?.Remarks,
    payload?.remark,
    payload?.Remark,
    payload?.message,
    latestScan?.instructions,
  )
  const location = pickString(
    statusInfo?.StatusLocation,
    statusInfo?.StatusLocationName,
    statusInfo?.Location,
    shipment?.StatusLocation,
    shipment?.current_location,
    shipment?.CurrentLocation,
    shipment?.location,
    shipment?.last_location,
    payload?.current_location,
    payload?.CurrentLocation,
    payload?.location,
    payload?.scan_location,
    payload?.last_location,
    latestScan?.location,
  )
  const eventTime = pickString(
    statusInfo?.StatusDateTime,
    statusInfo?.StatusDate,
    statusInfo?.status_datetime,
    shipment?.StatusDateTime,
    shipment?.statusDateTime,
    shipment?.status_datetime,
    payload?.StatusDateTime,
    payload?.statusDateTime,
    payload?.status_datetime,
    payload?.scan_time,
    latestScan?.eventTime,
  )

  const waybill = pickString(
    shipment?.AWB,
    shipment?.Awb,
    shipment?.awb,
    shipment?.waybill,
    shipment?.Waybill,
    shipment?.WayBill,
    shipment?.wbn,
    shipment?.tracking_number,
    shipment?.awb_number,
    wrapper?.AWB,
    wrapper?.waybill,
    wrapper?.wbn,
    payload?.AWB,
    payload?.Awb,
    payload?.awb,
    payload?.wbn,
    payload?.awb_number,
    payload?.tracking_number,
    payload?.trackingNumber,
    payload?.waybill_no,
    payload?.waybill,
    payload?.tracking_id,
  )
  const referenceNo = pickString(
    shipment?.ReferenceNo,
    shipment?.ReferenceNumber,
    shipment?.ref_no,
    shipment?.reference_no,
    shipment?.client_order_id,
    shipment?.OrderId,
    shipment?.order_id,
    shipment?.Order,
    shipment?.order,
    payload?.ReferenceNo,
    payload?.ReferenceNumber,
    payload?.ref_no,
    payload?.reference_no,
    payload?.client_order_id,
    payload?.order_number,
    payload?.orderNumber,
    payload?.order_id,
  )

  return {
    shipment,
    statusInfo,
    waybill: waybill || null,
    referenceNo: referenceNo || null,
    rawStatus,
    statusType,
    statusCode,
    internalStatus: mapDelhiveryStatusToInternal(statusType, rawStatus, instructions, statusCode),
    location: location || null,
    instructions: instructions || null,
    eventTime: eventTime || null,
    edd: pickString(
      shipment?.ExpectedDeliveryDate,
      shipment?.EDD,
      shipment?.edd,
      payload?.ExpectedDeliveryDate,
      payload?.EDD,
      payload?.edd,
    ) || null,
    courierCost: pickNumber(
      shipment?.Charge,
      shipment?.Amount,
      shipment?.BillingAmount,
      shipment?.TotalCharge,
      shipment?.FreightCharges,
      shipment?.cost,
      payload?.courier_cost,
      payload?.freight_charges,
    ),
    scannedWeight: pickNumber(
      latestScan?.raw?.ScannedWeight,
      latestScan?.raw?.scanned_weight,
      payload?.scanned_weight,
    ),
    chargedWeight: pickNumber(
      shipment?.ChargedWeight,
      shipment?.charged_weight,
      latestScan?.raw?.ScannedWeight,
      latestScan?.raw?.scanned_weight,
      payload?.charged_weight,
      payload?.chargeable_weight,
    ),
    volumetricWeight: pickNumber(
      shipment?.VolumetricWeight,
      shipment?.volumetric_weight,
      payload?.volumetric_weight,
    ),
    scanEvents,
  }
}
