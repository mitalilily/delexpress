import axios from 'axios'
import { and, eq } from 'drizzle-orm'
import { Request, Response } from 'express'
import { db } from '../client'
import { stores } from '../schema/stores'

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-01'
const SHOPIFY_WEBHOOK_TOPICS = ['orders/create', 'orders/updated', 'orders/cancelled'] as const

interface UpsertShopifySettingsMetafieldParams {
  storeUrl: string // mystore.myshopify.com
  accessToken: string // Admin API token
  settings: Record<string, any> // Your custom settings
  id: string
  tx: any
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
  const token = String(adminApiAccessToken || '').trim()

  if (!token) {
    throw new Error('Shopify Admin API access token is required')
  }

  const shopifyApiUrl = `https://${normalizedDomain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`

  try {
    const response = await axios.get(shopifyApiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      timeout: 30000,
    })

    const shop = response.data?.shop
    if (!shop?.id) {
      throw new Error('Shopify did not return shop details')
    }

    const myshopifyDomain = normalizeShopifyDomain(shop.myshopify_domain || normalizedDomain)

    return {
      ...response.data,
      shop: {
        ...shop,
        domain: myshopifyDomain,
        myshopify_domain: myshopifyDomain,
        primary_domain: shop.domain || null,
      },
    }
  } catch (error: any) {
    console.error('Shopify API Error:', formatShopifyAxiosError(error))
    throw new Error(formatShopifyAxiosError(error))
  }
}

export const normalizeShopifyDomain = (domain: string) =>
  String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')

const assertValidShopifyDomain = (domain: string) => {
  const normalized = normalizeShopifyDomain(domain)
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(normalized)) {
    throw new Error('Enter a valid Shopify myshopify.com domain')
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

const resolveWebhookAddress = () => {
  const baseUrl = String(process.env.API_URL || '')
    .trim()
    .replace(/\/+$/, '')
  if (!baseUrl) {
    throw new Error('API_URL is not configured for Shopify webhook registration')
  }
  return `${baseUrl}/api/webhook/shopify/orders`
}

export const ensureShopifyOrderWebhooks = async ({
  storeUrl,
  accessToken,
}: {
  storeUrl: string
  accessToken: string
}) => {
  const address = resolveWebhookAddress()
  const normalizedDomain = normalizeShopifyDomain(storeUrl)
  const token = String(accessToken || '').trim()
  if (!token) throw new Error('Shopify Admin API access token is required')

  const baseUrl = `https://${normalizedDomain}/admin/api/${SHOPIFY_API_VERSION}`
  const headers = {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json',
  }

  const { data } = await axios.get(`${baseUrl}/webhooks.json`, {
    headers,
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
      { headers, timeout: 30000 },
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
  settings,
  tx = db,
  id,
}: UpsertShopifySettingsMetafieldParams) {
  const baseUrl = `https://${normalizeShopifyDomain(storeUrl)}/admin/api/${SHOPIFY_API_VERSION}`
  const headers = {
    'X-Shopify-Access-Token': accessToken.trim(),
    'Content-Type': 'application/json',
  }

  try {
    const { data: existing } = await axios.get(
      `${baseUrl}/metafields.json?namespace=ExpressoPro&key=settings`,
      { headers, timeout: 30000 },
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
        { headers, timeout: 30000 },
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
        { headers, timeout: 30000 },
      )
      console.log('✅ Created new Shopify settings metafield')
    }

    // Also update in DB
    await tx.update(stores).set({ settings, updatedAt: new Date() }).where(eq(stores.id, id))
  } catch (err: any) {
    console.error('❌ Failed to sync Shopify metafield:', err.response?.data || err.message)
    throw new Error('Shopify metafield sync failed')
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
