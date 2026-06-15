const STORE_SOURCE_KEYS = new Set(['shopify'])

const COURIER_PROVIDER_LABELS = {
  delhivery: 'Delhivery',
  ekart: 'Ekart Logistics',
  xpressbees: 'Xpressbees',
  shadowfax: 'Shadowfax',
  couriercart: 'CourierCart',
}

const cleanString = (value) => {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

const titleCaseProvider = (value) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')

export const getOrderAwbNumber = (order) =>
  cleanString(order?.awb_number) || cleanString(order?.awbNumber)

export const getOrderCourierName = (order) => {
  const awbNumber = getOrderAwbNumber(order)
  const rawPartner = cleanString(order?.courier_partner ?? order?.courierPartner)
  const integration = cleanString(order?.integration_type ?? order?.integrationType)
  const partnerKey = rawPartner.toLowerCase()
  const integrationKey = integration.toLowerCase()

  if (rawPartner && !STORE_SOURCE_KEYS.has(partnerKey)) {
    return COURIER_PROVIDER_LABELS[partnerKey] || rawPartner
  }

  if (COURIER_PROVIDER_LABELS[integrationKey]) {
    return COURIER_PROVIDER_LABELS[integrationKey]
  }

  if (STORE_SOURCE_KEYS.has(partnerKey) || STORE_SOURCE_KEYS.has(integrationKey)) {
    return ''
  }

  if (awbNumber && integration) {
    return titleCaseProvider(integration)
  }

  return rawPartner
}

export const getOrderCourierDisplayName = (order) =>
  getOrderCourierName(order) || order?.display_courier_partner || 'Not Assigned'

export const hasBookedCourier = (order) => Boolean(getOrderCourierName(order))
