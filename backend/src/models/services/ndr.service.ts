import { eq, sql } from 'drizzle-orm'
import { db } from '../client'
import { b2c_orders } from '../schema/b2cOrders'
import { ndr_events } from '../schema/ndr'
import { tracking_events } from '../schema/trackingEvents'
import { sendWebhookEvent } from '../../services/webhookDelivery.service'
import { buildCsv } from '../../utils/csv'

type NdrListFilters = {
  userId?: string
  orderId?: string
  search?: string
  fromDate?: string
  toDate?: string
  courier?: string
  integration_type?: string
  attempt_count?: number
  status?: string
}

const parseOptionalDate = (value?: string) => {
  const parsed = value ? new Date(value) : null
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null
}

const getQueryRows = <T = Record<string, unknown>>(result: unknown): T[] => {
  if (Array.isArray(result)) return result as T[]
  if (result && typeof result === 'object' && Array.isArray((result as any).rows)) {
    return (result as any).rows as T[]
  }
  return []
}

const buildNdrWhereSql = (filters: NdrListFilters) => {
  const {
    userId,
    orderId,
    search = '',
    fromDate,
    toDate,
    courier,
    integration_type,
    attempt_count,
    status,
  } = filters
  const clauses: any[] = []

  if (userId) clauses.push(sql`e.user_id = ${userId}`)
  if (orderId) clauses.push(sql`e.order_id = ${orderId}`)

  const trimmedSearch = search.trim()
  if (trimmedSearch) {
    const searchTerm = `%${trimmedSearch}%`
    clauses.push(sql`(
      e.awb_number ILIKE ${searchTerm}
      OR e.order_id::text ILIKE ${searchTerm}
      OR coalesce(e.reason, '') ILIKE ${searchTerm}
      OR coalesce(e.remarks, '') ILIKE ${searchTerm}
    )`)
  }

  const parsedFrom = parseOptionalDate(fromDate)
  const parsedTo = parseOptionalDate(toDate)
  if (parsedFrom) clauses.push(sql`e.created_at >= ${parsedFrom}`)
  if (parsedTo) clauses.push(sql`e.created_at <= ${parsedTo}`)

  if (courier) clauses.push(sql`coalesce(o.courier_partner, '') ILIKE ${`%${courier}%`}`)
  if (integration_type) {
    clauses.push(sql`coalesce(o.integration_type, '') ILIKE ${`%${integration_type}%`}`)
  }
  if (attempt_count) clauses.push(sql`coalesce(e.attempt_no, '') = ${String(attempt_count)}`)
  if (status) clauses.push(sql`coalesce(e.status, '') ILIKE ${`%${status}%`}`)

  return clauses.length ? sql`WHERE ${sql.join(clauses, sql` AND `)}` : sql``
}

const buildDedupedNdrCte = (whereSql: any) => sql`
  WITH deduped_ndr_events AS (
    SELECT
      e.id,
      e.awb_number,
      e.order_id,
      e.status,
      e.reason,
      e.remarks,
      e.attempt_no,
      e.created_at,
      e.updated_at AS last_event_time,
      o.courier_partner,
      o.integration_type,
      o.user_id AS merchant_id,
      coalesce(
        up."companyInfo" ->> 'companyName',
        up."companyInfo" ->> 'businessName',
        up."companyInfo" ->> 'brandName',
        ''
      ) AS merchant_name,
      row_number() OVER (
        PARTITION BY
          e.order_id,
          coalesce(lower(btrim(e.status)), ''),
          coalesce(lower(btrim(e.reason)), ''),
          coalesce(lower(btrim(e.remarks)), ''),
          coalesce(btrim(e.attempt_no), '')
        ORDER BY e.created_at DESC, e.id DESC
      ) AS row_rank
    FROM ndr_events e
    LEFT JOIN b2c_orders o ON e.order_id = o.id
    LEFT JOIN user_profiles up ON up."userId" = o.user_id
    ${whereSql}
  )
`

async function listDedupedNdrEvents(filters: NdrListFilters, page: number, limit: number) {
  const offset = (page - 1) * limit
  const whereSql = buildNdrWhereSql(filters)
  const dedupedCte = buildDedupedNdrCte(whereSql)

  const rowsResult = await db.execute(sql`
    ${dedupedCte}
    SELECT
      id,
      awb_number,
      order_id,
      status,
      reason,
      remarks,
      attempt_no,
      created_at,
      last_event_time,
      courier_partner,
      integration_type,
      merchant_id,
      merchant_name
    FROM deduped_ndr_events
    WHERE row_rank = 1
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `)

  const countResult = await db.execute(sql`
    ${dedupedCte}
    SELECT count(*)::int AS total_count
    FROM deduped_ndr_events
    WHERE row_rank = 1
  `)

  return {
    rows: getQueryRows(rowsResult),
    totalCount: Number(getQueryRows<{ total_count: number }>(countResult)[0]?.total_count || 0),
  }
}

export async function recordNdrEvent(params: {
  orderId: string
  userId: string
  awbNumber?: string | null
  status: string
  reason?: string | null
  remarks?: string | null
  attemptNo?: string | null
  payload?: any
}) {
  const { orderId, userId, awbNumber, status, reason, remarks, attemptNo, payload } = params

  const [inserted] = await db
    .insert(ndr_events)
    .values({
      order_id: orderId,
      user_id: userId,
      awb_number: awbNumber || null,
      status,
      reason: reason || null,
      remarks: remarks || null,
      attempt_no: attemptNo || null,
      payload: payload || null,
    })
    .returning()

  sendWebhookEvent(userId, 'order.ndr', {
    order_id: orderId,
    awb_number: awbNumber,
    status,
    reason,
    remarks,
    attempt_no: attemptNo,
    created_at: inserted.created_at?.toISOString() || new Date().toISOString(),
  }).catch((err) => {
    console.error('Failed to send NDR webhook event:', err)
  })

  return inserted
}

export async function listNdrEvents(
  userId: string,
  orderId?: string,
  params?: { page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string },
) {
  const { page = 1, limit = 20, search = '', fromDate, toDate } = params || {}
  return listDedupedNdrEvents(
    {
      userId,
      orderId,
      search,
      fromDate,
      toDate,
    },
    page,
    limit,
  )
}

export async function listNdrEventsAdmin(
  orderId?: string,
  params?: {
    page?: number
    limit?: number
    search?: string
    fromDate?: string
    toDate?: string
    courier?: string
    integration_type?: string
    attempt_count?: number
    status?: string
  },
) {
  const {
    page = 1,
    limit = 20,
    search = '',
    fromDate,
    toDate,
    courier,
    integration_type,
    attempt_count,
    status,
  } = params || {}

  return listDedupedNdrEvents(
    {
      orderId,
      search,
      fromDate,
      toDate,
      courier,
      integration_type,
      attempt_count,
      status,
    },
    page,
    limit,
  )
}

export async function getAdminNdrKpisData(params?: {
  orderId?: string
  search?: string
  fromDate?: string
  toDate?: string
  courier?: string
  integration_type?: string
  attempt_count?: number
  status?: string
}) {
  const whereSql = buildNdrWhereSql(params || {})
  const dedupedCte = buildDedupedNdrCte(whereSql)

  const totalsResult = await db.execute(sql`
    ${dedupedCte}
    SELECT
      count(*)::int AS total,
      count(DISTINCT order_id)::int AS "ordersAffected"
    FROM deduped_ndr_events
    WHERE row_rank = 1
  `)
  const byStatusResult = await db.execute(sql`
    ${dedupedCte}
    SELECT status, count(*)::int AS count
    FROM deduped_ndr_events
    WHERE row_rank = 1
    GROUP BY status
    ORDER BY count DESC, status ASC
  `)
  const byCourierResult = await db.execute(sql`
    ${dedupedCte}
    SELECT coalesce(courier_partner, 'Unknown') AS courier, count(*)::int AS count
    FROM deduped_ndr_events
    WHERE row_rank = 1
    GROUP BY coalesce(courier_partner, 'Unknown')
    ORDER BY count DESC, courier ASC
  `)

  const totals = getQueryRows<{ total: number; ordersAffected: number }>(totalsResult)[0]
  const byStatus = getQueryRows<{ status: string; count: number }>(byStatusResult)
  const byCourier = getQueryRows<{ courier: string; count: number }>(byCourierResult)

  return {
    total: Number(totals?.total || 0),
    ordersAffected: Number(totals?.ordersAffected || 0),
    byStatus: byStatus.map((row) => ({ status: row.status, count: Number(row.count || 0) })),
    byCourier: byCourier.map((row) => ({
      courier: row.courier || 'Unknown',
      count: Number(row.count || 0),
    })),
  }
}

export async function adminNdrExport(params?: {
  orderId?: string
  search?: string
  fromDate?: string
  toDate?: string
  courier?: string
  integration_type?: string
  attempt_count?: number
  status?: string
}) {
  const rows = (await listDedupedNdrEvents(
    {
      orderId: params?.orderId,
      search: params?.search || '',
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      courier: params?.courier,
      integration_type: params?.integration_type,
      attempt_count: params?.attempt_count,
      status: params?.status,
    },
    1,
    100000,
  )) as { rows: any[]; totalCount: number }

  const headers = [
    'AWB',
    'OrderId',
    'Courier',
    'Integration',
    'Merchant',
    'Status',
    'Reason',
    'Remarks',
    'AttemptNo',
    'CreatedAt',
  ]

  return buildCsv(
    headers,
    rows.rows.map((r) => [
      r.awb_number || '',
      r.order_id || '',
      r.courier_partner || '',
      r.integration_type || '',
      r.merchant_name || '',
      r.status || '',
      r.reason || '',
      r.remarks || '',
      r.attempt_no || '',
      r.created_at ? new Date(r.created_at).toISOString() : '',
    ]),
  )
}

export async function getNdrTimeline(params: { awb?: string; orderId?: string }) {
  const { awb, orderId } = params

  let orderRow: { id: string; awb_number: string | null } | null = null

  if (orderId) {
    const [o] = await db
      .select({ id: b2c_orders.id, awb_number: b2c_orders.awb_number })
      .from(b2c_orders)
      .where(eq(b2c_orders.id, orderId))
      .limit(1)
    if (o) orderRow = o
  } else if (awb) {
    const [o] = await db
      .select({ id: b2c_orders.id, awb_number: b2c_orders.awb_number })
      .from(b2c_orders)
      .where(eq(b2c_orders.awb_number, awb))
      .limit(1)
    if (o) orderRow = o
  }

  const resolvedOrderId = orderRow?.id
  const resolvedAwb = orderRow?.awb_number || awb

  const ndr = await db
    .select({
      type: sql<string>`'ndr'`,
      at: ndr_events.created_at,
      status: ndr_events.status,
      remarks: ndr_events.remarks,
      reason: ndr_events.reason,
      attempt_no: ndr_events.attempt_no,
      raw: ndr_events.payload,
    })
    .from(ndr_events)
    .where(resolvedOrderId ? eq(ndr_events.order_id, resolvedOrderId) : sql`false`)

  const tracking = resolvedAwb
    ? await db
        .select({
          type: sql<string>`'tracking'`,
          at: tracking_events.created_at,
          status: tracking_events.status_code,
          remarks: tracking_events.status_text,
          reason: sql<string>`null`,
          attempt_no: sql<string>`null`,
          raw: tracking_events.raw,
        })
        .from(tracking_events)
        .where(eq(tracking_events.awb_number, resolvedAwb))
    : []

  const combined = [...ndr, ...tracking].sort(
    (a, b) => new Date(a.at as any).getTime() - new Date(b.at as any).getTime(),
  )

  return { orderId: resolvedOrderId, awb: resolvedAwb, events: combined }
}
