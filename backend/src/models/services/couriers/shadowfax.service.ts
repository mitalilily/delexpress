import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import {
  ShadowfaxConfig,
  getEffectiveCourierConfig,
} from '../courierCredentials.service'

export const DEFAULT_SHADOWFAX_STAGING_BASE_API = 'https://dale.staging.shadowfax.in/api'
export const DEFAULT_SHADOWFAX_BASE_API = 'https://dale.shadowfax.in/api'
export const DEFAULT_SHADOWFAX_SERVICEABILITY_PATH = '/v1/clients/serviceability/'
export const DEFAULT_SHADOWFAX_ORDER_PATH = '/v3/clients/orders/'
export const DEFAULT_SHADOWFAX_ORDER_UPDATE_PATH = '/v3/clients/order_update/'
export const DEFAULT_SHADOWFAX_ORDER_CANCEL_PATH = '/v3/clients/orders/cancel/'
export const DEFAULT_SHADOWFAX_SUPPORT_ISSUE_PATH = '/v1/clients/support/issue/'
export const DEFAULT_SHADOWFAX_POD_DETAILS_PATH = '/v1/clients/pod_details/'
export const DEFAULT_SHADOWFAX_AWB_PATH = '/v3/clients/generate_marketplace_awb/'
export const DEFAULT_SHADOWFAX_TRACK_PATH = '/v4/clients/orders'

export type ShadowfaxServiceName =
  | 'seller_pickup'
  | 'customer_delivery'
  | 'customer_pickup'
  | 'seller_delivery'
  | 'warehouse_pickup'
  | 'warehouse_return'

export type ShadowfaxServiceabilityRecord = {
  code: number
  services: string[]
}

export type ShadowfaxServiceabilityResult = {
  service: ShadowfaxServiceName
  page: number
  count: number
  pincodes: string[]
  serviceable: boolean
  records: ShadowfaxServiceabilityRecord[]
  raw: any
}

export type ShadowfaxOrderType = 'marketplace' | 'warehouse'

export type ShadowfaxAddress = {
  name: string
  contact: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  pincode: number | string
  latitude?: string
  longitude?: string
  unique_code?: string
  email?: string
}

export type ShadowfaxOrderDetails = {
  client_order_id: string
  actual_weight?: number
  volumetric_weight?: number
  product_value: number
  payment_mode: string
  cod_amount: number
  promised_delivery_date?: string
  total_amount?: number
  eway_bill?: string
  gstin_number?: string
  order_service?: string
}

export type ShadowfaxProductDetail = {
  hsn_code?: string
  invoice_no?: string
  sku_name?: string
  sku_id?: string
  category?: string
  price?: number
  seller_details?: {
    seller_name?: string
    seller_address?: string
    seller_state?: string
    gstin_number?: string
  }
  taxes?: {
    cgst?: number
    sgst?: number
    igst?: number
    total_tax?: number
  }
  additional_details?: Record<string, any>
}

export type ShadowfaxCreateOrderParams = {
  orderType: ShadowfaxOrderType
  orderDetails: ShadowfaxOrderDetails
  customerDetails: ShadowfaxAddress
  pickupDetails: ShadowfaxAddress
  returnDetails: ShadowfaxAddress
  productDetails: ShadowfaxProductDetail[]
}

export type ShadowfaxCreateOrderResult = {
  successful: boolean
  status: string | null
  message: string
  awbNumber: string | null
  orderId: string | null
  shippingProviderName: string
  shippingProviderCode: string | null
  label: string | null
  manifest: string | null
  raw: any
}

export type ShadowfaxAwbGenerationResult = {
  successful: boolean
  status: string | null
  message: string
  count: number
  awbNumbers: string[]
  raw: any
}

export type ShadowfaxOrderTrackingEvent = {
  created?: string | null
  location?: string | null
  status_id?: string | null
  status?: string | null
  remarks?: string | null
  awb_number?: string | null
}

export type ShadowfaxOrderDetailsResult = {
  successful: boolean
  status: string | null
  message: string
  awbNumber: string | null
  orderId: string | null
  orderDetails: Record<string, any> | null
  trackingDetails: ShadowfaxOrderTrackingEvent[]
  latestTrackingEvent: ShadowfaxOrderTrackingEvent | null
  raw: any
}

export type ShadowfaxBulkOrderDetailsResult = {
  successful: boolean
  status: string | null
  message: string
  count: number
  awbNumbers: string[]
  orders: ShadowfaxOrderDetailsResult[]
  raw: any
}

export type ShadowfaxOrderUpdateSection = {
  contact?: string | null
  latitude?: string | null
  longitude?: string | null
  alternate_contact?: string | null
  customer_address?: string | null
  return_address?: string | null
  pincode?: number | string | null
  email?: string | null
  capture_delivery_image?: boolean | null
}

export type ShadowfaxOrderUpdateOrderDetails = {
  cod_amount?: number | string | null
  eway_bill_number?: string | null
  invoice_number?: string | null
  return_eway_bill_number?: string | null
  actual_weight?: number | string | null
  volumetric_weight?: number | string | null
}

export type ShadowfaxOrderUpdateParams = {
  awbNumber: string
  delivery_details?: ShadowfaxOrderUpdateSection | null
  pickup_details?: ShadowfaxOrderUpdateSection | null
  return_details?: ShadowfaxOrderUpdateSection | null
  order_details?: ShadowfaxOrderUpdateOrderDetails | null
  status_update?: {
    status?: string | null
  } | null
}

export type ShadowfaxOrderUpdateResult = {
  successful: boolean
  status: string | null
  message: string
  awbNumber: string | null
  raw: any
}

export type ShadowfaxCancelShipmentParams = {
  requestId: string
  cancelRemarks?: string
}

export type ShadowfaxCancelShipmentResult = {
  successful: boolean
  status: number | null
  message: string
  responseCode: number | null
  responseMsg: string | null
  requestId: string | null
  raw: any
}

export type ShadowfaxIssueCategory = 1 | 2 | 3 | 4 | 5

export type ShadowfaxSupportIssueParams = {
  awbNumber: string
  issueCategory: ShadowfaxIssueCategory
}

export type ShadowfaxSupportIssueResult = {
  successful: boolean
  status: string | null
  message: string
  awbNumber: string | null
  issueCategory: ShadowfaxIssueCategory | null
  raw: any
}

export type ShadowfaxPODDetailRecord = {
  recipient: string | null
  recipient_contact: string | null
  recipient_signature: string | string[] | null
  recipient_name: string | null
}

export type ShadowfaxPODDetailsResult = {
  successful: boolean
  status: string | null
  message: string
  count: number
  awbNumbers: string[]
  podDetails: Record<string, ShadowfaxPODDetailRecord>
  raw: any
}

const normalize = (value?: string | null) => String(value || '').trim()

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const resolveShadowfaxBaseUrl = (config?: ShadowfaxConfig | null) =>
  normalize(config?.apiBase) ||
  normalize(process.env.SHADOWFAX_API_BASE) ||
  DEFAULT_SHADOWFAX_BASE_API

const resolveShadowfaxToken = (config?: ShadowfaxConfig | null) =>
  normalize(config?.apiKey) || normalize(process.env.SHADOWFAX_API_KEY)

/**
 * Minimal transport wrapper for Shadowfax Unified API.
 *
 * The API uses Token authentication:
 * Authorization: Token <token_id>
 *
 * This service intentionally keeps the transport layer separate from the
 * endpoint mapping so we can wire specific flows incrementally.
 */
export class ShadowfaxService {
  private client: AxiosInstance | null = null
  private authToken = ''
  private apiBase = DEFAULT_SHADOWFAX_BASE_API

  private async resolveClient() {
    const config = await getEffectiveCourierConfig<ShadowfaxConfig>('shadowfax', 'b2c')
    this.apiBase = resolveShadowfaxBaseUrl(config)
    this.authToken = resolveShadowfaxToken(config)

    if (!this.authToken) {
      throw new HttpError(
        400,
        'Shadowfax API token is not configured. Save it in courier credentials first.',
      )
    }

    if (!this.client || this.client.defaults.baseURL !== this.apiBase) {
      this.client = axios.create({
        baseURL: this.apiBase,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
    }

    return this.client
  }

  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: any,
    params?: Record<string, any>,
  ): Promise<T> {
    const client = await this.resolveClient()
    const response = await client.request<T>({
      method,
      url: path,
      data,
      params,
      headers: {
        Authorization: `Token ${this.authToken}`,
      },
    })
    return response.data
  }

  async checkServiceability(params: {
    service: ShadowfaxServiceName
    page?: number
    count?: number
    pincodes: Array<string | number>
  }): Promise<ShadowfaxServiceabilityResult> {
    const page = Number.isFinite(Number(params.page)) && Number(params.page) > 0 ? Math.floor(Number(params.page)) : 1
    const count = Number.isFinite(Number(params.count)) && Number(params.count) > 0 ? Math.floor(Number(params.count)) : 25
    const pincodes = params.pincodes
      .map((value) => normalize(String(value)))
      .filter(Boolean)

    if (!pincodes.length) {
      throw new HttpError(400, 'At least one pincode is required for Shadowfax serviceability checks.')
    }

    const raw = await this.request<any>('GET', DEFAULT_SHADOWFAX_SERVICEABILITY_PATH, undefined, {
      service: params.service,
      page,
      count,
      pincodes: pincodes.join(','),
    })

    const records = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.results)
          ? raw.results
          : []

    const normalizedRecords = records
      .map((record: any) => ({
        code: Number(record?.code),
        services: Array.isArray(record?.services)
          ? record.services.map((service: any) => normalize(service)).filter(Boolean)
          : [],
      }))
      .filter((record: ShadowfaxServiceabilityRecord) => Number.isFinite(record.code))

    return {
      service: params.service,
      page,
      count,
      pincodes,
      serviceable: normalizedRecords.length > 0,
      records: normalizedRecords,
      raw,
    }
  }

  async createOrder(params: ShadowfaxCreateOrderParams): Promise<ShadowfaxCreateOrderResult> {
    const orderType = params.orderType === 'warehouse' ? 'warehouse' : 'marketplace'
    const paymentMode = normalize(params.orderDetails.payment_mode || 'Prepaid') || 'Prepaid'
    const promisedDeliveryDate = normalize(params.orderDetails.promised_delivery_date)
    const buildAddress = (details: Record<string, any> | null | undefined) => {
      const parts = [
        details?.customer_address,
        details?.return_address,
        details?.address_line_1,
        details?.address_line_2,
        details?.city,
        details?.state,
        details?.pincode,
      ]
        .map((part) =>
          normalize(part)
            .normalize('NFKD')
            .replace(/[^\x20-\x7E]/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\s*,\s*/g, ', ')
            .replace(/^[,\s]+|[,\s]+$/g, '')
            .trim(),
        )
        .filter(Boolean)

      return parts.length ? parts.join(', ') : null
    }

    const body: Record<string, any> = {
      order_type: orderType,
      order_details: {
        client_order_id: normalize(params.orderDetails.client_order_id),
        actual_weight:
          params.orderDetails.actual_weight !== undefined
            ? toNumber(params.orderDetails.actual_weight)
            : undefined,
        volumetric_weight:
          params.orderDetails.volumetric_weight !== undefined
            ? toNumber(params.orderDetails.volumetric_weight)
            : undefined,
        product_value: toNumber(params.orderDetails.product_value),
        payment_mode: paymentMode,
        cod_amount: toNumber(params.orderDetails.cod_amount),
        promised_delivery_date: promisedDeliveryDate || undefined,
        total_amount:
          params.orderDetails.total_amount !== undefined
            ? toNumber(params.orderDetails.total_amount)
            : undefined,
        eway_bill: normalize(params.orderDetails.eway_bill) || undefined,
        gstin_number: normalize(params.orderDetails.gstin_number) || undefined,
        order_service: normalize(params.orderDetails.order_service) || 'regular',
      },
      customer_details: {
        ...params.customerDetails,
        pincode: toNumber(params.customerDetails.pincode),
      },
      pickup_details: {
        ...params.pickupDetails,
        customer_address: buildAddress(params.pickupDetails) || undefined,
        pincode: toNumber(params.pickupDetails.pincode),
      },
      product_details: (params.productDetails || []).map((item) => ({
        ...item,
        price: item.price !== undefined ? toNumber(item.price) : undefined,
        additional_details:
          item.additional_details && typeof item.additional_details === 'object'
            ? item.additional_details
            : undefined,
      })),
    }

    const returnDetailsKey = orderType === 'warehouse' ? 'rto_details' : 'rts_details'
    body[returnDetailsKey] = {
      ...params.returnDetails,
      return_address: buildAddress(params.returnDetails) || undefined,
      pincode: toNumber(params.returnDetails.pincode),
    }

    const raw = await this.request<any>('POST', DEFAULT_SHADOWFAX_ORDER_PATH, body)
    const orderData = raw?.data ?? raw ?? {}
    const awbNumber = normalize(orderData?.awb_number) || null
    const orderId = normalize(orderData?.client_order_id || orderData?.id) || null

    return {
      successful: normalize(raw?.message).toLowerCase() === 'success' || Boolean(awbNumber),
      status: normalize(orderData?.status_display || orderData?.status) || null,
      message: normalize(raw?.message) || 'Shadowfax order created',
      awbNumber,
      orderId,
      shippingProviderName: 'Shadowfax',
      shippingProviderCode: normalize(orderData?.sort_code) || null,
      label: normalize(orderData?.label) || null,
      manifest: normalize(orderData?.manifest) || null,
      raw,
    }
  }

  async generateAwb(count = 1): Promise<ShadowfaxAwbGenerationResult> {
    const requestedCount = Number.isFinite(Number(count)) ? Math.floor(Number(count)) : 1

    if (requestedCount < 1) {
      throw new HttpError(400, 'AWB count must be at least 1.')
    }

    if (requestedCount > 100000) {
      throw new HttpError(400, 'AWB count cannot exceed 100000.')
    }

    const raw = await this.request<any>('POST', DEFAULT_SHADOWFAX_AWB_PATH, {
      count: requestedCount,
    })

    const awbNumbers = Array.isArray(raw?.awb_numbers)
      ? raw.awb_numbers.map((awb: any) => normalize(awb)).filter(Boolean)
      : Array.isArray(raw?.data?.awb_numbers)
        ? raw.data.awb_numbers.map((awb: any) => normalize(awb)).filter(Boolean)
        : []

    return {
      successful: normalize(raw?.message).toLowerCase() === 'success' || awbNumbers.length > 0,
      status: normalize(raw?.status) || normalize(raw?.data?.status) || null,
      message: normalize(raw?.message) || 'Shadowfax AWBs generated successfully',
      count: requestedCount,
      awbNumbers,
      raw,
    }
  }

  async updateOrderDetails(params: ShadowfaxOrderUpdateParams): Promise<ShadowfaxOrderUpdateResult> {
    const normalizedAwb = normalize(params.awbNumber)
    if (!normalizedAwb) {
      throw new HttpError(400, 'AWB number is required for Shadowfax order updates.')
    }

    const buildAddressSection = (
      input: ShadowfaxOrderUpdateSection | null | undefined,
      key: 'customer_address' | 'return_address',
    ) => ({
      contact: input?.contact ?? null,
      latitude: input?.latitude ?? null,
      longitude: input?.longitude ?? null,
      alternate_contact: input?.alternate_contact ?? null,
      [key]: input?.[key] ?? null,
      pincode:
        input?.pincode === undefined || input?.pincode === ''
          ? null
          : Number.isFinite(Number(input?.pincode))
            ? Number(input?.pincode)
            : input?.pincode,
      email: input?.email ?? null,
      capture_delivery_image: input?.capture_delivery_image ?? null,
    })

    const body = {
      awb_number: normalizedAwb,
      delivery_details: buildAddressSection(params.delivery_details, 'customer_address'),
      pickup_details: buildAddressSection(params.pickup_details, 'customer_address'),
      return_details: buildAddressSection(params.return_details, 'return_address'),
      order_details: {
        cod_amount:
          params.order_details?.cod_amount === undefined || params.order_details?.cod_amount === ''
            ? null
            : Number.isFinite(Number(params.order_details?.cod_amount))
              ? Number(params.order_details?.cod_amount)
              : params.order_details?.cod_amount,
        eway_bill_number: params.order_details?.eway_bill_number ?? null,
        invoice_number: params.order_details?.invoice_number ?? null,
        return_eway_bill_number: params.order_details?.return_eway_bill_number ?? null,
        actual_weight:
          params.order_details?.actual_weight === undefined || params.order_details?.actual_weight === ''
            ? null
            : Number.isFinite(Number(params.order_details?.actual_weight))
              ? Number(params.order_details?.actual_weight)
              : params.order_details?.actual_weight,
        volumetric_weight:
          params.order_details?.volumetric_weight === undefined ||
          params.order_details?.volumetric_weight === ''
            ? null
            : Number.isFinite(Number(params.order_details?.volumetric_weight))
              ? Number(params.order_details?.volumetric_weight)
              : params.order_details?.volumetric_weight,
      },
      status_update: {
        status: params.status_update?.status ?? null,
      },
    }

    const raw = await this.request<any>('POST', DEFAULT_SHADOWFAX_ORDER_UPDATE_PATH, body)

    return {
      successful: normalize(raw?.message).toLowerCase() === 'request accepted.',
      status: normalize(raw?.status) || 'accepted',
      message: normalize(raw?.message) || 'Shadowfax order update accepted',
      awbNumber: normalizedAwb,
      raw,
    }
  }

  async cancelShipment(
    requestId: string,
    cancelRemarks = 'Request cancelled by customer',
  ): Promise<ShadowfaxCancelShipmentResult> {
    const normalizedRequestId = normalize(requestId)
    if (!normalizedRequestId) {
      throw new HttpError(400, 'Request ID is required for Shadowfax cancellation.')
    }

    const raw = await this.request<any>('POST', DEFAULT_SHADOWFAX_ORDER_CANCEL_PATH, {
      request_id: normalizedRequestId,
      cancel_remarks: normalize(cancelRemarks) || 'Request cancelled by customer',
    })

    const responseCode = Number(raw?.responseCode)
    const responseMsg = normalize(raw?.responseMsg) || null

    return {
      successful:
        responseCode === 200 ||
        responseCode === 304 ||
        /cancelled|queued/i.test(responseMsg || '') ||
        normalize(raw?.message).toLowerCase().includes('cancel'),
      status: Number.isFinite(responseCode) ? responseCode : null,
      message: responseMsg || normalize(raw?.message) || 'Shadowfax cancellation accepted',
      responseCode: Number.isFinite(responseCode) ? responseCode : null,
      responseMsg,
      requestId: normalizedRequestId,
      raw,
    }
  }

  async raiseSupportIssue(
    params: ShadowfaxSupportIssueParams,
  ): Promise<ShadowfaxSupportIssueResult> {
    const normalizedAwb = normalize(params.awbNumber)
    const issueCategory = Number(params.issueCategory)

    if (!normalizedAwb) {
      throw new HttpError(400, 'AWB number is required for Shadowfax escalation.')
    }

    if (![1, 2, 3, 4, 5].includes(issueCategory)) {
      throw new HttpError(400, 'Shadowfax issue_category must be between 1 and 5.')
    }

    const raw = await this.request<any>('POST', DEFAULT_SHADOWFAX_SUPPORT_ISSUE_PATH, {
      awb_number: normalizedAwb,
      issue_category: issueCategory,
    })

    return {
      successful: normalize(raw?.status).toUpperCase() === 'SUCCESS',
      status: normalize(raw?.status) || null,
      message: normalize(raw?.message) || 'Issue received',
      awbNumber: normalizedAwb,
      issueCategory: issueCategory as ShadowfaxIssueCategory,
      raw,
    }
  }

  async getPodDetails(awbNumbers: Array<string | number>): Promise<ShadowfaxPODDetailsResult> {
    const normalizedAwbNumbers = awbNumbers
      .map((value) => normalize(String(value)))
      .filter(Boolean)

    if (!normalizedAwbNumbers.length) {
      throw new HttpError(400, 'At least one AWB number is required for Shadowfax POD details.')
    }

    if (normalizedAwbNumbers.length > 100) {
      throw new HttpError(400, 'Shadowfax POD details supports up to 100 AWB numbers per request.')
    }

    const raw = await this.request<any>('POST', DEFAULT_SHADOWFAX_POD_DETAILS_PATH, {
      awb_numbers: normalizedAwbNumbers,
    })

    const podDetails = (raw?.pod_details ?? raw?.data?.pod_details ?? {}) as Record<
      string,
      ShadowfaxPODDetailRecord
    >

    return {
      successful: normalize(raw?.message).toLowerCase() === 'success' || Object.keys(podDetails).length > 0,
      status: normalize(raw?.status) || null,
      message: normalize(raw?.message) || 'Shadowfax POD details fetched successfully',
      count: normalizedAwbNumbers.length,
      awbNumbers: normalizedAwbNumbers,
      podDetails,
      raw,
    }
  }

  async getOrderDetails(awbNumber: string): Promise<ShadowfaxOrderDetailsResult> {
    const normalizedAwb = normalize(awbNumber)
    if (!normalizedAwb) {
      throw new HttpError(400, 'AWB number is required for Shadowfax order details.')
    }

    const raw = await this.request<any>(
      'GET',
      `${DEFAULT_SHADOWFAX_TRACK_PATH}/${encodeURIComponent(normalizedAwb)}/track/`,
    )

    const orderDetails = (raw?.order_details ?? raw?.data?.order_details ?? null) as Record<
      string,
      any
    > | null
    const trackingDetails = Array.isArray(raw?.tracking_details)
      ? raw.tracking_details
      : Array.isArray(raw?.data?.tracking_details)
        ? raw.data.tracking_details
        : []
    const latestTrackingEvent = trackingDetails.length
      ? (trackingDetails[trackingDetails.length - 1] as ShadowfaxOrderTrackingEvent)
      : null

    return {
      successful: normalize(raw?.message).toLowerCase() === 'success' || Boolean(orderDetails),
      status:
        normalize(orderDetails?.status_display) ||
        normalize(orderDetails?.status) ||
        normalize(latestTrackingEvent?.status) ||
        null,
      message: normalize(raw?.message) || 'Shadowfax order details fetched successfully',
      awbNumber:
        normalize(orderDetails?.awb_number) ||
        normalize(latestTrackingEvent?.awb_number) ||
        normalizedAwb ||
        null,
      orderId: normalize(orderDetails?.client_order_id) || null,
      orderDetails,
      trackingDetails,
      latestTrackingEvent,
      raw,
    }
  }

  async getMultipleOrderDetails(awbNumbers: Array<string | number>): Promise<ShadowfaxBulkOrderDetailsResult> {
    const normalizedAwbNumbers = awbNumbers
      .map((value) => normalize(String(value)))
      .filter(Boolean)

    if (!normalizedAwbNumbers.length) {
      throw new HttpError(400, 'At least one AWB number is required for Shadowfax bulk order details.')
    }

    if (normalizedAwbNumbers.length > 50) {
      throw new HttpError(400, 'Shadowfax bulk order details supports up to 50 AWB numbers per request.')
    }

    const raw = await this.request<any>(
      'POST',
      '/v4/clients/bulk_track/',
      {
        awb_numbers: normalizedAwbNumbers,
      },
      {
        format: 'json',
      },
    )

    const orderRows = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.results)
        ? raw.results
        : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : []

    const orders = orderRows.map((order: any) => {
      const trackingDetails = Array.isArray(order?.tracking_details) ? order.tracking_details : []
      const latestTrackingEvent = trackingDetails.length
        ? (trackingDetails[trackingDetails.length - 1] as ShadowfaxOrderTrackingEvent)
        : null

      const orderDetails = {
        ...(order || {}),
        tracking_details: trackingDetails,
      }

      const awbNumber = normalize(order?.awb_number) || null

      const result: ShadowfaxOrderDetailsResult = {
        successful: Boolean(awbNumber),
        status:
          normalize(order?.status_display) ||
          normalize(order?.status) ||
          normalize(latestTrackingEvent?.status) ||
          null,
        message: normalize(raw?.message) || 'Shadowfax order details fetched successfully',
        awbNumber,
        orderId: normalize(order?.client_order_id) || null,
        orderDetails,
        trackingDetails,
        latestTrackingEvent,
        raw: order,
      }

      return result
    })
    const orderStatuses = orders
      .map((order: ShadowfaxOrderDetailsResult) => normalize(order.status))
      .filter(Boolean)
    const uniqueStatuses = Array.from(new Set(orderStatuses))
    const resolvedStatus =
      uniqueStatuses.length === 1
        ? String(uniqueStatuses[0])
        : uniqueStatuses.length > 1
          ? 'mixed'
          : normalize(raw?.status) || null

    return {
      successful: normalize(raw?.message).toLowerCase() === 'success' || orders.length > 0,
      status: resolvedStatus,
      message: normalize(raw?.message) || 'Shadowfax bulk order details fetched successfully',
      count: normalizedAwbNumbers.length,
      awbNumbers: normalizedAwbNumbers,
      orders,
      raw,
    }
  }

  async trackOrder(awbNumber: string): Promise<any> {
    const normalizedAwb = normalize(awbNumber)
    if (!normalizedAwb) {
      throw new HttpError(400, 'AWB number is required for Shadowfax tracking.')
    }

    return this.request<any>(
      'GET',
      `${DEFAULT_SHADOWFAX_TRACK_PATH}/${encodeURIComponent(normalizedAwb)}/track/`,
    )
  }

  getBaseUrl() {
    return this.apiBase
  }
}
