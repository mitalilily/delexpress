import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getEffectiveCourierConfig, ShiprocketCargoConfig } from './courierCredentials.service'

const DEFAULT_BASE_URL = 'https://admin-cargo.shiprocket.in'

export class ShiprocketCargoError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly providerData?: unknown,
  ) {
    super(message)
    this.name = 'ShiprocketCargoError'
  }
}

export type CargoResponse<T = unknown> = {
  status: number
  data: T
}

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '')

const providerMessage = (data: any, fallback: string) => {
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (typeof data?.detail === 'string') return data.detail
  if (typeof data?.message === 'string') return data.message
  if (typeof data?.error === 'string') return data.error
  return fallback
}

class ShiprocketCargoClient {
  private accessToken = process.env.SHIPROCKET_CARGO_ACCESS_TOKEN?.trim() || ''
  private refreshToken = process.env.SHIPROCKET_CARGO_REFRESH_TOKEN?.trim() || ''

  private async loadDatabaseCredentials() {
    const config = await getEffectiveCourierConfig<ShiprocketCargoConfig>('shiprocket-cargo', 'b2b')
    if (config?.accessToken) this.accessToken = config.accessToken
    if (config?.refreshToken) this.refreshToken = config.refreshToken
  }

  private get baseUrl() {
    return normalizeBaseUrl(process.env.SHIPROCKET_CARGO_API_BASE || DEFAULT_BASE_URL)
  }

  private async request<T>(config: AxiosRequestConfig, authenticated = true): Promise<CargoResponse<T>> {
    await this.loadDatabaseCredentials()
    const headers = {
      Accept: 'application/json',
      ...(config.data ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated && this.accessToken
        ? { Authorization: `Bearer ${this.accessToken}` }
        : {}),
      ...(config.headers || {}),
    }

    let response: AxiosResponse<T>
    try {
      response = await axios.request<T>({
        ...config,
        baseURL: this.baseUrl,
        headers,
        timeout: Number(process.env.SHIPROCKET_CARGO_TIMEOUT_MS || 30000),
        validateStatus: () => true,
      })
    } catch (error: any) {
      throw new ShiprocketCargoError(502, 'Shiprocket Cargo API is unreachable.', {
        code: error?.code || 'UPSTREAM_UNREACHABLE',
      })
    }

    if (response.status < 200 || response.status >= 300) {
      throw new ShiprocketCargoError(
        response.status,
        providerMessage(response.data, `Shiprocket Cargo API returned HTTP ${response.status}.`),
        response.data,
      )
    }

    return { status: response.status, data: response.data }
  }

  async refresh(): Promise<CargoResponse<{ access?: string; refresh?: string }>> {
    await this.loadDatabaseCredentials()
    if (!this.accessToken || !this.refreshToken) {
      throw new ShiprocketCargoError(
        503,
        'Shiprocket Cargo access and refresh tokens are not configured.',
      )
    }

    const result = await this.request<{ access?: string; refresh?: string }>(
      {
        method: 'POST',
        url: '/api/token/refresh/',
        data: { refresh: this.refreshToken },
      },
      true,
    )

    if (result.data?.access) this.accessToken = result.data.access
    if (result.data?.refresh) this.refreshToken = result.data.refresh
    return result
  }

  createOrder(body: unknown) {
    return this.request({ method: 'POST', url: '/api/external/order_creation/', data: body })
  }

  associateShipment(body: unknown) {
    return this.request({ method: 'POST', url: '/api/order_shipment_association/', data: body })
  }

  getOrder(orderId: string) {
    return this.request({ method: 'GET', url: `/api/external/get_order/${encodeURIComponent(orderId)}/` })
  }

  calculateCharges(body: unknown) {
    return this.request({ method: 'POST', url: '/api/shipment/charges/', data: body })
  }

  trackShipment(waybillNo: string) {
    return this.request({
      method: 'GET',
      url: `/api/shipment/track/${encodeURIComponent(waybillNo)}/`,
    })
  }

  createWarehouse(body: unknown) {
    return this.request({ method: 'POST', url: '/api/warehouses/', data: body })
  }

  listWarehouses(params: Record<string, string | number | boolean | undefined>) {
    return this.request({ method: 'GET', url: '/api/warehouses/', params })
  }

  updateWarehouse(id: string, body: unknown) {
    return this.request({ method: 'PUT', url: `/api/warehouses/${encodeURIComponent(id)}/`, data: body })
  }

  updateAppointment(id: string, body: unknown) {
    return this.request({
      method: 'PUT',
      url: `/api/external/add_appointment/${encodeURIComponent(id)}/`,
      data: body,
    })
  }

  getShipment(shipmentId: string) {
    return this.request({
      method: 'GET',
      url: `/api/external/get_shipment/${encodeURIComponent(shipmentId)}`,
    })
  }
}

export const shiprocketCargoClient = new ShiprocketCargoClient()
