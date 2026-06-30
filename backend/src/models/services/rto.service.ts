import { eq, sql } from 'drizzle-orm'
import { db } from '../client'
import { rto_events } from '../schema/rto'
import { b2c_orders } from '../schema/b2cOrders'
import { sendWebhookEvent } from '../../services/webhookDelivery.service'
import { buildCsv } from '../../utils/csv'

type RtoListFilters = {
  userId?: string
  orderId?: string
  search?: string
  fromDate?: string
  toDate?: string
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

const buildRtoWhereSql = (filters: RtoListFilters) => {
  const { userId, orderId, search = '', fromDate, toDate } = filters
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

  return clauses.length ? sql`WHERE ${sql.join(clauses, sql` AND `)}` : sql``
}

const buildDedupedRtoCte = (whereSql: any) => sql`
  WITH deduped_rto_events AS (
    SELECT
      e.id,
      e.awb_number,
      e.order_id,
      e.user_id,
      e.status,
      e.reason,
      e.remarks,
      e.rto_charges,
      e.payload,
      e.created_at,
      e.updated_at,
      o.courier_partner,
      row_number() OVER (
        PARTITION BY
          e.order_id,
          coalesce(lower(btrim(e.status)), ''),
          coalesce(lower(btrim(e.reason)), ''),
          coalesce(lower(btrim(e.remarks)), ''),
          coalesce(e.rto_charges::text, '')
        ORDER BY e.created_at DESC, e.id DESC
      ) AS row_rank
    FROM rto_events e
    LEFT JOIN b2c_orders o ON o.id = e.order_id
    ${whereSql}
  )
`

async function listDedupedRtoEvents(filters: RtoListFilters, page: number, limit: number) {
  const offset = (page - 1) * limit
  const whereSql = buildRtoWhereSql(filters)
  const dedupedCte = buildDedupedRtoCte(whereSql)

  const rowsResult = await db.execute(sql`
    ${dedupedCte}
    SELECT
      id,
      awb_number,
      order_id,
      user_id,
      status,
      reason,
      remarks,
      rto_charges,
      payload,
      created_at,
      updated_at,
      courier_partner
    FROM deduped_rto_events
    WHERE row_rank = 1
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `)

  const countResult = await db.execute(sql`
    ${dedupedCte}
    SELECT count(*)::int AS total_count
    FROM deduped_rto_events
    WHERE row_rank = 1
  `)

  return {
    rows: getQueryRows(rowsResult),
    totalCount: Number(getQueryRows<{ total_count: number }>(countResult)[0]?.total_count || 0),
  }
}

export async function recordRtoEvent(params: {
  orderId: string
  userId: string
  awbNumber?: string | null
  status: string
  reason?: string | null
  remarks?: string | null
  rtoCharges?: number | null
  payload?: any
}) {
  const { orderId, userId, awbNumber, status, reason, remarks, rtoCharges, payload } = params

  const [inserted] = await db
    .insert(rto_events)
    .values({
      order_id: orderId,
      user_id: userId,
      awb_number: awbNumber || null,
      status,
      reason: reason || null,
      remarks: remarks || null,
      rto_charges: rtoCharges || null,
      payload: payload || null,
    })
    .returning()

  sendWebhookEvent(userId, 'order.rto', {
    order_id: orderId,
    awb_number: awbNumber,
    status,
    reason,
    remarks,
    rto_charges: rtoCharges,
    created_at: inserted.created_at?.toISOString() || new Date().toISOString(),
  }).catch((err) => {
    console.error('Failed to send RTO webhook event:', err)
  })

  return inserted
}

export async function listRtoEvents(
  userId: string,
  orderId?: string,
  params?: { page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string },
) {
  const { page = 1, limit = 20, search = '', fromDate, toDate } = params || {}
  return listDedupedRtoEvents(
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

export async function listRtoEventsAdmin(
  orderId?: string,
  params?: { page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string },
) {
  const { page = 1, limit = 20, search = '', fromDate, toDate } = params || {}
  return listDedupedRtoEvents(
    {
      orderId,
      search,
      fromDate,
      toDate,
    },
    page,
    limit,
  )
}

export async function adminRtoKpis(params?: {
  search?: string
  fromDate?: string
  toDate?: string
}) {
  const whereSql = buildRtoWhereSql(params || {})
  const dedupedCte = buildDedupedRtoCte(whereSql)

  const totalsResult = await db.execute(sql`
    ${dedupedCte}
    SELECT
      count(*)::int AS total,
      coalesce(sum(rto_charges), 0)::numeric AS total_charges
    FROM deduped_rto_events
    WHERE row_rank = 1
  `)
  const byStatusResult = await db.execute(sql`
    ${dedupedCte}
    SELECT status, count(*)::int AS count
    FROM deduped_rto_events
    WHERE row_rank = 1
    GROUP BY status
    ORDER BY count DESC, status ASC
  `)
  const byCourierResult = await db.execute(sql`
    ${dedupedCte}
    SELECT coalesce(courier_partner, 'Unknown') AS courier, count(*)::int AS count
    FROM deduped_rto_events
    WHERE row_rank = 1
    GROUP BY coalesce(courier_partner, 'Unknown')
    ORDER BY count DESC, courier ASC
  `)

  const totals = getQueryRows<{ total: number; total_charges: number }>(totalsResult)[0]
  const byStatus = getQueryRows<{ status: string; count: number }>(byStatusResult)
  const byCourier = getQueryRows<{ courier: string; count: number }>(byCourierResult)

  return {
    total: Number(totals?.total || 0),
    totalCharges: Number(totals?.total_charges || 0),
    byStatus: byStatus.map((row) => ({ status: row.status, count: Number(row.count || 0) })),
    byCourier: byCourier.map((row) => ({
      courier: row.courier || 'Unknown',
      count: Number(row.count || 0),
    })),
  }
}

export async function adminRtoExport(params?: {
  search?: string
  fromDate?: string
  toDate?: string
}) {
  const rows = (await listDedupedRtoEvents(
    {
      search: params?.search || '',
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    },
    1,
    100000,
  )) as { rows: any[]; totalCount: number }

  const headers = [
    'Created At',
    'AWB',
    'Order ID',
    'Status',
    'Reason',
    'Remarks',
    'RTO Charges',
    'Courier',
  ]
  const rowsData = rows.rows.map((r) => [
    r.created_at ? new Date(r.created_at).toISOString() : '',
    r.awb_number || '',
    r.order_id || '',
    r.status || '',
    r.reason || '',
    r.remarks || '',
    r.rto_charges != null ? Number(r.rto_charges) : '',
    r.courier_partner || '',
  ])

  return buildCsv(headers, rowsData)
}
