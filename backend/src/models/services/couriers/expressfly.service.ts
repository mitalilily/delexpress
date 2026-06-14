import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import { db } from '../../client'
import { courier_credentials } from '../../schema/courierCredentials'
import {
  ExpressflyConfig,
  getEffectiveCourierConfig,
} from '../courierCredentials.service'

export type ExpressflyBookingResponse = {
  successful?: boolean
  status?: string | boolean
  message?: string
  errors?: Array<{
    code?: number
    fieldName?: string
    description?: string
    message?: string
  }>
  warnings?: Array<{
    code?: number
    message?: string
    description?: string
  }>
  saleOrderCode?: string
  shippingPackageCode?: string
  shippingProviderCode?: string
  shippingProviderName?: string
  trackingNumber?: string
  shippingLabelLink?: string
  label?: string
  trackingLink?: string
  invoiceCode?: string
  invoiceDisplayCode?: string
  raw?: any
}

type ExpressflyOrderItem = {
  name?: string
  sku?: string
  qty?: number
  quantity?: number
  price?: number
  hsn?: string
  hsnCode?: string
  discount?: number
  tax_rate?: number
}

type ExpressflyShipmentParams = {
  order_number: string
  payment_type?: 'cod' | 'prepaid' | 'reverse' | 'replacement'
  order_date?: Date
  order_amount?: number
  shipping_charges?: number
  other_charges?: number
  freight_charges?: number
  courier_cost?: number | null
  consignee: {
    name: string
    company_name?: string
    address: string
    address_2?: string
    city: string
    state: string
    country?: string
    pincode: string
    phone: string
    gstin?: string
    email?: string
  }
  pickup: {
    warehouse_name: string
    name: string
    address: string
    address_2?: string
    city: string
    state: string
    country?: string
    pincode: string
    phone: string
    gst_number?: string
  }
  order_items?: ExpressflyOrderItem[]
  pickup_location_id?: string
  integration_type?: string
  shippingProviderCode?: string
  shippingCourier?: string
}

type ExpressflyOrderListParams = {
  offset: number
  limit: number
  sortBy?: string
  sortMode?: 'asc' | 'desc'
  order_status?: string
  date_from?: string
  date_to?: string
  shipment_type?: boolean
  search?: string
}

const DEFAULT_BASE_API = 'https://tech.expressfly.in/api'
const DEFAULT_AUTH_PATH = '/unicommerce/authToken'
const DEFAULT_PROFILE_PATH = '/auth/get-profile'
const DEFAULT_ORDERS_PATH = '/orders'
const DEFAULT_SALE_ORDER_PATH = '/services/rest/v1/oms/saleOrder/create'
const DEFAULT_SHIPPING_PACKAGE_PATH = '/services/rest/v1/oms/shippingPackage/create'
const DEFAULT_BOOKING_PATH = '/services/rest/v1/oms/shippingPackage/createInvoiceAndGenerateLabel'

const normalize = (value: unknown) => String(value ?? '').trim()

const mask = (value?: string | null) => {
  const raw = normalize(value)
  if (!raw) return ''
  return `${raw.slice(0, 4)}${'*'.repeat(Math.max(raw.length - 8, 0))}${raw.slice(-4)}`
}

export class ExpressflyService {
  private static cachedConfig: ExpressflyConfig | null | undefined

  private baseApi = process.env.EXPRESSFLY_BASE_API || DEFAULT_BASE_API
  private authPath = process.env.EXPRESSFLY_AUTH_PATH || DEFAULT_AUTH_PATH
  private profilePath = process.env.EXPRESSFLY_PROFILE_PATH || DEFAULT_PROFILE_PATH
  private ordersPath = process.env.EXPRESSFLY_ORDERS_PATH || DEFAULT_ORDERS_PATH
  private saleOrderPath = process.env.EXPRESSFLY_SALE_ORDER_PATH || DEFAULT_SALE_ORDER_PATH
  private shippingPackagePath =
    process.env.EXPRESSFLY_SHIPPING_PACKAGE_PATH || DEFAULT_SHIPPING_PACKAGE_PATH
  private bookingPath = process.env.EXPRESSFLY_BOOKING_PATH || DEFAULT_BOOKING_PATH
  private facilityCode = process.env.EXPRESSFLY_FACILITY_CODE || ''
  private shippingProviderCode = process.env.EXPRESSFLY_SHIPPING_PROVIDER_CODE || ''
  private shippingCourier = process.env.EXPRESSFLY_SHIPPING_COURIER || 'Expressfly Logistics'
  private apiUserId = process.env.EXPRESSFLY_API_USER_ID || ''
  private apiKey = process.env.EXPRESSFLY_API_KEY || ''
  private authScheme = (process.env.EXPRESSFLY_AUTH_SCHEME || 'raw').toLowerCase()
  private token: string | null = null
  private tokenExpiry = 0
  private profileCache: any = null

  private log(prefix: string, details: any) {
    console.log(`[Expressfly] ${prefix}`, details)
  }

  private buildUrl(path: string) {
    const base = normalize(this.baseApi).replace(/\/+$/, '')
    const cleanPath = normalize(path).startsWith('/') ? normalize(path) : `/${normalize(path)}`
    return `${base}${cleanPath}`
  }

  private buildAuthHeaders(token: string) {
    const authorization =
      this.authScheme === 'raw'
        ? token
        : this.authScheme === 'token'
          ? `Token ${token}`
          : `Bearer ${token}`

    return {
      Authorization: authorization,
      apiKey: token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
  }

  private async requestAuthToken(method: 'post' | 'get') {
    const url = this.buildUrl(this.authPath)
    this.log('Authenticating', {
      url,
      method,
      apiUserId: mask(this.apiUserId),
    })

    if (method === 'post') {
      return axios.post(
        url,
        new URLSearchParams({
          username: this.apiUserId,
          password: this.apiKey,
        }),
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          validateStatus: (status) => status >= 200 && status < 500,
        },
      )
    }

    return axios.get(url, {
      timeout: 30000,
      params: {
        username: this.apiUserId,
        password: this.apiKey,
      },
      headers: {
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    })
  }

  private createHttpClient(token: string): AxiosInstance {
    return axios.create({
      baseURL: normalize(this.baseApi).replace(/\/+$/, ''),
      timeout: 30000,
      headers: this.buildAuthHeaders(token),
      validateStatus: (status) => status >= 200 && status < 500,
    })
  }

  private async requestProfile(token: string) {
    const url = this.buildUrl(this.profilePath)
    this.log('Fetching profile', {
      url,
      tokenPreview: mask(token),
    })

    return axios.get(url, {
      timeout: 30000,
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    })
  }

  private extractToken(raw: any): string {
    const directCandidates = [
      raw?.token,
      raw?.accessToken,
      raw?.access_token,
      raw?.data?.token,
      raw?.data?.accessToken,
      raw?.data?.access_token,
      raw?.result?.token,
      raw?.result?.accessToken,
      raw?.result?.access_token,
    ]

    for (const candidate of directCandidates) {
      const token = normalize(candidate)
      if (token) return token
    }

    return ''
  }

  private extractErrorMessage(err: any, fallback: string) {
    const data = err?.response?.data
    if (!data) return fallback

    const message =
      normalize(data?.message) ||
      normalize(data?.error) ||
      normalize(data?.errors?.[0]?.message) ||
      normalize(data?.errors?.[0]?.description) ||
      normalize(data?.description) ||
      fallback

    return message || fallback
  }

  private async ensureConfigLoaded() {
    if (ExpressflyService.cachedConfig === undefined) {
      ExpressflyService.cachedConfig = await getEffectiveCourierConfig<ExpressflyConfig>(
        'expressfly',
        'b2c',
      )
    }

    const cfg = ExpressflyService.cachedConfig
    if (cfg) {
      this.baseApi = normalize(cfg.apiBase) || this.baseApi
      this.apiUserId = normalize(cfg.apiUserId) || this.apiUserId
      this.apiKey = normalize(cfg.apiKey) || this.apiKey
      this.facilityCode = normalize(cfg.facilityCode) || this.facilityCode
      this.shippingProviderCode =
        normalize(cfg.shippingProviderCode) || this.shippingProviderCode
      this.shippingCourier = normalize(cfg.shippingCourier) || this.shippingCourier
    }

    this.baseApi = normalize(this.baseApi) || DEFAULT_BASE_API
    this.log('Config loaded', {
      baseApi: this.baseApi,
      hasApiUserId: Boolean(this.apiUserId),
      hasApiKey: Boolean(this.apiKey),
      hasFacilityCode: Boolean(this.facilityCode),
      shippingProviderCode: this.shippingProviderCode || null,
      shippingCourier: this.shippingCourier || null,
      source: cfg ? 'courier_credentials_or_env_fallback' : 'env_only',
    })
  }

  async getAccessToken(forceRefresh = false): Promise<string> {
    await this.ensureConfigLoaded()

    if (!forceRefresh && this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    if (!this.apiUserId || !this.apiKey) {
      throw new HttpError(
        400,
        'Expressfly API credentials are missing. Save API User ID and API Key in courier credentials first.',
      )
    }

    const authAttempts: Array<'post' | 'get'> = ['post', 'get']
    let response: any = null
    let lastError: HttpError | null = null

    for (const method of authAttempts) {
      response = await this.requestAuthToken(method)
      if (response.status < 400) {
        break
      }

      lastError = new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly authentication failed'),
      )
    }

    if (!response || response.status >= 400) {
      throw lastError || new HttpError(502, 'Expressfly authentication failed')
    }

    const token = this.extractToken(response.data)
    if (!token) {
      throw new HttpError(502, 'Expressfly auth response did not include a token')
    }

    this.token = token
    this.tokenExpiry = Date.now() + 45 * 60 * 1000
    this.log('Authentication succeeded', {
      status: response.status,
      tokenPreview: mask(token),
    })

    // Best-effort verification of the live session against the profile endpoint.
    // If this fails, we keep the token and let the booking call decide whether the session is usable.
    if (process.env.EXPRESSFLY_VERIFY_PROFILE !== 'false') {
      try {
        const profileResponse = await this.requestProfile(token)
        if (profileResponse.status < 400) {
          const profileData = profileResponse.data?.data ?? profileResponse.data
          this.profileCache = {
            status: profileResponse.data?.status ?? profileResponse.data?.success ?? profileResponse.status,
            data: profileData,
            raw: profileResponse.data,
          }
          this.log('Profile verification succeeded', {
            status: profileResponse.status,
            name: normalize(profileData?.name) || null,
            email: normalize(profileData?.email) || null,
          })
        } else {
          this.log('Profile verification returned non-2xx status', {
            status: profileResponse.status,
            message: this.extractErrorMessage(
              { response: profileResponse },
              'Expressfly profile lookup failed',
            ),
          })
        }
      } catch (err: any) {
        this.log('Profile verification skipped after auth failure', {
          message: err?.message || String(err),
        })
      }
    }

    return token
  }

  async getProfile(forceRefresh = false) {
    const token = await this.getAccessToken(forceRefresh)
    const response = await this.requestProfile(token)

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly profile lookup failed'),
      )
    }

    const data = response.data?.data ?? response.data
    const profile = {
      status: response.data?.status ?? response.data?.success ?? response.status,
      data,
      raw: response.data,
    }

    this.log('Profile fetched successfully', {
      status: response.status,
      name: normalize(data?.name) || null,
      email: normalize(data?.email) || null,
    })

    return profile
  }

  async getOrders(params: ExpressflyOrderListParams) {
    const token = await this.getAccessToken()
    const http = this.createHttpClient(token)

    const query: Record<string, string | number | boolean> = {
      offset: Math.max(0, Number(params.offset) || 0),
      limit: Math.max(1, Number(params.limit) || 1),
    }

    if (params.sortBy) query.sortBy = params.sortBy
    if (params.sortMode) query.sortMode = params.sortMode
    if (params.order_status) query.order_status = params.order_status
    if (params.date_from) query.date_from = params.date_from
    if (params.date_to) query.date_to = params.date_to
    if (typeof params.shipment_type === 'boolean') query.shipment_type = params.shipment_type
    if (params.search) query.search = params.search

    const url = this.ordersPath
    this.log('Fetching orders', {
      url: this.buildUrl(url),
      query,
    })

    const response = await http.get(url, { params: query })

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly order list failed'),
      )
    }

    const data = response.data?.data ?? response.data
    const orders = Array.isArray(data?.orders) ? data.orders : []
    const total = Number(data?.total ?? orders.length) || 0

    return {
      status: response.data?.status ?? response.status,
      message: response.data?.message || 'Expressfly orders fetched successfully',
      data: {
        orders,
        total,
      },
      raw: response.data,
    }
  }

  private toShippingAddress(address: ExpressflyShipmentParams['consignee']) {
    return {
      name: address.name,
      addressLine1: address.address,
      addressLine2: address.address_2 || '',
      city: address.city,
      state: address.state,
      country: address.country || 'India',
      pincode: address.pincode,
      phone: address.phone,
      email: address.email || '',
    }
  }

  private buildSaleOrderItems(orderNumber: string, items: ExpressflyOrderItem[]) {
    const normalized = items.length
      ? items
      : [
          {
            name: `Order ${orderNumber}`,
            sku: `${orderNumber}-1`,
            qty: 1,
            quantity: 1,
            price: 0,
            discount: 0,
          },
        ]

    return normalized.map((item, index) => {
      const qty = Number(item.qty ?? item.quantity ?? 1) || 1
      const price = Number(item.price ?? 0) || 0
      const sku = normalize(item.sku) || normalize(item.name) || `${orderNumber}-${index + 1}`
      return {
        code: sku,
        itemCode: sku,
        itemName: normalize(item.name) || sku,
        itemSku: sku,
        sellerSkuCode: sku,
        quantity: qty,
        sellingPrice: price,
        totalPrice: Number((price * qty).toFixed(2)),
      }
    })
  }

  private buildSaleOrderPayload(params: ExpressflyShipmentParams) {
    const orderDate = params.order_date instanceof Date ? params.order_date : new Date()
    const saleOrderItems = this.buildSaleOrderItems(params.order_number, params.order_items || [])
    const consignee = params.consignee
    const shippingAddress = this.toShippingAddress(consignee)

    return {
      saleOrder: {
        code: params.order_number,
        displayOrderCode: params.order_number,
        displayOrderDateTime: orderDate.toISOString(),
        channelProcessingTime: orderDate.toISOString(),
        customerCode: params.order_number,
        customerName: consignee.name,
        customerGSTIN: consignee.gstin || '',
        channel: 'EXPRESSFLY',
        notificationEmail: consignee.email || '',
        notificationMobile: consignee.phone,
        cashOnDelivery: String(params.payment_type || 'prepaid').toLowerCase() === 'cod',
        paymentInstrument:
          String(params.payment_type || 'prepaid').toLowerCase() === 'cod' ? 'CASH' : 'PREPAID',
        additionalInfo: 'Created from ExpressoPro',
        thirdPartyShipping: true,
        shippingProviders: [],
        saleOrderItemCombinations: [],
        saleOrderItems,
        shippingAddress,
        billingAddress: shippingAddress,
        orderPrice: {
          currency: 'INR',
          totalCashOnDeliveryCharges:
            String(params.payment_type || 'prepaid').toLowerCase() === 'cod'
              ? Number(params.shipping_charges ?? params.courier_cost ?? 0) || 0
              : 0,
          totalDiscount: 0,
          totalGiftCharges: 0,
          totalStoreCredit: 0,
        },
      },
    }
  }

  private buildShippingPackagePayload(saleOrderCode: string, saleOrderItems: ExpressflyOrderItem[]) {
    const itemCodes = this.buildSaleOrderItems(saleOrderCode, saleOrderItems).map(
      (item) => item.code,
    )

    return {
      saleOrderCode,
      saleOrderItemCodes: itemCodes,
    }
  }

  private buildInvoiceAndLabelPayload(shippingPackageCode: string) {
    return {
      shippingPackageCode,
      generateUniwareShippingLabel: true,
    }
  }

  private parseBookingResponse(raw: any, saleOrderCode: string, shippingPackageCode: string) {
    const response = raw?.data ?? raw
    return {
      successful: Boolean(response?.successful ?? response?.success ?? response?.status === true),
      status: response?.status ?? response?.successful ?? true,
      message: normalize(response?.message) || 'Expressfly booking completed',
      saleOrderCode: normalize(response?.saleOrderCode) || saleOrderCode,
      shippingPackageCode: normalize(response?.shippingPackageCode) || shippingPackageCode,
      shippingProviderCode: normalize(response?.shippingProviderCode) || this.shippingProviderCode,
      shippingProviderName: normalize(response?.shippingProviderName) || this.shippingCourier,
      trackingNumber: normalize(response?.trackingNumber) || '',
      shippingLabelLink: normalize(response?.shippingLabelLink) || '',
      label: normalize(response?.label) || '',
      trackingLink: normalize(response?.trackingLink) || '',
      invoiceCode: normalize(response?.invoiceCode) || '',
      invoiceDisplayCode: normalize(response?.invoiceDisplayCode) || '',
      raw: response,
    } satisfies ExpressflyBookingResponse
  }

  async createSaleOrder(params: ExpressflyShipmentParams) {
    await this.ensureConfigLoaded()
    const token = await this.getAccessToken()
    const http = this.createHttpClient(token)
    const payload = this.buildSaleOrderPayload(params)
    const url = this.saleOrderPath

    this.log('Create sale order request', {
      url: this.buildUrl(url),
      saleOrderCode: params.order_number,
      hasItems: (params.order_items || []).length > 0,
      hasFacilityCode: Boolean(this.facilityCode),
    })

    const response = await http.post(url, payload, {
      headers: {
        ...(this.facilityCode ? { Facility: this.facilityCode } : {}),
      },
    })

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly sale order creation failed'),
      )
    }

    return response.data
  }

  async createShippingPackage(saleOrderCode: string, saleOrderItems: ExpressflyShipmentParams['order_items']) {
    await this.ensureConfigLoaded()
    const token = await this.getAccessToken()
    const http = this.createHttpClient(token)
    const payload = this.buildShippingPackagePayload(saleOrderCode, saleOrderItems || [])
    const url = this.shippingPackagePath

    this.log('Create shipping package request', {
      url: this.buildUrl(url),
      saleOrderCode,
      itemCount: payload.saleOrderItemCodes.length,
      hasFacilityCode: Boolean(this.facilityCode),
    })

    const response = await http.post(url, payload, {
      headers: {
        ...(this.facilityCode ? { Facility: this.facilityCode } : {}),
      },
    })

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly shipping package creation failed'),
      )
    }

    return response.data
  }

  async createInvoiceAndGenerateLabel(shippingPackageCode: string) {
    await this.ensureConfigLoaded()
    const token = await this.getAccessToken()
    const http = this.createHttpClient(token)
    const payload = this.buildInvoiceAndLabelPayload(shippingPackageCode)
    const url = this.bookingPath

    this.log('Create invoice and label request', {
      url: this.buildUrl(url),
      shippingPackageCode,
      hasFacilityCode: Boolean(this.facilityCode),
    })

    const response = await http.post(url, payload, {
      headers: {
        ...(this.facilityCode ? { Facility: this.facilityCode } : {}),
      },
    })

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly booking failed'),
      )
    }

    return response.data
  }

  async bookShipment(params: ExpressflyShipmentParams): Promise<ExpressflyBookingResponse> {
    const saleOrderResponse = await this.createSaleOrder(params)
    const saleOrderCode =
      normalize(saleOrderResponse?.saleOrderCode) ||
      normalize(saleOrderResponse?.data?.saleOrderCode) ||
      params.order_number

    const shippingPackageResponse = await this.createShippingPackage(
      saleOrderCode,
      params.order_items || [],
    )

    const shippingPackageCode =
      normalize(shippingPackageResponse?.shippingPackageCode) ||
      normalize(shippingPackageResponse?.data?.shippingPackageCode) ||
      normalize(shippingPackageResponse?.code) ||
      saleOrderCode

    let bookingResponse: any = null
    try {
      bookingResponse = await this.createInvoiceAndGenerateLabel(shippingPackageCode)
    } catch (err: any) {
      this.log('Invoice and label step failed, returning sale order + shipping package details', {
        message: err?.message || String(err),
      })
      bookingResponse = null
    }

    const rawBooking = bookingResponse?.data ?? bookingResponse ?? shippingPackageResponse
    return this.parseBookingResponse(rawBooking, saleOrderCode, shippingPackageCode)
  }

  async cancelShipment(trackingNumber: string) {
    return {
      success: false,
      message: 'Expressfly cancellation endpoint has not been wired yet.',
      trackingNumber,
    }
  }

  async trackShipment(trackingNumber: string) {
    return {
      success: false,
      message: 'Expressfly tracking endpoint has not been wired yet.',
      trackingNumber,
    }
  }
}
