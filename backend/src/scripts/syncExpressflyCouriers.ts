import axios from 'axios'
import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config({ path: '.env.production' })
dotenv.config()

type ExpressflyCourierInfo = {
  logistic_id?: string
  logisticId?: string
  logistics_id?: string
  id?: string
  _id?: string
  logistic_name?: string
  logisticName?: string
  logistics_name?: string
  courier_name?: string
  courierName?: string
  name?: string
}

type ExpressflyOrder = {
  courier_info?: ExpressflyCourierInfo
  courierInfo?: ExpressflyCourierInfo
  logistic_info?: ExpressflyCourierInfo
  logistics_info?: ExpressflyCourierInfo
  order_info?: Record<string, any>
}

type ExpressflyCredentials = {
  apiBase: string
  apiUserId: string
  apiKey: string
  shippingCourier: string
}

const SERVICE_PROVIDER = 'expressfly'
const DEFAULT_BASE_API = 'https://tech.expressfly.in/api'
const AUTH_PATH = '/unicommerce/authToken'
const PROFILE_PATH = '/auth/get-profile'
const ORDERS_PATH = '/orders'

const normalize = (value?: string | null) => String(value || '').trim()

const mask = (value?: string | null) => {
  const raw = normalize(value)
  if (!raw) return ''
  return `${raw.slice(0, 4)}${'*'.repeat(Math.max(raw.length - 8, 0))}${raw.slice(-4)}`
}

const firstValue = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = normalize(value as string | null | undefined)
    if (normalized) return normalized
  }
  return ''
}

const stableNumericIdFromString = (value: string) => {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) % 2147483646 + 1
}

const resolveCourierId = (courierId: string | number) => {
  const normalizedId = String(courierId ?? '').trim()
  if (!normalizedId) {
    throw new Error('Courier ID is required')
  }

  const parsed = Number(normalizedId)
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed
  }

  return stableNumericIdFromString(normalizedId)
}

const pickCourierInfo = (order: ExpressflyOrder) =>
  order?.courier_info ||
  order?.courierInfo ||
  order?.logistic_info ||
  order?.logistics_info ||
  (order?.order_info?.courier_info as ExpressflyCourierInfo | undefined) ||
  (order?.order_info?.courierInfo as ExpressflyCourierInfo | undefined) ||
  null

const buildUrl = (baseApi: string, path: string) => {
  const base = normalize(baseApi).replace(/\/+$/, '') || DEFAULT_BASE_API
  const cleanPath = normalize(path).startsWith('/') ? normalize(path) : `/${normalize(path)}`
  return `${base}${cleanPath}`
}

const loadCredentials = async (pool: Pool): Promise<ExpressflyCredentials> => {
  const result = await pool.query(
    `
      select api_base, api_key, client_id, username, password, client_name
      from courier_credentials
      where lower(provider) = $1
      limit 1
    `,
    [SERVICE_PROVIDER],
  )

  const row = result.rows[0] || {}
  const credentials = {
    apiBase: normalize(row.api_base || process.env.EXPRESSFLY_BASE_API) || DEFAULT_BASE_API,
    apiUserId: normalize(row.client_id || row.username || process.env.EXPRESSFLY_API_USER_ID),
    apiKey: normalize(row.api_key || row.password || process.env.EXPRESSFLY_API_KEY),
    shippingCourier:
      normalize(row.client_name || process.env.EXPRESSFLY_SHIPPING_COURIER) ||
      'Expressfly Logistics',
  }

  if (!credentials.apiUserId || !credentials.apiKey) {
    throw new Error('Expressfly API User ID and API Key are missing.')
  }

  return credentials
}

const extractToken = (raw: any) =>
  firstValue(
    raw?.token,
    raw?.accessToken,
    raw?.access_token,
    raw?.data?.token,
    raw?.data?.accessToken,
    raw?.data?.access_token,
    raw?.result?.token,
    raw?.result?.accessToken,
    raw?.result?.access_token,
  )

const extractErrorMessage = (response: any, fallback: string) =>
  firstValue(
    response?.data?.message,
    response?.data?.error,
    response?.data?.errors?.[0]?.message,
    response?.data?.errors?.[0]?.description,
    response?.data?.description,
    fallback,
  )

const authenticate = async (credentials: ExpressflyCredentials) => {
  const authUrl = buildUrl(credentials.apiBase, AUTH_PATH)
  const attempts = [
    {
      name: 'json',
      run: () =>
        axios.post(
          authUrl,
          { username: credentials.apiUserId, password: credentials.apiKey },
          {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            validateStatus: (status) => status >= 200 && status < 500,
          },
        ),
    },
    {
      name: 'form',
      run: () =>
        axios.post(
          authUrl,
          new URLSearchParams({
            username: credentials.apiUserId,
            password: credentials.apiKey,
          }),
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
            validateStatus: (status) => status >= 200 && status < 500,
          },
        ),
    },
    {
      name: 'query',
      run: () =>
        axios.get(authUrl, {
          timeout: 30000,
          params: { username: credentials.apiUserId, password: credentials.apiKey },
          headers: { Accept: 'application/json' },
          validateStatus: (status) => status >= 200 && status < 500,
        }),
    },
  ]

  let lastMessage = 'Expressfly authentication failed'
  for (const attempt of attempts) {
    const response = await attempt.run()
    if (response.status < 400) {
      const token = extractToken(response.data)
      if (!token) {
        throw new Error('Expressfly auth response did not include a token.')
      }

      console.log('[Expressfly sync] Authentication succeeded.', {
        method: attempt.name,
        status: response.status,
        apiUserId: mask(credentials.apiUserId),
        tokenPreview: mask(token),
      })
      return token
    }

    lastMessage = extractErrorMessage(response, lastMessage)
  }

  throw new Error(lastMessage)
}

const verifyProfile = async (credentials: ExpressflyCredentials, token: string) => {
  const response = await axios.get(buildUrl(credentials.apiBase, PROFILE_PATH), {
    timeout: 30000,
    headers: { Authorization: token, Accept: 'application/json' },
    validateStatus: (status) => status >= 200 && status < 500,
  })

  if (response.status >= 400) {
    throw new Error(extractErrorMessage(response, 'Expressfly profile verification failed'))
  }

  const profile = response.data?.data ?? response.data
  console.log('[Expressfly sync] Profile verification succeeded.', {
    status: response.status,
    email: firstValue(profile?.email, profile?.user?.email),
    fullName: firstValue(profile?.full_name, profile?.name, profile?.user?.name) || null,
  })
}

const fetchAllOrders = async (credentials: ExpressflyCredentials, token: string) => {
  const limit = 100
  const orders: ExpressflyOrder[] = []
  let offset = 0
  let total = Number.POSITIVE_INFINITY

  while (offset < total) {
    const response = await axios.get(buildUrl(credentials.apiBase, ORDERS_PATH), {
      timeout: 30000,
      params: { offset, limit },
      headers: { Authorization: token, Accept: 'application/json' },
      validateStatus: (status) => status >= 200 && status < 500,
    })

    if (response.status >= 400) {
      throw new Error(extractErrorMessage(response, 'Expressfly order list failed'))
    }

    const data = response.data?.data ?? response.data
    const batch = Array.isArray(data?.orders) ? (data.orders as ExpressflyOrder[]) : []
    orders.push(...batch)

    const nextTotal = Number(data?.total ?? orders.length)
    if (Number.isFinite(nextTotal) && nextTotal >= 0) {
      total = nextTotal
    }

    console.log('[Expressfly sync] Orders batch fetched.', {
      offset,
      batch: batch.length,
      total,
    })

    if (batch.length < limit || orders.length >= total) {
      break
    }

    offset += limit
  }

  return orders
}

const extractCouriers = (orders: ExpressflyOrder[]) => {
  const courierMap = new Map<string, { courierId: number; courierName: string; logisticId: string }>()

  for (const order of orders) {
    const courierInfo = pickCourierInfo(order)
    const logisticId = firstValue(
      courierInfo?.logistic_id,
      courierInfo?.logisticId,
      courierInfo?.logistics_id,
      courierInfo?.id,
      courierInfo?._id,
    )
    const courierName = firstValue(
      courierInfo?.courier_name,
      courierInfo?.courierName,
      courierInfo?.logistic_name,
      courierInfo?.logisticName,
      courierInfo?.logistics_name,
      courierInfo?.name,
    )

    if (!logisticId || !courierName) continue

    courierMap.set(logisticId, {
      courierId: resolveCourierId(logisticId),
      courierName,
      logisticId,
    })
  }

  return courierMap
}

const upsertCouriers = async (
  pool: Pool,
  courierMap: Map<string, { courierId: number; courierName: string; logisticId: string }>,
) => {
  let created = 0
  let updated = 0
  let skipped = 0

  for (const { courierId, courierName, logisticId } of courierMap.values()) {
    const existing = await pool.query(
      `
        select id, name, "isEnabled", business_type
        from couriers
        where id = $1 and "serviceProvider" = $2
        limit 1
      `,
      [courierId, SERVICE_PROVIDER],
    )

    const existingRow = existing.rows[0]
    if (existingRow) {
      const businessType = Array.isArray(existingRow.business_type) ? existingRow.business_type : []
      const shouldUpdate =
        existingRow.name !== courierName ||
        existingRow.isEnabled !== true ||
        JSON.stringify(businessType) !== JSON.stringify(['b2c', 'b2b'])

      if (!shouldUpdate) {
        skipped += 1
        continue
      }

      await pool.query(
        `
          update couriers
          set name = $1,
              "isEnabled" = true,
              business_type = '["b2c","b2b"]'::jsonb,
              updated_at = now()
          where id = $2 and "serviceProvider" = $3
        `,
        [courierName, courierId, SERVICE_PROVIDER],
      )
      updated += 1
      console.log(`[Expressfly sync] Updated courier ${courierId} -> ${courierName}`, {
        logisticId,
      })
      continue
    }

    await pool.query(
      `
        insert into couriers (id, name, "serviceProvider", business_type, "isEnabled", created_at, updated_at)
        values ($1, $2, $3, '["b2c","b2b"]'::jsonb, true, now(), now())
      `,
      [courierId, courierName, SERVICE_PROVIDER],
    )

    created += 1
    console.log(`[Expressfly sync] Inserted courier ${courierId} -> ${courierName}`, {
      logisticId,
    })
  }

  return { created, updated, skipped, total: courierMap.size }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.')
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const credentials = await loadCredentials(pool)
    console.log('[Expressfly sync] Credentials loaded.', {
      apiBase: credentials.apiBase,
      apiUserId: mask(credentials.apiUserId),
      hasApiKey: Boolean(credentials.apiKey),
      shippingCourier: credentials.shippingCourier,
    })

    const token = await authenticate(credentials)
    await verifyProfile(credentials, token)

    const orders = await fetchAllOrders(credentials, token)
    console.log(`[Expressfly sync] Scanned ${orders.length} Expressfly orders.`)

    const courierMap = extractCouriers(orders)
    if (!courierMap.size) {
      console.log('[Expressfly sync] No couriers were found in the live Expressfly order feed.')
      return
    }

    const result = await upsertCouriers(pool, courierMap)
    console.log(
      `[Expressfly sync] Complete. created=${result.created} updated=${result.updated} skipped=${result.skipped} total=${result.total}`,
    )
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('[Expressfly sync] Failed:', error)
  process.exit(1)
})
