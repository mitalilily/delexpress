import axios, { AxiosRequestConfig } from 'axios'
import { and, eq } from 'drizzle-orm'
import { Request, Response } from 'express'
import { db } from '../client'
import { stores } from '../schema/stores'

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-01'
const SHOPIFY_WEBHOOK_TOPICS = ['orders/create', 'orders/updated', 'orders/cancelled'] as const
const EXPRESSOPRO_API_BASE_URL = 'https://api.expressopro.in'

interface UpsertShopifySettingsMetafieldParams {
  storeUrl: string // mystore.myshopify.com
  accessToken: string // Admin API token
  apiKey?: string
  authMode?: ShopifyAuthMode | string
  settings: Record<string, any> // Your custom settings
  id: string
  tx: any
}

export type ShopifyAuthMode = 'access_token' | 'basic'

type ShopifyCredentialCandidate = {
  label: string
  authMode: ShopifyAuthMode
  apiKey?: string
  accessToken: string
}

export const normalizeShopifyCredential = (value?: string | null): string => {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const adminTokenMatch = raw.match(/\bshpat_[A-Za-z0-9_-]+\b/i)
  if (adminTokenMatch?.[0]) return adminTokenMatch[0].trim()

  const bearerMatch = raw.match(/\bBearer\s+([A-Za-z0-9._:-]+)/i)
  if (bearerMatch?.[1]) return normalizeShopifyCredential(bearerMatch[1])

  const labelledMatch = raw.match(
    /\b(?:X-Shopify-Access-Token|Admin API Access Token|Admin API Password|API Key|Access Token|Password|Token)\s*[:=]\s*['"]?([^'",;\s]+)/i,
  )
  if (labelledMatch?.[1]) return normalizeShopifyCredential(labelledMatch[1])

  return raw
    .replace(/^['"`]+|['"`,;]+$/g, '')
    .replace(/\s+/g, '')
    .trim()
}

export const normalizeShopifyAuthMode = (
  authMode?: ShopifyAuthMode | string | null,
): ShopifyAuthMode => (String(authMode || '').toLowerCase() === 'basic' ? 'basic' : 'access_token')

export const buildShopifyRequestConfig = ({
  apiKey,
  accessToken,
  authMode,
}: {
  apiKey?: string | null
  accessToken: string
  authMode?: ShopifyAuthMode | string | null
}): AxiosRequestConfig => {
  const normalizedToken = normalizeShopifyCredential(accessToken)
  const normalizedApiKey = normalizeShopifyCredential(apiKey)
  const mode = normalizeShopifyAuthMode(authMode)
  const headers = { 'Content-Type': 'application/json' }

  if (mode === 'basic' && normalizedApiKey && normalizedToken) {
    return {
      auth: {
        username: normalizedApiKey,
        password: normalizedToken,
      },
      headers,
    }
  }

  return {
    headers: {
      ...headers,
      'X-Shopify-Access-Token': normalizedToken,
    },
  }
}

const extractShopifyUrlCredentials = (storeUrl: string) => {
  const rawStoreUrl = String(storeUrl || '').trim()
  if (!rawStoreUrl) return null

  const valueWithProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(rawStoreUrl)
    ? rawStoreUrl
    : `https://${rawStoreUrl}`

  try {
    const parsed = new URL(valueWithProtocol)
    const apiKey = normalizeShopifyCredential(decodeURIComponent(parsed.username || ''))
    const accessToken = normalizeShopifyCredential(decodeURIComponent(parsed.password || ''))
    return apiKey && accessToken ? { apiKey, accessToken } : null
  } catch {
    return null
  }
}

const extractColonCredentials = (value?: string | null) => {
  const raw = String(value || '').trim()
  const match = raw.match(/^([^:\s]+):([^@\s]+)$/)
  if (!match) return null

  const apiKey = normalizeShopifyCredential(match[1])
  const accessToken = normalizeShopifyCredential(match[2])
  return apiKey && accessToken ? { apiKey, accessToken } : null
}

const getShopifyCredentialCandidates = ({
  storeUrl,
  apiKey,
  adminApiAccessToken,
}: {
  storeUrl: string
  apiKey?: string | null
  adminApiAccessToken?: string | null
}) => {
  const token = normalizeShopifyCredential(adminApiAccessToken)
  const key = normalizeShopifyCredential(apiKey)
  const urlCredentials = extractShopifyUrlCredentials(storeUrl)
  const tokenColonCredentials = extractColonCredentials(adminApiAccessToken)
  const keyColonCredentials = extractColonCredentials(apiKey)
  const candidates: ShopifyCredentialCandidate[] = []
  const seen = new Set<string>()

  const addCandidate = (candidate: ShopifyCredentialCandidate) => {
    const normalizedToken = normalizeShopifyCredential(candidate.accessToken)
    const normalizedApiKey = normalizeShopifyCredential(candidate.apiKey)
    const authMode = normalizeShopifyAuthMode(candidate.authMode)

    if (!normalizedToken) return
    if (authMode === 'basic' && !normalizedApiKey) return

    const dedupeKey = `${authMode}:${normalizedApiKey}:${normalizedToken}`
    if (seen.has(dedupeKey)) return
    seen.add(dedupeKey)
    candidates.push({
      label: candidate.label,
      authMode,
      apiKey: normalizedApiKey,
      accessToken: normalizedToken,
    })
  }

  addCandidate({ label: 'admin-access-token', authMode: 'access_token', accessToken: token })

  if (/^shpat_/i.test(key)) {
    addCandidate({ label: 'api-key-field-as-access-token', authMode: 'access_token', accessToken: key })
  }

  addCandidate({ label: 'api-key-basic-auth', authMode: 'basic', apiKey: key, accessToken: token })

  if (urlCredentials) {
    addCandidate({
      label: 'store-url-basic-auth',
      authMode: 'basic',
      apiKey: urlCredentials.apiKey,
      accessToken: urlCredentials.accessToken,
    })
  }

  if (tokenColonCredentials) {
    addCandidate({
      label: 'token-field-basic-auth',
      authMode: 'basic',
      apiKey: tokenColonCredentials.apiKey,
      accessToken: tokenColonCredentials.accessToken,
    })
  }

  if (keyColonCredentials) {
    addCandidate({
      label: 'api-key-field-basic-auth',
      authMode: 'basic',
      apiKey: keyColonCredentials.apiKey,
      accessToken: keyColonCredentials.accessToken,
    })
  }

  if (key && token) {
    addCandidate({ label: 'swapped-basic-auth', authMode: 'basic', apiKey: token, accessToken: key })
  }

  return candidates
}

/**
 * Connects Shopify store using provided credentials
 * @param storeUrl Shopify store URL
 * @param apiKey Shopify API Key
 * @param adminApiAccessToken Shopify Admin API Access Token
 * @param hostName Shopify Host Name
 */
export const integrateWithShopify = async (
  storeUrl: string,
  apiKey: string,
  adminApiAccessToken: string,
) => {
  const normalizedDomain = assertValidShopifyDomain(storeUrl)
  const candidates = getShopifyCredentialCandidates({ storeUrl, apiKey, adminApiAccessToken })

  if (!candidates.length) {
    throw new Error('Shopify Admin API access token is required')
  }

  const shopifyApiUrl = `https://${normalizedDomain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`

  try {
    let successfulCandidate: ShopifyCredentialCandidate | null = null
    let response: any
    let lastError: any

    for (const candidate of candidates) {
      try {
        response = await axios.get(shopifyApiUrl, {
          ...buildShopifyRequestConfig(candidate),
          timeout: 30000,
        })
        successfulCandidate = candidate
        break
      } catch (error: any) {
        lastError = error
        const status = error?.response?.status
        console.warn(
          `Shopify auth attempt failed (${candidate.label}) for ${normalizedDomain}: ${
            status || error?.message || 'unknown error'
          }`,
        )
        if (status !== 401) throw error
      }
    }

    if (!response || !successfulCandidate) {
      throw lastError || new Error('Shopify authentication failed')
    }

    const shop = response.data?.shop
    if (!shop?.id) {
      throw new Error('Shopify did not return shop details')
    }

    const myshopifyDomain = normalizeShopifyDomain(shop.myshopify_domain || normalizedDomain)

    return {
      ...response.data,
      shopifyAuthMode: successfulCandidate.authMode,
      shopifyApiKey: successfulCandidate.apiKey || '',
      shopifyAdminApiAccessToken: successfulCandidate.accessToken,
      shop: {
        ...shop,
        domain: myshopifyDomain,
        myshopify_domain: myshopifyDomain,
        primary_domain: shop.domain || null,
      },
    }
  } catch (error: any) {
    const formattedError = formatShopifyAxiosError(error)
    console.error('Shopify API Error:', formattedError)
    if (error?.response?.status === 401) {
      throw new Error(
        `${formattedError}. Shopify rejected every supported credential format for ${normalizedDomain}. Use the Admin API access token from the installed custom app for this exact myshopify.com store. Modern tokens usually start with shpat_. Legacy private apps must include both API key and API password.`,
      )
    }
    throw new Error(formattedError)
  }
}

export const normalizeShopifyDomain = (domain?: string | null) => {
  const rawDomain = String(domain || '').trim().toLowerCase()
  if (!rawDomain) return ''

  const valueWithProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(rawDomain)
    ? rawDomain
    : `https://${rawDomain}`

  try {
    const parsed = new URL(valueWithProtocol)
    if (parsed.hostname === 'admin.shopify.com') {
      const pathParts = parsed.pathname.split('/').filter(Boolean)
      const storePathIndex = pathParts.findIndex((part) => part === 'store')
      const storeHandle = storePathIndex >= 0 ? pathParts[storePathIndex + 1] : ''
      if (storeHandle) return `${storeHandle}.myshopify.com`
    }

    return parsed.hostname.replace(/\/+$/, '')
  } catch {
    return rawDomain.replace(/^https?:\/\//, '').split(/[/?#]/)[0].replace(/\/+$/, '')
  }
}

const assertValidShopifyDomain = (domain: string) => {
  const normalized = normalizeShopifyDomain(domain)
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(normalized)) {
    throw new Error('Enter a valid Shopify myshopify.com domain or admin.shopify.com/store URL')
  }
  return normalized
}

const formatShopifyAxiosError = (error: any) => {
  const status = error?.response?.status
  const responseData = error?.response?.data
  const responseError =
    responseData?.errors || responseData?.error || responseData?.message || responseData
  const message =
    typeof responseError === 'string'
      ? responseError
      : responseError
        ? JSON.stringify(responseError)
        : error?.message || 'Unknown Shopify API error'

  return status ? `Shopify returned ${status}: ${message}` : message
}

const resolveExpressoproApiBaseUrl = () => {
  const rawBaseUrl = String(
    process.env.SHOPIFY_WEBHOOK_BASE_URL || process.env.API_URL || EXPRESSOPRO_API_BASE_URL,
  ).trim()
  const valueWithProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(rawBaseUrl)
    ? rawBaseUrl
    : `https://${rawBaseUrl}`

  try {
    const parsed = new URL(valueWithProtocol)
    const path = parsed.pathname.replace(/\/+$/, '').replace(/\/api$/i, '')
    return `${parsed.origin}${path}`.replace(/\/+$/, '')
  } catch {
    return EXPRESSOPRO_API_BASE_URL
  }
}

const resolveWebhookAddress = () => {
  const baseUrl = resolveExpressoproApiBaseUrl()
  return `${baseUrl}/api/webhooks/shopify/order-created`
}

export const ensureShopifyOrderWebhooks = async ({
  storeUrl,
  accessToken,
  apiKey,
  authMode,
}: {
  storeUrl: string
  accessToken: string
  apiKey?: string
  authMode?: ShopifyAuthMode | string
}) => {
  const address = resolveWebhookAddress()
  const normalizedDomain = normalizeShopifyDomain(storeUrl)
  const token = normalizeShopifyCredential(accessToken)
  if (!token) throw new Error('Shopify Admin API access token is required')

  const baseUrl = `https://${normalizedDomain}/admin/api/${SHOPIFY_API_VERSION}`
  const requestConfig = buildShopifyRequestConfig({ apiKey, accessToken: token, authMode })

  const { data } = await axios.get(`${baseUrl}/webhooks.json`, {
    ...requestConfig,
    params: { limit: 250 },
    timeout: 30000,
  })

  const existing = Array.isArray(data?.webhooks) ? data.webhooks : []
  const existingKeys = new Set(
    existing.map(
      (wh: any) => `${String(wh?.topic || '').toLowerCase()}::${String(wh?.address || '')}`,
    ),
  )

  const subscribed: string[] = []

  for (const topic of SHOPIFY_WEBHOOK_TOPICS) {
    const key = `${topic.toLowerCase()}::${address}`
    if (existingKeys.has(key)) {
      subscribed.push(topic)
      continue
    }

    await axios.post(
      `${baseUrl}/webhooks.json`,
      {
        webhook: {
          topic,
          address,
          format: 'json',
        },
      },
      { ...requestConfig, timeout: 30000 },
    )
    subscribed.push(topic)
  }

  return { address, subscribed }
}

export const integrateWithWooCommerce = async (
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string,
) => {
  try {
    const response = await axios.get(`${storeUrl}/wp-json/wc/v3`, {
      auth: {
        username: consumerKey.trim(),
        password: consumerSecret.trim(),
      },
    })

    return {
      storeName: response.data?.name || 'WooCommerce Store',
      url: storeUrl,
    }
  } catch (error: any) {
    console.error('❌ WooCommerce API Error:', error?.response?.data || error.message)
    throw new Error('Failed to connect to WooCommerce store')
  }
}

export const integrateWithMagento = async (storeUrl: string, accessToken: string) => {
  try {
    const response = await axios.get(`${storeUrl}/rest/V1/store/storeViews`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    return response.data
  } catch (error: any) {
    console.error('Magento API Error:', error?.response?.data || error.message)
    throw new Error('Failed to connect to Magento store')
  }
}

export const integrateWithWix = async (storeUrl: string, accessToken: string): Promise<any> => {
  try {
    const wixApiUrl = `https://www.wixapis.com/stores/v1/products` // Example endpoint
    const response = await axios.get(wixApiUrl, {
      headers: {
        Authorization: accessToken,
      },
    })
    return response.data
  } catch (error) {
    console.error('Wix API Error:', error)
    throw new Error('Failed to connect to Wix store')
  }
}

export async function upsertShopifySettingsMetafield({
  storeUrl,
  accessToken,
  apiKey,
  authMode,
  settings,
  tx = db,
  id,
}: UpsertShopifySettingsMetafieldParams): Promise<{ synced: boolean; warning?: string }> {
  const baseUrl = `https://${normalizeShopifyDomain(storeUrl)}/admin/api/${SHOPIFY_API_VERSION}`
  const requestConfig = buildShopifyRequestConfig({ apiKey, accessToken, authMode })

  await tx.update(stores).set({ settings, updatedAt: new Date() }).where(eq(stores.id, id))

  try {
    const { data: existing } = await axios.get(
      `${baseUrl}/metafields.json?namespace=ExpressoPro&key=settings`,
      { ...requestConfig, timeout: 30000 },
    )

    if (existing.metafields?.length > 0) {
      const metafieldId = existing.metafields[0].id
      await axios.put(
        `${baseUrl}/metafields/${metafieldId}.json`,
        {
          metafield: {
            id: metafieldId,
            value: JSON.stringify(settings),
            type: 'json',
          },
        },
        { ...requestConfig, timeout: 30000 },
      )
      console.log('✅ Updated Shopify settings metafield')
    } else {
      await axios.post(
        `${baseUrl}/metafields.json`,
        {
          metafield: {
            namespace: 'ExpressoPro',
            key: 'settings',
            value: JSON.stringify(settings),
            type: 'json',
            owner_resource: 'shop',
          },
        },
        { ...requestConfig, timeout: 30000 },
      )
      console.log('✅ Created new Shopify settings metafield')
    }

    return { synced: true }
  } catch (err: any) {
    console.error('❌ Failed to sync Shopify metafield:', err.response?.data || err.message)
    return {
      synced: false,
      warning:
        'Store connected, but Shopify settings could not be synced to Shopify metafields. Add metafield permissions to the Shopify app to enable remote settings sync.',
    }
  }
}

export const deleteStoreById = async (req: Request, res: Response): Promise<any> => {
  const { storeId } = req.params
  const userId = (req as any)?.user?.sub

  if (!storeId || !userId) {
    return res.status(400).json({ error: 'Missing store ID' })
  }

  try {
    const deleted = await db
      .delete(stores)
      .where(and(eq(stores.id, storeId), eq(stores.userId, userId as string)))

    if (deleted.rowCount === 0) {
      return res.status(404).json({ error: 'Store not found' })
    }

    res.status(200).json({ message: 'Store deleted successfully' })
  } catch (error) {
    console.error('❌ Failed to delete store:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
export const getStoresByUserId = async (userId: string) => {
  return await db.select().from(stores).where(eq(stores.userId, userId))
}
