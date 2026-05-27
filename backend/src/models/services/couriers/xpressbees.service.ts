import axios, { AxiosInstance } from 'axios'
import { eq } from 'drizzle-orm'
import { HttpError } from '../../../utils/classes'
import { db } from '../../client'
import { courier_credentials } from '../../schema/courierCredentials'
import { XpressbeesConfig, getEffectiveCourierConfig } from '../courierCredentials.service'

export type XpressbeesServiceabilityRecord = {
  id: string
  name: string
  freight_charges?: number
  cod_charges?: number
  total_charges?: number
  min_weight?: number
  chargeable_weight?: number
  [key: string]: any
}

export type XpressbeesServiceabilityResponse = {
  serviceable: boolean
  records: XpressbeesServiceabilityRecord[]
  codAvailable: boolean
  prepaidAvailable: boolean
  tat: number | null
  raw: any
}

export type XpressbeesShipmentResponse = {
  status: boolean
  data?: {
    order_id?: number | string
    shipment_id?: number | string
    awb_number?: string
    courier_id?: string
    courier_name?: string
    status?: string
    additional_info?: string
    payment_type?: string
    fwd_destination_code?: string
    label?: string
    manifest?: string
  }
  message?: string
  [key: string]: any
}

export class XpressbeesService {
  private normalizeEndpoint(value: string | undefined, fallback: string, fallbackBase?: string) {
    const normalized = String(value || '').trim()
    if (!normalized) return fallback
    if (/^https?:\/\//i.test(normalized)) return normalized.replace(/\/+$/, '')

    const base = String(fallbackBase || fallback).trim()
    const baseUrl = /^https?:\/\//i.test(base)
      ? base
      : fallback
    const parsedBase = new URL(baseUrl)
    const baseOrigin = `${parsedBase.protocol}//${parsedBase.host}`
    return `${baseOrigin}/${normalized.replace(/^\/+/, '')}`.replace(/\/+$/, '')
  }

  private baseApi =
    process.env.XPRESSBEES_API_BASE ||
    'https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward'
  private apiToken = process.env.XPRESSBEES_API_TOKEN || ''
  private username = process.env.XPRESSBEES_USERNAME || ''
  private password = process.env.XPRESSBEES_PASSWORD || ''
  private secretKey = process.env.XPRESSBEES_SECRET_KEY || ''
  private xbKey = process.env.XPRESSBEES_XB_KEY || ''
  private businessUnit =
    process.env.XPRESSBEES_BUSINESS_UNIT ||
    process.env.XPRESSBEES_BUSINESS_ACCOUNT_NAME ||
    'ExpressoPro B2C NDD'
  private businessFlow = process.env.XPRESSBEES_BUSINESS_FLOW || 'NDD'
  private businessService = process.env.XPRESSBEES_BUSINESS_SERVICE || 'NDD'
  private tokenEndpoint =
    this.normalizeEndpoint(
      process.env.XPRESSBEES_TOKEN_ENDPOINT,
      'https://userauthapis.xbees.in/api/auth/generateToken',
      process.env.XPRESSBEES_AUTH_BASE || process.env.XPRESSBEES_API_BASE || 'https://userauthapis.xbees.in',
    )
  private serviceabilityEndpoint =
    this.normalizeEndpoint(
      process.env.XPRESSBEES_SERVICEABILITY_ENDPOINT,
      'https://xbmasterapi.xbees.in/expose/get/serviceabilitypincode/details',
      process.env.XPRESSBEES_SERVICEABILITY_BASE || 'https://xbmasterapi.xbees.in',
    )
  private shipmentEndpoint =
    this.normalizeEndpoint(
      process.env.XPRESSBEES_SHIPMENT_ENDPOINT,
      'https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward',
      process.env.XPRESSBEES_SHIPMENT_BASE || 'https://apishipmentmanifestation.xbees.in',
    )
  private reverseShipmentEndpoint =
    process.env.XPRESSBEES_REVERSE_SHIPMENT_ENDPOINT || '/api/reverseshipments'
  private trackingSummaryEndpoint =
    process.env.XPRESSBEES_TRACKING_SUMMARY_ENDPOINT ||
    'https://apishipmenttracking.xbees.in/GetShipmentAuditLog'
  private trackingBulkEndpoint =
    process.env.XPRESSBEES_TRACKING_BULK_ENDPOINT ||
    'https://apishipmenttracking.xbees.in/GetCurrentShipmentStatus'
  private awbGenerationEndpoint =
    process.env.XPRESSBEES_AWB_GENERATION_ENDPOINT ||
    'https://xbclientapi.xbees.in/POSTShipmentService.svc/AWBNumberSeriesGeneration'
  private awbSeriesLookupEndpoint =
    process.env.XPRESSBEES_AWB_SERIES_LOOKUP_ENDPOINT ||
    'https://xbclientapi.xbees.in/TrackingService.svc/GetAWBNumberGeneratedSeries'
  private cancellationEndpoint =
    process.env.XPRESSBEES_CANCELLATION_ENDPOINT ||
    'https://clientshipupdatesapi.xbees.in/forwardcancellation'
  private deferredDeliveryEndpoint =
    process.env.XPRESSBEES_DEFERRED_DELIVERY_ENDPOINT ||
    'https://clientshipupdatesapi.xbees.in/client/UpdateNDRDeferredDeliveryDate'

  private static cachedConfig: XpressbeesConfig | null | undefined

  private log(prefix: string, details: any) {
    console.log(`[Xpressbees] ${prefix}`, details)
  }

  private sanitizeForLogs(value: any, keyPath = ''): any {
    if (value == null) return value
    if (Array.isArray(value)) {
      return value.map((item, index) => this.sanitizeForLogs(item, `${keyPath}[${index}]`))
    }

    if (typeof value === 'object') {
      const result: Record<string, any> = {}
      for (const [key, nested] of Object.entries(value)) {
        const nextPath = keyPath ? `${keyPath}.${key}` : key
        const loweredKey = key.toLowerCase()

        if (
          [
            'authorization',
            'password',
            'token',
            'api_token',
            'apikey',
            'apikey',
            'secret',
          ].includes(loweredKey)
        ) {
          result[key] = nested ? '[redacted]' : nested
          continue
        }

        if (loweredKey === 'phone' || loweredKey === 'alternate_phone') {
          const normalized = String(nested ?? '').replace(/\D/g, '')
          result[key] =
            normalized.length > 4
              ? `${normalized.slice(0, 2)}****${normalized.slice(-2)}`
              : normalized
          continue
        }

        if (loweredKey === 'email' || loweredKey === 'username' || loweredKey === 'login_id') {
          const normalized = String(nested ?? '').trim()
          if (!normalized || !normalized.includes('@')) {
            result[key] = normalized ? `${normalized.slice(0, 2)}***` : normalized
          } else {
            const [local, domain] = normalized.split('@')
            result[key] = `${local.slice(0, 2)}***@${domain}`
          }
          continue
        }

        if (loweredKey.startsWith('address')) {
          result[key] = nested ? '[address redacted]' : nested
          continue
        }

        result[key] = this.sanitizeForLogs(nested, nextPath)
      }
      return result
    }

    if (typeof value === 'string') {
      if (keyPath.toLowerCase().includes('label')) {
        return value.length > 120 ? `${value.slice(0, 120)}...` : value
      }
      return value
    }

    return value
  }

  private extractValidationMessages(value: any): string[] {
    const details = Array.isArray(value?.details) ? value.details : []
    return details.map((item: any) => String(item?.message || '').trim()).filter(Boolean)
  }

  private async ensureConfigLoaded() {
    if (XpressbeesService.cachedConfig === undefined) {
      XpressbeesService.cachedConfig = await getEffectiveCourierConfig<XpressbeesConfig>(
        'xpressbees',
        'b2c',
      )
    }

    const cfg = XpressbeesService.cachedConfig
    if (cfg) {
      this.baseApi = cfg.apiBase || this.baseApi
      this.apiToken = cfg.apiToken || this.apiToken
      this.username = cfg.email || this.username
      this.password = cfg.password || this.password
      this.secretKey = cfg.secretKey || this.secretKey
      this.xbKey = cfg.xbKey || this.xbKey
    }
    this.baseApi = this.normalizeBaseApi(this.baseApi)
    this.log('Config loaded', {
      baseApi: this.baseApi,
      hasApiToken: Boolean(this.apiToken),
      hasUsername: Boolean(this.username),
      hasPassword: Boolean(this.password),
      hasSecretKey: Boolean(this.secretKey),
      hasXbKey: Boolean(this.xbKey),
      source: cfg ? 'courier_credentials_or_env_fallback' : 'env_only',
    })
  }

  private normalizeBaseApi(value: string): string {
    const base =
      String(value || '').trim() ||
      'https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward'
    return base.replace(/\/+$/, '')
  }

  private normalizeServiceType(value: any): string | null {
    const normalized = String(value || '')
      .trim()
      .toUpperCase()

    if (!normalized) return null

    const allowed = new Set(['SD', 'SDD', 'NDD', 'AIR', 'SFC', 'INTRASDD'])
    return allowed.has(normalized) ? normalized : null
  }

  private normalizeVendorCode(value: any): string {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 30)
  }

  private buildPickupVendorCode(payload: Record<string, any>): string {
    const explicitVendorCode =
      payload?.pickup_vendor_code ||
      payload?.pickupVendorCode ||
      payload?.vendor_code ||
      payload?.vendorCode
    const normalizedExplicit = this.normalizeVendorCode(explicitVendorCode)
    if (normalizedExplicit) return normalizedExplicit

    const derivedSeed =
      payload?.pickup_location_id ||
      payload?.pickup?.warehouse_name ||
      payload?.pickup?.name ||
      payload?.pickup?.addressNickname ||
      payload?.order_number ||
      payload?.unique_order_number ||
      'ExpressoPro'

    const normalizedDerived = this.normalizeVendorCode(derivedSeed)
    if (normalizedDerived) return normalizedDerived

    return 'ExpressoPro'
  }

  private extractAwbFromResponse(raw: any): string {
    const directCandidates = [
      raw?.awb,
      raw?.awb_no,
      raw?.awbNo,
      raw?.awb_number,
      raw?.waybill,
      raw?.waybill_number,
      raw?.data?.awb,
      raw?.data?.awb_no,
      raw?.data?.awbNo,
      raw?.data?.awb_number,
      raw?.data?.waybill,
      raw?.data?.waybill_number,
      raw?.result?.awb,
      raw?.result?.awb_no,
      raw?.result?.awbNo,
      raw?.result?.awb_number,
      raw?.result?.waybill,
      raw?.result?.waybill_number,
    ]

    for (const candidate of directCandidates) {
      const awb = String(candidate || '').trim()
      if (awb) return awb
    }

    const collections = [
      raw?.data,
      raw?.result,
      raw?.data?.data,
      raw?.awbs,
      raw?.awb_numbers,
      raw?.series,
      raw?.rows,
    ]

    for (const collection of collections) {
      if (!Array.isArray(collection)) continue
      for (const item of collection) {
        const awb = this.extractAwbFromResponse(item)
        if (awb) return awb
      }
    }

    return ''
  }

  private async tryReserveRuntimeAwb(payload: Record<string, any>) {
    const serviceType = this.normalizeServiceType(
      payload?.service_type || payload?.serviceType || payload?.transport_speed,
    )
    const pickupVendorCode = this.buildPickupVendorCode(payload)

    const requestPayload = {
      auth_type: 'new',
      count: 1,
      awb_count: 1,
      service_type: serviceType || undefined,
      pickup_vendor_code: pickupVendorCode,
      vendor_code: pickupVendorCode,
      ...this.buildBusinessUnitFields(),
      ...this.buildBusinessFlowFields(serviceType),
      ...this.buildBusinessServiceFields(serviceType),
    }

    try {
      const generated = await this.generateAwbSeries(requestPayload)
      const generatedAwb = this.extractAwbFromResponse(generated)
      if (generatedAwb) {
        this.log('Reserved runtime AWB', {
          pickupVendorCode,
          serviceType,
          awb: generatedAwb,
        })
        return { awbNumber: generatedAwb, pickupVendorCode, serviceType }
      }
    } catch (err: any) {
      this.log('Runtime AWB generation skipped', {
        pickupVendorCode,
        serviceType,
        message: err?.message || err,
      })
    }

    try {
      const seriesLookup = await this.getGeneratedAwbSeries({
        auth_type: 'new',
        pickup_vendor_code: pickupVendorCode,
        vendor_code: pickupVendorCode,
        service_type: serviceType || undefined,
        ...this.buildBusinessUnitFields(),
        ...this.buildBusinessFlowFields(serviceType),
        ...this.buildBusinessServiceFields(serviceType),
      })
      const lookedUpAwb = this.extractAwbFromResponse(seriesLookup)
      if (lookedUpAwb) {
        this.log('Resolved runtime AWB from generated series lookup', {
          pickupVendorCode,
          serviceType,
          awb: lookedUpAwb,
        })
        return { awbNumber: lookedUpAwb, pickupVendorCode, serviceType }
      }
    } catch (err: any) {
      this.log('Runtime AWB series lookup skipped', {
        pickupVendorCode,
        serviceType,
        message: err?.message || err,
      })
    }

    return {
      awbNumber: '',
      pickupVendorCode,
      serviceType,
    }
  }

  private isAbsoluteUrl(value: string) {
    return /^https?:\/\//i.test(String(value || '').trim())
  }

  private buildAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      Token: token,
      token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.secretKey ? { secretkey: this.secretKey, 'Secret-Key': this.secretKey } : {}),
      ...(this.xbKey ? { xbkey: this.xbKey, 'XB-Key': this.xbKey } : {}),
      ...(this.businessUnit ? { BusinessUnit: this.businessUnit } : {}),
    }
  }

  private buildBusinessUnitFields() {
    return this.businessUnit ? { BusinessUnit: this.businessUnit } : {}
  }

  private buildBusinessFlowFields(flowOverride?: string | null) {
    const normalizedFlow = this.normalizeServiceType(flowOverride || this.businessFlow || 'NDD')
    return normalizedFlow ? { BusinessFlow: normalizedFlow } : {}
  }

  private buildBusinessServiceFields(serviceOverride?: string | null) {
    const normalizedService = this.normalizeServiceType(
      serviceOverride || this.businessService || this.businessFlow || 'NDD',
    )
    return normalizedService ? { BusinessService: normalizedService } : {}
  }

  private buildEndpoint(path: string): string {
    return this.buildEndpointForBase(this.baseApi, path)
  }

  private buildEndpointForBase(baseApi: string, path: string): string {
    const normalizedPath = `/${String(path || '').replace(/^\/+/, '')}`
    const baseHasApiSuffix = /\/api$/i.test(baseApi)
    if (baseHasApiSuffix && normalizedPath.startsWith('/api/')) {
      return normalizedPath.replace(/^\/api/i, '')
    }
    return normalizedPath
  }

  private getBaseCandidates(): string[] {
    const candidates = new Set<string>()
    const push = (value: string) => {
      const normalized = this.normalizeBaseApi(value)
      if (normalized) candidates.add(normalized)
    }

    push(this.baseApi)

    const rawEnvAlternates = String(process.env.XPRESSBEES_ALT_API_BASE || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    for (const alt of rawEnvAlternates) push(alt)

    return Array.from(candidates)
  }

  private createHttpClient(baseURL: string, token: string): AxiosInstance {
    return axios.create({
      baseURL,
      timeout: 20000,
      headers: this.buildAuthHeaders(token),
    })
  }

  private isRetryableEndpointError(err: any): boolean {
    const status = Number(err?.response?.status || 0)
    return status === 404 || status === 405
  }

  private isInvalidTokenError(err: any): boolean {
    const status = Number(err?.response?.status || 0)
    const message = String(
      err?.response?.data?.message || err?.response?.data?.error || err?.message || '',
    ).toLowerCase()

    return (
      status === 401 ||
      message.includes('invalid token') ||
      message.includes('missing or invalid token')
    )
  }

  private isInvalidTokenResponse(raw: any): boolean {
    const returnCode = Number(raw?.ReturnCode ?? raw?.returnCode ?? raw?.code ?? 0)
    const message = String(
      raw?.ReturnMessage?.message || raw?.ReturnMessage || raw?.message || raw?.error || '',
    ).toLowerCase()

    return (
      returnCode === 101 ||
      message.includes('token not provided') ||
      message.includes('invalid token') ||
      message.includes('missing or invalid token')
    )
  }

  private extractErrorMessage(err: any, fallback: string): string {
    const candidates = [
      err?.response?.data?.message,
      err?.response?.data?.description,
      err?.response?.data?.error,
      this.extractValidationMessages(err?.response?.data?.ReturnMessage).join('; '),
      err?.message,
    ]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }

    return fallback
  }

  private async requestWithFallback<T>({
    method,
    pathCandidates,
    data,
    logPayload = true,
  }: {
    method: 'get' | 'post'
    pathCandidates: string[]
    data?: any
    logPayload?: boolean
  }): Promise<T> {
    await this.ensureConfigLoaded()
    const baseCandidates = this.getBaseCandidates()
    const dedupedPaths = Array.from(new Set(pathCandidates.filter(Boolean)))
    let lastError: any = null
    const attemptedUrls: string[] = []
    let attemptedTokenRefresh = false

    for (const baseCandidate of baseCandidates) {
      for (const pathCandidate of dedupedPaths) {
        const requestPath = this.buildEndpointForBase(baseCandidate, pathCandidate)
        const isAbsoluteUrl = this.isAbsoluteUrl(pathCandidate)
        const requestUrl = isAbsoluteUrl ? pathCandidate : `${baseCandidate}${requestPath}`
        attemptedUrls.push(requestUrl)
        try {
          const token = await this.getApiToken(attemptedTokenRefresh)
          this.log('API attempt', {
            method,
            url: requestUrl,
            payload: logPayload ? this.sanitizeForLogs(data) : undefined,
            tokenRefresh: attemptedTokenRefresh,
          })
          const response = isAbsoluteUrl
            ? await axios.request<T>({
                method,
                url: requestUrl,
                data,
                timeout: 20000,
                headers: this.buildAuthHeaders(token),
              })
            : await this.createHttpClient(baseCandidate, token).request<T>({
                method,
                url: requestPath,
                data,
              })

          if (!isAbsoluteUrl && baseCandidate !== this.baseApi) {
            this.log('Resolved alternate Xpressbees base URL', {
              previousBaseApi: this.baseApi,
              resolvedBaseApi: baseCandidate,
            })
            this.baseApi = baseCandidate
          }

          this.log('API response', {
            method,
            url: requestUrl,
            payload: logPayload ? this.sanitizeForLogs(data) : undefined,
            response: this.sanitizeForLogs(response.data),
          })

          if (!attemptedTokenRefresh && this.isInvalidTokenResponse(response.data)) {
            attemptedTokenRefresh = true
            this.apiToken = ''
            this.log('Retrying request after Xpressbees token response error', {
              method,
              url: requestUrl,
              response: this.sanitizeForLogs(response.data),
            })
            continue
          }

          return response.data
        } catch (err: any) {
          if (!attemptedTokenRefresh && this.isInvalidTokenError(err)) {
            attemptedTokenRefresh = true
            this.apiToken = ''
            this.log('Retrying request with refreshed Xpressbees token', {
              method,
              url: requestUrl,
            })
            continue
          }

          lastError = err
          this.log('API attempt failed', {
            method,
            url: requestUrl,
            payload: logPayload ? this.sanitizeForLogs(data) : undefined,
            status: err?.response?.status || null,
            statusText: err?.response?.statusText || null,
            response:
              typeof err?.response?.data === 'string'
                ? err.response.data.slice(0, 300)
                : this.sanitizeForLogs(err?.response?.data) || null,
            message: err?.message || err,
          })

          if (!this.isRetryableEndpointError(err)) {
            throw err
          }
        }
      }
    }

    const allAttemptsWereEndpointMisses =
      attemptedUrls.length > 0 &&
      this.isRetryableEndpointError(lastError) &&
      attemptedUrls.length >= dedupedPaths.length

    if (allAttemptsWereEndpointMisses) {
      throw new HttpError(
        502,
        ` API endpoint not found for the configured base URL. Tried: ${attemptedUrls.join(
          ', ',
        )}. Verify the  API base URL in courier credentials and confirm your account's shipment endpoint.`,
      )
    }

    if (lastError) {
      throw new HttpError(
        Number(lastError?.response?.status || 502),
        this.extractErrorMessage(lastError, 'Xpressbees API request failed'),
      )
    }

    throw lastError
  }

  private async getHttp(): Promise<AxiosInstance> {
    await this.ensureConfigLoaded()
    const token = await this.getApiToken()

    return this.createHttpClient(this.baseApi, token)
  }

  private extractTokenFromResponse(raw: any): string {
    const fromDirectCandidates = [
      raw?.token,
      raw?.access_token,
      raw?.jwt,
      raw?.data?.token,
      raw?.data?.access_token,
      raw?.data?.jwt,
      raw?.data?.accessToken,
      raw?.accessToken,
      raw?.result?.token,
      raw?.result?.access_token,
      raw?.result?.accessToken,
      raw?.data?.data?.token,
      raw?.data?.data?.access_token,
      raw?.data?.data?.accessToken,
      raw?.data?.jwt_token,
      raw?.data?.auth_token,
      raw?.auth_token,
      raw?.data?.authToken,
      raw?.authToken,
    ]

    for (const candidate of fromDirectCandidates) {
      const token = String(candidate || '').trim()
      if (token) return token
    }

    const visited = new Set<any>()
    const deepSearch = (value: any): string => {
      if (!value || typeof value !== 'object') return ''
      if (visited.has(value)) return ''
      visited.add(value)

      if (Array.isArray(value)) {
        for (const item of value) {
          const token = deepSearch(item)
          if (token) return token
        }
        return ''
      }

      for (const [key, nested] of Object.entries(value)) {
        const normalizedKey = key.toLowerCase()
        if (
          [
            'token',
            'access_token',
            'accesstoken',
            'jwt',
            'jwt_token',
            'auth_token',
            'authtoken',
          ].includes(normalizedKey)
        ) {
          const token = String(nested || '').trim()
          if (token) return token
        }
      }

      for (const nested of Object.values(value)) {
        const token = deepSearch(nested)
        if (token) return token
      }

      return ''
    }

    const recursiveToken = deepSearch(raw)
    if (recursiveToken) return recursiveToken

    const candidates = [raw?.data, raw?.result]

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const token = candidate.trim()
        if (token && token.length > 20 && !token.startsWith('{')) return token
      }
    }
    return ''
  }

  private async persistGeneratedToken(token: string) {
    try {
      if (token.length > 255) {
        this.log('Generated API token not persisted', {
          reason: 'token exceeds courier_credentials.api_key length',
          tokenLength: token.length,
        })
        return
      }

      await db
        .update(courier_credentials)
        .set({
          apiKey: token,
          updatedAt: new Date(),
        })
        .where(eq(courier_credentials.provider, 'xpressbees'))
      this.log('Persisted generated API token to courier credentials', {
        tokenPreview: `${token.slice(0, 4)}...${token.slice(-4)}`,
      })
    } catch (err: any) {
      this.log('Token persist skipped', {
        message: err?.message || String(err),
        code: err?.code || err?.cause?.code || null,
      })
    }
  }

  private async generateApiToken(): Promise<string> {
    await this.ensureConfigLoaded()

    if (!this.username || !this.password) {
      throw new Error(
        'Xpressbees API token is not configured and username/password are missing. Save bearer token or login credentials in courier credentials.',
      )
    }

    const payloadVariants = [
      { email: this.username, password: this.password },
      { username: this.username, password: this.password },
      { login_id: this.username, password: this.password },
      ...(this.secretKey
        ? [
            { username: this.username, password: this.password, secretkey: this.secretKey },
            { email: this.username, password: this.password, secretkey: this.secretKey },
            { login_id: this.username, password: this.password, secretkey: this.secretKey },
            { username: this.username, password: this.password, secret_key: this.secretKey },
            { email: this.username, password: this.password, secret_key: this.secretKey },
            { login_id: this.username, password: this.password, secret_key: this.secretKey },
          ]
        : []),
      ...(this.xbKey
        ? [
            { username: this.username, password: this.password, xbkey: this.xbKey },
            { email: this.username, password: this.password, xbkey: this.xbKey },
            { login_id: this.username, password: this.password, xbkey: this.xbKey },
          ]
        : []),
    ]
    const endpointCandidates = Array.from(new Set([this.tokenEndpoint].filter(Boolean)))

    let lastError: any = null
    this.log('Generating API token', {
      authUrl: this.tokenEndpoint,
      endpointCandidates,
      hasUsername: Boolean(this.username),
      hasPassword: Boolean(this.password),
      hasSecretKey: Boolean(this.secretKey),
      hasXbKey: Boolean(this.xbKey),
      tokenEndpointOverride: process.env.XPRESSBEES_TOKEN_ENDPOINT || null,
    })

    for (const endpoint of endpointCandidates) {
      for (const body of payloadVariants) {
        try {
          const requestUrl = this.isAbsoluteUrl(endpoint)
            ? endpoint
            : `${this.baseApi}${this.buildEndpoint(endpoint)}`
          this.log('Auth attempt', {
            url: requestUrl,
            payloadKeys: Object.keys(body),
            hasLogin: Boolean(this.username),
          })
          const res = await axios.post(requestUrl, body, {
            timeout: 20000,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Auth-Type': 'New',
              ...this.buildBusinessUnitFields(),
              ...this.buildBusinessFlowFields(),
              ...this.buildBusinessServiceFields(),
              ...(this.secretKey
                ? { secretkey: this.secretKey, 'Secret-Key': this.secretKey }
                : {}),
              ...(this.xbKey ? { xbkey: this.xbKey, 'XB-Key': this.xbKey } : {}),
            },
          })
          const token = this.extractTokenFromResponse(res.data)
          this.log('Auth response', {
            url: requestUrl,
            status: res.status,
            hasToken: Boolean(token),
            responseKeys: Object.keys(res.data || {}),
          })
          if (!token) {
            this.log('Auth response body (no token extracted)', {
              url: requestUrl,
              body:
                typeof res.data === 'string'
                  ? res.data.slice(0, 500)
                  : JSON.stringify(res.data).slice(0, 1000),
            })
          }
          if (token) {
            this.apiToken = token
            this.tokenEndpoint = endpoint
            await this.persistGeneratedToken(token)
            this.log('Generated API token via login credentials', {
              endpoint,
              hasLogin: Boolean(this.username),
            })
            return token
          }
        } catch (err: any) {
          lastError = err
          this.log('Auth attempt failed', {
            url: this.isAbsoluteUrl(endpoint)
              ? endpoint
              : `${this.baseApi}${this.buildEndpoint(endpoint)}`,
            payloadKeys: Object.keys(body),
            status: err?.response?.status || null,
            statusText: err?.response?.statusText || null,
            response:
              typeof err?.response?.data === 'string'
                ? err.response.data.slice(0, 300)
                : err?.response?.data || null,
            message: err?.message || err,
          })
        }
      }
    }

    throw new Error(
      `Failed to generate Xpressbees API token. Tried ${endpointCandidates.join(', ')}. ${
        lastError?.response?.data?.message || lastError?.message || 'unknown error'
      }. Set XPRESSBEES_TOKEN_ENDPOINT if your account uses a different login path.`,
    )
  }

  async getApiToken(forceRefresh = false): Promise<string> {
    await this.ensureConfigLoaded()
    const savedToken = String(this.apiToken || '').trim()
    const looksLikeBearerToken = savedToken.split('.').length === 3 || savedToken.length >= 80
    if (!forceRefresh && savedToken && looksLikeBearerToken) return savedToken
    if (savedToken && !looksLikeBearerToken) {
      this.xbKey = this.xbKey || savedToken
      this.apiToken = ''
    }
    return this.generateApiToken()
  }

  async checkServiceability(payload: {
    origin: string
    destination: string
    payment_type: 'cod' | 'prepaid'
    order_amount: string
    weight: string
    length: string
    breadth: string
    height: string
  }): Promise<XpressbeesServiceabilityResponse> {
    const raw = await this.requestWithFallback<any>({
      method: 'post',
      pathCandidates: [this.serviceabilityEndpoint],
      data: {
        ...this.buildBusinessUnitFields(),
        ...this.buildBusinessFlowFields(),
        ...this.buildBusinessServiceFields(),
      },
    })
    const records: XpressbeesServiceabilityRecord[] = Array.isArray(raw?.data) ? raw.data : []
    const status = raw?.status === true
    const validationMessages = this.extractValidationMessages(raw?.ReturnMessage)

    const recordMatchesPincode = (record: XpressbeesServiceabilityRecord, pincode: string) => {
      const normalized = String(pincode || '').trim()
      if (!normalized) return false
      const values = [
        record?.pincode,
        record?.pin_code,
        record?.pinCode,
        record?.Pincode,
        record?.PinCode,
        record?.destination_pincode,
        record?.destinationPincode,
        record?.serviceable_pincode,
        record?.serviceablePincode,
      ]
      return values.some((value) => String(value || '').trim() === normalized)
    }

    const hasOrigin = records.some((record) => recordMatchesPincode(record, payload.origin))
    const hasDestination = records.some((record) =>
      recordMatchesPincode(record, payload.destination),
    )
    const hasPincodeScopedData = records.some((record) =>
      [
        record?.pincode,
        record?.pin_code,
        record?.pinCode,
        record?.Pincode,
        record?.PinCode,
        record?.destination_pincode,
        record?.destinationPincode,
        record?.serviceable_pincode,
        record?.serviceablePincode,
      ].some((value) => String(value || '').trim()),
    )

    this.log('Serviceability', {
      origin: payload.origin,
      destination: payload.destination,
      status,
      records: records.length,
      hasOrigin,
      hasDestination,
      validationMessages,
    })

    const serviceable = status && records.length > 0 && (!hasPincodeScopedData || (hasOrigin && hasDestination))

    return {
      serviceable,
      records,
      codAvailable:
        payload.payment_type === 'prepaid'
          ? true
          : records.some(
              (record: XpressbeesServiceabilityRecord) => Number(record?.cod_charges ?? 0) >= 0,
            ),
      prepaidAvailable: true,
      tat: null,
      raw,
    }
  }

  async listNdr() {
    return this.requestWithFallback<any>({
      method: 'get',
      pathCandidates: ['/api/ndr', '/ndr'],
    })
  }

  async listCouriers() {
    return this.requestWithFallback<any>({
      method: 'get',
      pathCandidates: ['/api/courier', '/courier'],
    })
  }

  async submitNdrAction(payload: any[]) {
    const items = Array.isArray(payload) ? payload : [payload]
    return this.requestWithFallback<any>({
      method: 'post',
      pathCandidates: ['/api/ndr/create', '/ndr/create'],
      data: items,
    })
  }

  async createShipment(payload: any): Promise<XpressbeesShipmentResponse> {
    const runtimeAwb = await this.tryReserveRuntimeAwb(payload)
    const body = {
      order_number: payload.order_number,
      unique_order_number: payload.unique_order_number || 'no',
      shipping_charges: Number(payload.shipping_charges ?? 0),
      discount: Number(payload.discount ?? 0),
      cod_charges: Number(payload.cod_charges ?? 0),
      payment_type: payload.payment_type,
      order_amount: Number(payload.order_amount ?? 0),
      package_weight: Number(payload.package_weight ?? 0),
      package_length: Number(payload.package_length ?? 0),
      package_breadth: Number(payload.package_breadth ?? 0),
      package_height: Number(payload.package_height ?? 0),
      request_auto_pickup:
        String(payload.request_auto_pickup || '').toLowerCase() === 'yes' ? 'yes' : 'no',
      consignee: {
        name: payload?.consignee?.name,
        address: payload?.consignee?.address,
        address_2: payload?.consignee?.address_2 || '',
        city: payload?.consignee?.city,
        state: payload?.consignee?.state,
        pincode: String(payload?.consignee?.pincode || ''),
        phone: String(payload?.consignee?.phone || ''),
      },
      pickup: {
        warehouse_name: payload?.pickup?.warehouse_name,
        name: payload?.pickup?.name,
        address: payload?.pickup?.address,
        address_2: payload?.pickup?.address_2 || '',
        city: payload?.pickup?.city,
        state: payload?.pickup?.state,
        pincode: String(payload?.pickup?.pincode || ''),
        phone: String(payload?.pickup?.phone || ''),
      },
      is_rto_different: payload?.is_rto_different || 'no',
      ...(payload?.rto
        ? {
            rto: {
              warehouse_name: payload.rto.warehouse_name,
              name: payload.rto.name,
              address: payload.rto.address,
              address_2: payload.rto.address_2 || '',
              city: payload.rto.city,
              state: payload.rto.state,
              pincode: String(payload.rto.pincode || ''),
              phone: String(payload.rto.phone || ''),
            },
          }
        : {}),
      order_items: Array.isArray(payload?.order_items)
        ? payload.order_items.map((item: any) => ({
            name: item?.name,
            qty: String(item?.qty ?? 1),
            price: String(item?.price ?? 0),
            sku: item?.sku || '',
          }))
        : [],
      courier_id: payload?.courier_id ? String(payload.courier_id) : '',
      service_type:
        runtimeAwb.serviceType ||
        this.normalizeServiceType(
          payload?.service_type || payload?.serviceType || payload?.transport_speed,
        ) ||
        undefined,
      ...this.buildBusinessUnitFields(),
      ...this.buildBusinessFlowFields(
        runtimeAwb.serviceType ||
          this.normalizeServiceType(
            payload?.service_type || payload?.serviceType || payload?.transport_speed,
          ),
      ),
      ...this.buildBusinessServiceFields(
        runtimeAwb.serviceType ||
          this.normalizeServiceType(
            payload?.service_type || payload?.serviceType || payload?.transport_speed,
          ),
      ),
      pickup_vendor_code: runtimeAwb.pickupVendorCode,
      vendor_code: runtimeAwb.pickupVendorCode,
      ...(runtimeAwb.awbNumber
        ? {
            awb_number: runtimeAwb.awbNumber,
            awb: runtimeAwb.awbNumber,
          }
        : {}),
      collectable_amount:
        payload?.payment_type === 'cod'
          ? String(payload?.collectable_amount ?? payload?.order_amount ?? 0)
          : '0',
    }
    const response = await this.requestWithFallback<XpressbeesShipmentResponse>({
      method: 'post',
      pathCandidates: [this.shipmentEndpoint],
      data: body,
    })

    if (!response?.data?.awb_number && runtimeAwb.awbNumber) {
      response.data = {
        ...(response.data || {}),
        awb_number: runtimeAwb.awbNumber,
      }
    }

    if (!response?.data?.additional_info && runtimeAwb.pickupVendorCode) {
      response.data = {
        ...(response.data || {}),
        additional_info: `pickup_vendor_code:${runtimeAwb.pickupVendorCode}`,
      }
    }

    return response
  }

  async createReverseShipment(payload: any): Promise<XpressbeesShipmentResponse> {
    const body = {
      order_id: payload.order_id,
      request_auto_pickup:
        String(payload.request_auto_pickup || '').toLowerCase() === 'yes' ? 'yes' : 'no',
      consignee: {
        name: payload?.consignee?.name,
        address: payload?.consignee?.address,
        address_2: payload?.consignee?.address_2 || '',
        city: payload?.consignee?.city,
        state: payload?.consignee?.state,
        pincode: String(payload?.consignee?.pincode || ''),
        phone: String(payload?.consignee?.phone || ''),
        alternate_phone: String(payload?.consignee?.alternate_phone || ''),
      },
      pickup: {
        warehouse_name: payload?.pickup?.warehouse_name,
        name: payload?.pickup?.name,
        address: payload?.pickup?.address,
        address_2: payload?.pickup?.address_2 || '',
        city: payload?.pickup?.city,
        state: payload?.pickup?.state,
        pincode: String(payload?.pickup?.pincode || ''),
        phone: String(payload?.pickup?.phone || ''),
      },
      categories: payload?.categories || 'General',
      product_name: payload?.product_name || 'Return Item',
      product_qty: String(payload?.product_qty ?? 1),
      product_amount: String(payload?.product_amount ?? payload?.order_amount ?? 0),
      package_weight: Number(payload?.package_weight ?? 0),
      package_length: String(payload?.package_length ?? 0),
      package_breadth: String(payload?.package_breadth ?? 0),
      package_height: String(payload?.package_height ?? 0),
      qccheck: String(payload?.qccheck ?? '0'),
      uploadedimage: payload?.uploadedimage || '',
      uploadedimage_2: payload?.uploadedimage_2 || '',
      uploadedimage_3: payload?.uploadedimage_3 || '',
      uploadedimage_4: payload?.uploadedimage_4 || '',
      product_usage: String(payload?.product_usage ?? '0'),
      product_damage: String(payload?.product_damage ?? '0'),
      brandname: String(payload?.brandname ?? '0'),
      brandnametype: payload?.brandnametype || '',
      productsize: String(payload?.productsize ?? '0'),
      productsizetype: payload?.productsizetype || '',
      productcolor: String(payload?.productcolor ?? '0'),
      productcolourtype: payload?.productcolourtype || '',
    }
    return this.requestWithFallback<XpressbeesShipmentResponse>({
      method: 'post',
      pathCandidates: [
        this.reverseShipmentEndpoint,
        '/api/reverseshipments',
        '/reverseshipments',
        '/api/reverse-shipments',
        '/reverse-shipments',
      ],
      data: body,
    })
  }

  async generateManifest(awbs: string[]) {
    this.log('Skipping standalone Xpressbees manifest call', {
      reason: 'forward manifest is created during shipment booking for the live Xpressbees flow',
      awbCount: awbs.length,
    })
    return {
      status: true,
      skipped: true,
      message: 'Xpressbees forward manifest is handled during shipment creation.',
      awbs,
    }
  }

  async cancelShipment(awb: string) {
    return this.requestWithFallback<any>({
      method: 'post',
      pathCandidates: [this.cancellationEndpoint],
      data: { awb },
    })
  }

  async updateDeferredDeliveryDate(payload: {
    awb: string
    deferred_delivery_date: string
    reason?: string
    comments?: string
  }) {
    return this.requestWithFallback<any>({
      method: 'post',
      pathCandidates: [this.deferredDeliveryEndpoint],
      data: {
        awb: payload.awb,
        deferred_delivery_date: payload.deferred_delivery_date,
        re_attempt_date: payload.deferred_delivery_date,
        ...this.buildBusinessUnitFields(),
        ...this.buildBusinessFlowFields(),
        ...this.buildBusinessServiceFields(),
        ...(payload.reason ? { reason: payload.reason } : {}),
        ...(payload.comments ? { comments: payload.comments } : {}),
      },
    })
  }

  async trackShipmentSummary(awb: string) {
    return this.requestWithFallback<any>({
      method: 'post',
      pathCandidates: [this.trackingSummaryEndpoint],
      data: {
        awb_number: awb,
        ...this.buildBusinessUnitFields(),
        ...this.buildBusinessFlowFields(),
        ...this.buildBusinessServiceFields(),
      },
    })
  }

  async trackShipmentBulk(awbs: string[]) {
    return this.requestWithFallback<any>({
      method: 'post',
      pathCandidates: [this.trackingBulkEndpoint],
      data: {
        awb_numbers: awbs,
        ...this.buildBusinessUnitFields(),
        ...this.buildBusinessFlowFields(),
        ...this.buildBusinessServiceFields(),
      },
    })
  }

  async generateAwbSeries(payload: Record<string, any>) {
    return this.requestWithFallback<any>({
      method: 'post',
      pathCandidates: [this.awbGenerationEndpoint],
      data: payload,
    })
  }

  async getGeneratedAwbSeries(payload: Record<string, any>) {
    return this.requestWithFallback<any>({
      method: 'post',
      pathCandidates: [this.awbSeriesLookupEndpoint],
      data: payload,
    })
  }
}
