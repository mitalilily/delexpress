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
