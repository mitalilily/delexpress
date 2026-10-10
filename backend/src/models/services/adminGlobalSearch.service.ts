import { and, ilike, or, sql } from 'drizzle-orm'
import { db } from '../client'
import { b2b_orders } from '../schema/b2bOrders'
import { b2c_orders } from '../schema/b2cOrders'
import { invoices } from '../schema/invoices'
import { ndr_events } from '../schema/ndr'
import { rto_events } from '../schema/rto'
import { userProfiles } from '../schema/userProfile'
import { users } from '../schema/users'
import { weight_discrepancies } from '../schema/weightDiscrepancies'

export type AdminSearchResult = {
  type: 'seller' | 'order' | 'invoice' | 'ndr' | 'rto' | 'weight_discrepancy'
  id: string
  title: string
  subtitle?: string
  link: string
  metadata?: Record<string, unknown>
}

const text = (value: unknown) => String(value ?? '').trim()
const sellerName = (companyInfo: any, email?: string | null, phone?: string | null) =>
  text(companyInfo?.businessName) ||
  text(companyInfo?.brandName) ||
  text(companyInfo?.contactPerson) ||
  text(email) ||
  text(phone) ||
  'Seller'

export const adminGlobalSearch = async (query: string, limit = 12): Promise<AdminSearchResult[]> => {
  const searchTerm = `%${query.trim()}%`
  const results: AdminSearchResult[] = []
  const perType = Math.max(3, Math.ceil(limit / 2))

  const sellers = await db
    .select({ id: users.id, email: users.email, phone: users.phone, companyInfo: userProfiles.companyInfo })
    .from(users)
    .leftJoin(userProfiles, sql`${userProfiles.userId} = ${users.id}`)
    .where(
      and(
        sql`${users.role} IN ('customer', 'user')`,
        or(
          ilike(users.email, searchTerm),
          ilike(users.phone, searchTerm),
          sql`COALESCE(${userProfiles.companyInfo}->>'businessName', '') ILIKE ${searchTerm}`,
          sql`COALESCE(${userProfiles.companyInfo}->>'brandName', '') ILIKE ${searchTerm}`,
          sql`COALESCE(${userProfiles.companyInfo}->>'contactPerson', '') ILIKE ${searchTerm}`,
        ),
      ),
    )
    .limit(perType)

  for (const seller of sellers) {
    results.push({
      type: 'seller',
      id: seller.id,
      title: sellerName(seller.companyInfo, seller.email, seller.phone),
      subtitle: [seller.email, seller.phone].filter(Boolean).join(' • '),
      link: `/users-management/${seller.id}`,
      metadata: { email: seller.email, phone: seller.phone },
    })
  }

  const orderFields = (table: any) => or(
    ilike(table.order_number, searchTerm),
    sql`COALESCE(CAST(${table.order_id} AS TEXT), '') ILIKE ${searchTerm}`,
    sql`COALESCE(CAST(${table.awb_number} AS TEXT), '') ILIKE ${searchTerm}`,
    ilike(table.buyer_name, searchTerm),
    ilike(table.buyer_phone, searchTerm),
    ilike(table.buyer_email, searchTerm),
    ilike(table.address, searchTerm),
    ilike(table.city, searchTerm),
    ilike(table.state, searchTerm),
    ilike(table.pincode, searchTerm),
    ilike(table.courier_partner, searchTerm),
    sql`COALESCE(CAST(${table.shipment_id} AS TEXT), '') ILIKE ${searchTerm}`,
    sql`COALESCE(CAST(${table.pickup_details} AS TEXT), '') ILIKE ${searchTerm}`,
  )

  const addOrders = async (table: any, kind: 'b2c' | 'b2b') => {
    const rows = await db
      .select({
        id: table.id,
        orderNumber: table.order_number,
        orderId: table.order_id,
        awb: table.awb_number,
        buyerName: table.buyer_name,
        address: table.address,
        city: table.city,
        state: table.state,
        pincode: table.pincode,
        courier: table.courier_partner,
        shipmentId: table.shipment_id,
        status: table.order_status,
        email: users.email,
        companyInfo: userProfiles.companyInfo,
      })
      .from(table)
      .leftJoin(users, sql`${users.id} = ${table.user_id}`)
      .leftJoin(userProfiles, sql`${userProfiles.userId} = ${table.user_id}`)
      .where(orderFields(table))
      .limit(perType)

    for (const order of rows) {
      results.push({
        type: 'order',
        id: order.id,
        title: order.orderNumber || order.orderId || order.awb || 'Shipment',
        subtitle: [
          sellerName(order.companyInfo, order.email),
          order.awb,
          order.buyerName,
          order.courier,
          order.address,
          order.city,
          order.state,
          order.pincode,
        ].filter(Boolean).join(' • '),
        link: `/orders/list?search=${encodeURIComponent(order.orderNumber || order.awb || '')}`,
        metadata: { awb: order.awb, status: order.status, type: kind, shipmentId: order.shipmentId },
      })
    }
  }

  await addOrders(b2c_orders, 'b2c')
  await addOrders(b2b_orders, 'b2b')

  const invoiceRows = await db.select({ id: invoices.id, number: invoices.invoiceNumber, status: invoices.status })
    .from(invoices).where(ilike(invoices.invoiceNumber, searchTerm)).limit(perType)
  for (const invoice of invoiceRows) {
    results.push({ type: 'invoice', id: String(invoice.id), title: invoice.number, subtitle: `Invoice • ${invoice.status}`, link: `/billing-invoices?search=${encodeURIComponent(invoice.number)}` })
  }

  const ndrRows = await db.select({ id: ndr_events.id, awb: ndr_events.awb_number, status: ndr_events.status, reason: ndr_events.reason })
    .from(ndr_events).where(or(sql`CAST(${ndr_events.awb_number} AS TEXT) ILIKE ${searchTerm}`, sql`CAST(${ndr_events.order_id} AS TEXT) ILIKE ${searchTerm}`, ilike(ndr_events.reason, searchTerm))).limit(perType)
  for (const row of ndrRows) results.push({ type: 'ndr', id: row.id, title: row.awb || 'NDR', subtitle: `NDR • ${row.status} • ${row.reason || ''}`, link: `/ops/ndr?search=${encodeURIComponent(row.awb || '')}` })

  const rtoRows = await db.select({ id: rto_events.id, awb: rto_events.awb_number, status: rto_events.status, reason: rto_events.reason })
    .from(rto_events).where(or(sql`CAST(${rto_events.awb_number} AS TEXT) ILIKE ${searchTerm}`, sql`CAST(${rto_events.order_id} AS TEXT) ILIKE ${searchTerm}`, ilike(rto_events.reason, searchTerm))).limit(perType)
  for (const row of rtoRows) results.push({ type: 'rto', id: row.id, title: row.awb || 'RTO', subtitle: `RTO • ${row.status} • ${row.reason || ''}`, link: `/ops/rto?search=${encodeURIComponent(row.awb || '')}` })

  const weightRows = await db.select({ id: weight_discrepancies.id, orderNumber: weight_discrepancies.order_number, awb: weight_discrepancies.awb_number, status: weight_discrepancies.status })
    .from(weight_discrepancies).where(or(ilike(weight_discrepancies.order_number, searchTerm), sql`CAST(${weight_discrepancies.awb_number} AS TEXT) ILIKE ${searchTerm}`)).limit(perType)
  for (const row of weightRows) results.push({ type: 'weight_discrepancy', id: row.id, title: row.orderNumber, subtitle: `Weight discrepancy • ${row.status} • ${row.awb || ''}`, link: `/reconciliation/weight?search=${encodeURIComponent(row.orderNumber)}` })

  return results.slice(0, limit)
}
