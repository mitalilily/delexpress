import axios, { AxiosInstance } from 'axios'
import { execFile } from 'child_process'
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
  orderId?: string
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

type ExpressflySingleOrderResponse = {
  status?: string | number | boolean
  message?: string
  data?: {
    order_info?: Record<string, any>
    pickup_info?: Record<string, any>
    consignee_info?: Record<string, any>
    courier_info?: Record<string, any>
    product_info?: Record<string, any>
    weight_info?: Record<string, any>
    payment_info?: Record<string, any>
    status_info?: Record<string, any>
    [key: string]: any
  }
  raw?: any
}

type ExpressflyOrderRate = {
  courier_info?: Record<string, any>
  price_info?: Record<string, any>
  delivery_info?: Record<string, any>
  temp_rate_id?: string
  [key: string]: any
}

type ExpressflyRatesResponse = {
  status?: string | number | boolean
  message?: string
  data?: {
    rates?: ExpressflyOrderRate[]
    total?: number
    page?: number
    pages?: number
    [key: string]: any
  }
  raw?: any
}

type ExpressflyWarehouseListParams = {
  page?: number
  limit?: number
  search?: string
  userId?: string
}

type ExpressflyWarehouseListResponse = {
  status?: string | number | boolean
  message?: string
  data: Array<Record<string, any>>
  totalUsers?: number
  currentPage?: number
  totalPages?: number
  raw?: any
}

type ExpressflyWarehouseCreateParams = {
  warehouse_name: string
  contact_person_name: string
  contact_no: string
  address_line1: string
  city: string
  state: string
  pincode: string
  landmark?: string
}

type ExpressflyWarehouseUpdateParams = ExpressflyWarehouseCreateParams & {
  warehouse_id: string
}

type ExpressflyWarehouseCreateResponse = {
  status?: string | number | boolean
  message?: string
  data?: Record<string, any>
  raw?: any
}

const DEFAULT_BASE_API = 'https://tech.expressfly.in/api'
const DEFAULT_AUTH_PATH = '/unicommerce/authToken'
const DEFAULT_PROFILE_PATH = '/auth/get-profile'
const DEFAULT_ORDERS_PATH = '/orders'
const DEFAULT_ORDER_RATES_PATH = '/orders/get-rates'
const DEFAULT_WAREHOUSE_LIST_PATH = '/admin/users/warehouse/list'
const DEFAULT_SALE_ORDER_PATH = '/services/rest/v1/oms/saleOrder/create'
const DEFAULT_SHIPPING_PACKAGE_PATH = '/services/rest/v1/oms/shippingPackage/create'
const DEFAULT_BOOKING_PATH = '/services/rest/v1/oms/shippingPackage/createInvoiceAndGenerateLabel'

const normalize = (value: unknown) => String(value ?? '').trim()

const mask = (value?: string | null) => {
  const raw = normalize(value)
  if (!raw) return ''
  return `${raw.slice(0, 4)}${'*'.repeat(Math.max(raw.length - 8, 0))}${raw.slice(-4)}`
}

const execFileAsync = (
  file: string,
  args: string[],
  options: { encoding: BufferEncoding; maxBuffer: number },
) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      if (error && !stdout && !stderr) {
        reject(error)
        return
      }

      if (error && (error as any).code === 'ENOENT') {
        reject(error)
        return
      }

      resolve({
        stdout: typeof stdout === 'string' ? stdout : String(stdout || ''),
        stderr: typeof stderr === 'string' ? stderr : String(stderr || ''),
      })
    })
  })

export class ExpressflyService {
  private static cachedConfig: ExpressflyConfig | null | undefined

  private baseApi = process.env.EXPRESSFLY_BASE_API || DEFAULT_BASE_API
  private authPath = process.env.EXPRESSFLY_AUTH_PATH || DEFAULT_AUTH_PATH
  private profilePath = process.env.EXPRESSFLY_PROFILE_PATH || DEFAULT_PROFILE_PATH
  private ordersPath = process.env.EXPRESSFLY_ORDERS_PATH || DEFAULT_ORDERS_PATH
  private orderRatesPath = process.env.EXPRESSFLY_ORDER_RATES_PATH || DEFAULT_ORDER_RATES_PATH
  private warehouseListPath =
    process.env.EXPRESSFLY_WAREHOUSE_LIST_PATH || DEFAULT_WAREHOUSE_LIST_PATH
  private saleOrderPath = process.env.EXPRESSFLY_SALE_ORDER_PATH || DEFAULT_SALE_ORDER_PATH
  private shippingPackagePath =
    process.env.EXPRESSFLY_SHIPPING_PACKAGE_PATH || DEFAULT_SHIPPING_PACKAGE_PATH
  private bookingPath = process.env.EXPRESSFLY_BOOKING_PATH || DEFAULT_BOOKING_PATH
  private facilityCode = process.env.EXPRESSFLY_FACILITY_CODE || ''
  private shippingProviderCode = process.env.EXPRESSFLY_SHIPPING_PROVIDER_CODE || ''
  private shippingCourier = process.env.EXPRESSFLY_SHIPPING_COURIER || 'Expressfly Logistics'
  private apiUserId = process.env.EXPRESSFLY_API_USER_ID || ''
  private apiKey = process.env.EXPRESSFLY_API_KEY || ''
  private pickupAddressId = process.env.EXPRESSFLY_PICKUP_ADDRESS_ID || ''
  private authScheme = (process.env.EXPRESSFLY_AUTH_SCHEME || 'raw').toLowerCase()
  private token: string | null = null
  private tokenExpiry = 0
  private lookupToken: string | null = null
  private lookupTokenExpiry = 0
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

  private async requestJsonAuthToken() {
    const url = this.buildUrl(this.authPath)
    this.log('Authenticating order lookup token', {
      url,
      apiUserId: mask(this.apiUserId),
    })

    return axios.post(
      url,
      {
        username: this.apiUserId,
        password: this.apiKey,
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        validateStatus: (status) => status >= 200 && status < 500,
      },
    )
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

  private async requestWarehouseList(token: string, params: ExpressflyWarehouseListParams = {}) {
    const url = this.buildUrl(this.warehouseListPath)
    this.log('Fetching warehouse list', {
      url,
      userId: mask(params.userId),
      page: Math.max(1, Number(params.page) || 1),
      limit: Math.max(1, Number(params.limit) || 1000),
      search: normalize(params.search) || '',
    })

    return axios.get(url, {
      timeout: 30000,
      params: {
        page: Math.max(1, Number(params.page) || 1),
        limit: Math.max(1, Number(params.limit) || 1000),
        ...(normalize(params.search) ? { search: normalize(params.search) } : {}),
        ...(normalize(params.userId) ? { user_id: normalize(params.userId) } : {}),
      },
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    })
  }

  private async requestWarehouseCreate(token: string, payload: Record<string, any>) {
    const url = this.buildUrl('/admin/users/warehouse/create')
    this.log('Creating warehouse', {
      url,
      warehouseName: normalize(payload?.warehouse_name),
      city: normalize(payload?.city),
      state: normalize(payload?.state),
      pincode: normalize(payload?.pincode),
    })

    return axios.post(url, payload, {
      timeout: 30000,
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    })
  }

  private async requestWarehouseUpdate(
    token: string,
    warehouseId: string,
    payload: Record<string, any>,
  ) {
    const url = this.buildUrl(`/admin/users/warehouse/update/${encodeURIComponent(warehouseId)}`)
    this.log('Updating warehouse', {
      url,
      warehouseId: mask(warehouseId),
      warehouseName: normalize(payload?.warehouse_name),
      city: normalize(payload?.city),
      state: normalize(payload?.state),
      pincode: normalize(payload?.pincode),
    })

    return axios.put(url, payload, {
      timeout: 30000,
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
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

    const authAttempts: Array<'json' | 'post' | 'get'> = ['json', 'post', 'get']
    let response: any = null
    let lastError: HttpError | null = null

    for (const method of authAttempts) {
      response =
        method === 'json'
          ? await this.requestJsonAuthToken()
          : await this.requestAuthToken(method)
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

  async getLookupAccessToken(forceRefresh = false): Promise<string> {
    await this.ensureConfigLoaded()

    if (!forceRefresh && this.lookupToken && Date.now() < this.lookupTokenExpiry) {
      return this.lookupToken
    }

    if (!this.apiUserId || !this.apiKey) {
      throw new HttpError(
        400,
        'Expressfly API credentials are missing. Save API User ID and API Key in courier credentials first.',
      )
    }

    const response = await this.requestJsonAuthToken()
    if (!response || response.status >= 400) {
      throw new HttpError(
        response?.status || 502,
        this.extractErrorMessage({ response }, 'Expressfly order lookup authentication failed'),
      )
    }

    const token = this.extractToken(response.data)
    if (!token) {
      throw new HttpError(502, 'Expressfly order lookup auth response did not include a token')
    }

    this.lookupToken = token
    this.lookupTokenExpiry = Date.now() + 45 * 60 * 1000
    this.log('Order lookup authentication succeeded', {
      status: response.status,
      tokenPreview: mask(token),
    })

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

  async getWarehouseList(
    params: ExpressflyWarehouseListParams & { forceRefresh?: boolean } = {},
  ): Promise<ExpressflyWarehouseListResponse> {
    const forceRefresh = Boolean(params.forceRefresh)
    const token = await this.getAccessToken(forceRefresh)
    let profile: any = this.profileCache

    if (!profile) {
      try {
        profile = await this.getProfile()
      } catch (err: any) {
        this.log('Profile lookup skipped for warehouse list', {
          message: err?.message || String(err),
        })
      }
    }

    const userId =
      normalize(params.userId) || normalize(profile?.data?._id || profile?.data?.id) || ''

    const response = await this.requestWarehouseList(token, {
      page: params.page,
      limit: params.limit,
      search: params.search,
      userId: userId || undefined,
    })

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly warehouse list failed'),
      )
    }

    const warehouses = Array.isArray(response.data?.data) ? response.data.data : []
    this.log('Warehouse list fetched successfully', {
      status: response.status,
      count: warehouses.length,
    })

    return {
      status: response.data?.status ?? response.status,
      message: response.data?.message || 'Warehouse data found.',
      data: warehouses,
      totalUsers: Number(response.data?.totalUsers ?? 0) || 0,
      currentPage: Number(response.data?.currentPage ?? params.page ?? 1) || 1,
      totalPages: Number(response.data?.totalPages ?? 0) || 0,
      raw: response.data,
    }
  }

  async createWarehouse(
    params: ExpressflyWarehouseCreateParams,
  ): Promise<ExpressflyWarehouseCreateResponse> {
    await this.ensureConfigLoaded()
    const token = await this.getAccessToken()

    const payload: Record<string, any> = {
      warehouse_name: normalize(params.warehouse_name),
      contact_person_name: normalize(params.contact_person_name),
      contact_no: normalize(params.contact_no),
      address_line1: normalize(params.address_line1),
      city: normalize(params.city),
      state: normalize(params.state),
      pincode: normalize(params.pincode),
    }

    // The live Expressfly validator rejects `landmark` even though the docs list it as optional,
    // so we intentionally omit it from the production request to keep the booking flow reliable.
    if (normalize(params.landmark)) {
      this.log('Warehouse landmark omitted to match live validator', {
        landmarkProvided: true,
      })
    }

    const response = await this.requestWarehouseCreate(token, payload)

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly warehouse creation failed'),
      )
    }

    return {
      status: response.data?.status ?? response.status,
      message: response.data?.message || 'Warehouse created successfully.',
      data: response.data?.data ?? response.data,
      raw: response.data,
    }
  }

  async updateWarehouse(
    params: ExpressflyWarehouseUpdateParams,
  ): Promise<ExpressflyWarehouseCreateResponse> {
    await this.ensureConfigLoaded()
    const token = await this.getAccessToken()

    const warehouseId = normalize(params.warehouse_id)
    if (!warehouseId) {
      throw new HttpError(400, 'Expressfly warehouse_id is required')
    }

    const payload: Record<string, any> = {
      warehouse_name: normalize(params.warehouse_name),
      contact_person_name: normalize(params.contact_person_name),
      contact_no: normalize(params.contact_no),
      address_line1: normalize(params.address_line1),
      city: normalize(params.city),
      state: normalize(params.state),
      pincode: normalize(params.pincode),
    }

    // The live Expressfly validator rejects `landmark` for update as well.
    if (normalize(params.landmark)) {
      this.log('Warehouse landmark omitted to match live validator', {
        landmarkProvided: true,
      })
    }

    const response = await this.requestWarehouseUpdate(token, warehouseId, payload)

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly warehouse update failed'),
      )
    }

    return {
      status: response.data?.status ?? response.status,
      message: response.data?.message || 'Warehouse updated successfully.',
      data: response.data?.data ?? response.data,
      raw: response.data,
    }
  }

  private async resolvePickupAddressId(explicitPickupId?: string) {
    const explicit = normalize(explicitPickupId)
    if (explicit) return explicit

    const envPickupId = normalize(this.pickupAddressId)
    if (envPickupId) return envPickupId

    const warehouseList = await this.getWarehouseList({ forceRefresh: false, limit: 1000, page: 1 })
    const firstWarehouse = Array.isArray(warehouseList.data) ? warehouseList.data[0] : null
    const resolved = normalize(firstWarehouse?._id || firstWarehouse?.id)

    if (!resolved) {
      throw new HttpError(
        400,
        'Expressfly pickup address id is missing and no warehouse records were found.',
      )
    }

    return resolved
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

  async getOrder(orderId: string): Promise<ExpressflySingleOrderResponse> {
    const token = await this.getLookupAccessToken()
    const normalizedOrderId = normalize(orderId)

    if (!normalizedOrderId) {
      throw new HttpError(400, 'Expressfly order id is required')
    }

    const url = `${this.ordersPath}/${encodeURIComponent(normalizedOrderId)}`
    this.log('Fetching single order', {
      url: this.buildUrl(url),
      orderId: normalizedOrderId,
    })

    let response: {
      status: number
      data: any
    } | null = null

    try {
      const curlBinary = process.platform === 'win32' ? 'curl.exe' : 'curl'
      const curlUrl = this.buildUrl(url)
      const curlArgs = [
        '--silent',
        '--show-error',
        '--http1.1',
        '-H',
        `Authorization: ${token}`,
        '-H',
        'Accept: application/json',
        '-w',
        '\n%{http_code}',
        '-o',
        '-',
        curlUrl,
      ]

      const curlResult = await execFileAsync(curlBinary, curlArgs, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      })

      const output = String(curlResult.stdout || '').replace(/\r\n/g, '\n')
      const lastNewline = output.lastIndexOf('\n')
      const responseBody = lastNewline >= 0 ? output.slice(0, lastNewline) : output
      const statusText = lastNewline >= 0 ? output.slice(lastNewline + 1).trim() : ''
      const parsedBody = responseBody ? JSON.parse(responseBody) : {}

      response = {
        status: Number(statusText) || 0,
        data: parsedBody,
      }
    } catch (curlError: any) {
      this.log('Curl lookup failed, falling back to axios', {
        orderId: normalizedOrderId,
        message: curlError?.message || String(curlError),
      })
      const http = this.createHttpClient(token)
      response = await http.get(url)
    }

    if (!response) {
      throw new HttpError(502, 'Expressfly order lookup failed')
    }

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly order lookup failed'),
      )
    }

    const data = response.data?.data ?? response.data

    return {
      status: response.data?.status ?? response.status,
      message: response.data?.message || 'Order fetched successfully.',
      data,
      raw: response.data,
    }
  }

  async getOrderRates(orderId: string): Promise<ExpressflyRatesResponse> {
    const token = await this.getLookupAccessToken()
    const normalizedOrderId = normalize(orderId)

    if (!normalizedOrderId) {
      throw new HttpError(400, 'Expressfly order id is required')
    }

    const url = `${this.orderRatesPath}/${encodeURIComponent(normalizedOrderId)}`
    this.log('Fetching order rates', {
      url: this.buildUrl(url),
      orderId: normalizedOrderId,
    })

    let response: {
      status: number
      data: any
    } | null = null

    try {
      const curlBinary = process.platform === 'win32' ? 'curl.exe' : 'curl'
      const curlUrl = this.buildUrl(url)
      const curlArgs = [
        '--silent',
        '--show-error',
        '--http1.1',
        '-H',
        `Authorization: ${token}`,
        '-H',
        'Accept: application/json',
        '-w',
        '\n%{http_code}',
        '-o',
        '-',
        curlUrl,
      ]

      const curlResult = await execFileAsync(curlBinary, curlArgs, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      })

      const output = String(curlResult.stdout || '').replace(/\r\n/g, '\n')
      const lastNewline = output.lastIndexOf('\n')
      const responseBody = lastNewline >= 0 ? output.slice(0, lastNewline) : output
      const statusText = lastNewline >= 0 ? output.slice(lastNewline + 1).trim() : ''
      const parsedBody = responseBody ? JSON.parse(responseBody) : {}

      response = {
        status: Number(statusText) || 0,
        data: parsedBody,
      }
    } catch (curlError: any) {
      this.log('Curl rate lookup failed, falling back to axios', {
        orderId: normalizedOrderId,
        message: curlError?.message || String(curlError),
      })
      const http = this.createHttpClient(token)
      response = await http.get(url)
    }

    if (!response) {
      throw new HttpError(502, 'Expressfly order rates lookup failed')
    }

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly order rates lookup failed'),
      )
    }

    const data = response.data?.data ?? response.data

    return {
      status: response.data?.status ?? response.status,
      message: response.data?.message || 'Orders rate calculation successfully.',
      data,
      raw: response.data,
    }
  }

  async createOrder(params: ExpressflyShipmentParams) {
    await this.ensureConfigLoaded()
    const token = await this.getAccessToken()
    const pickupAddressId = await this.resolvePickupAddressId(params.pickup_location_id)
    const productItems = this.buildSaleOrderItems(params.order_number, params.order_items || [])
    const product_quantity = productItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const productdetatis = productItems.map((item) => ({
      product_sku: item.itemSku,
      product_name: item.itemName,
      product_quantity: item.quantity,
      product_value: item.sellingPrice,
    }))
    const orderType = String(params.payment_type || 'prepaid').toLowerCase() === 'cod' ? 1 : 0
    const shipmentType = String(params.integration_type || '').toLowerCase() === 'dto' ? 1 : 0
    const orderValue =
      Number(params.order_amount ?? productItems.reduce((sum, item) => sum + item.totalPrice, 0)) ||
      0
    const payload = {
      name: params.consignee.name,
      mobile_no: params.consignee.phone,
      ...(params.consignee.email ? { email_id: params.consignee.email } : {}),
      shipment_type: shipmentType,
      receiver_address: params.consignee.address,
      receiver_pincode: params.consignee.pincode,
      receiver_city: params.consignee.city,
      receiver_state: params.consignee.state,
      order_no: params.order_number,
      order_type: orderType,
      product_quantity,
      ...(orderType === 1 ? { cod_amount: orderValue } : {}),
      order_value: orderValue,
      physical_weight: 1,
      product_length: 10,
      product_width: 10,
      product_height: 10,
      pickup_address_id: pickupAddressId,
      productdetatis,
    }

    this.log('Create order request', {
      url: this.buildUrl(this.ordersPath),
      orderNo: params.order_number,
      pickupAddressId,
      productCount: productdetatis.length,
    })

    const response = await axios.post(this.buildUrl(this.ordersPath), payload, {
      timeout: 30000,
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      validateStatus: (status) => status >= 200 && status < 500,
    })

    if (response.status >= 400) {
      throw new HttpError(
        response.status,
        this.extractErrorMessage({ response }, 'Expressfly order creation failed'),
      )
    }

    const data = response.data?.data ?? response.data
    return {
      successful: Boolean(response.data?.status === 1 || response.data?.success === true),
      status: response.data?.status ?? response.status,
      message: response.data?.message || 'Order created successfully.',
      orderId: normalize(data?.order_id || data?.orderId),
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
    return this.createOrder(params)
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
