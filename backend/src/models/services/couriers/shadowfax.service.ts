import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import {
  ShadowfaxConfig,
  getEffectiveCourierConfig,
} from '../courierCredentials.service'

export const DEFAULT_SHADOWFAX_STAGING_BASE_API = 'https://dale.staging.shadowfax.in/api'
export const DEFAULT_SHADOWFAX_BASE_API = 'https://dale.shadowfax.in/api'

const normalize = (value?: string | null) => String(value || '').trim()

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

  getBaseUrl() {
    return this.apiBase
  }
}
