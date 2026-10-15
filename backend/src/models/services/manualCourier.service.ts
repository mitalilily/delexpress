import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '../client'
import { createWalletTransaction } from './wallet.service'
import { walletOfUser } from './walletTopupService'

const stableId = (name: string) => {
  let hash = 2166136261
  for (const char of `manual:${name.trim().toLowerCase()}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return (hash >>> 0) % 900000000 + 100000000
}
const list = (value: unknown) => Array.from(new Set((Array.isArray(value) ? value : String(value || '').split(/[,\n]/)).map((v) => String(v).trim()).filter(Boolean)))
const types = (value: unknown) => list(value).map((v) => v.toLowerCase()).filter((v) => v === 'b2b' || v === 'b2c')

export async function listManualCouriers(search = '', includeInactive = true) {
  const conditions = []
  if (!includeInactive) conditions.push(sql`is_active = true`)
  if (search.trim()) conditions.push(sql`name ILIKE ${`%${search.trim()}%`}`)
  const where = conditions.length ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``
  const result = await db.execute(sql`SELECT * FROM manual_couriers ${where} ORDER BY name`)
  return result.rows
}

export async function createManualCourier(input: any) {
  const name = String(input.name || '').trim()
  const serviceTypes = types(input.serviceTypes || input.service_types)
  const pincodes = list(input.pincodes).filter((p) => /^\d{6}$/.test(p))
  const maxWeight = input.maxWeightKg === '' || input.maxWeightKg == null ? null : Number(input.maxWeightKg)
  if (!name) throw new Error('Courier name is required')
  if (!serviceTypes.length) throw new Error('Select B2C or B2B')
  if (!pincodes.length) throw new Error('At least one valid 6-digit pincode is required')
  if (maxWeight != null && (!Number.isFinite(maxWeight) || maxWeight <= 0)) throw new Error('Maximum weight must be positive')
  const courierId = stableId(name)
  return db.transaction(async (tx) => {
    const row = await tx.execute(sql`INSERT INTO manual_couriers (courier_id,name,service_types,pincodes,max_weight_kg,is_active) VALUES (${courierId},${name},${JSON.stringify(serviceTypes)}::jsonb,${pincodes},${maxWeight},true) RETURNING *`)
    await tx.execute(sql`INSERT INTO couriers (id,name,"serviceProvider","isEnabled",business_type) VALUES (${courierId},${name},'manual',true,${JSON.stringify(serviceTypes)}::jsonb) ON CONFLICT (id,"serviceProvider") DO UPDATE SET name=EXCLUDED.name,"isEnabled"=true,business_type=EXCLUDED.business_type,updated_at=now()`)
    return row.rows[0]
  })
}

export async function updateManualCourier(id: string, input: any) {
  const current = await db.execute(sql`SELECT * FROM manual_couriers WHERE id=${id} LIMIT 1`)
  if (!current.rows[0]) throw new Error('Manual courier not found')
  const name = String(input.name ?? current.rows[0].name).trim()
  const serviceTypes = types(input.serviceTypes ?? current.rows[0].service_types)
  const pincodes = list(input.pincodes ?? current.rows[0].pincodes).filter((p) => /^\d{6}$/.test(p))
  const maxWeight = input.maxWeightKg === '' ? null : input.maxWeightKg == null ? current.rows[0].max_weight_kg : Number(input.maxWeightKg)
  if (!name || !serviceTypes.length || !pincodes.length) throw new Error('Name, service type and at least one valid pincode are required')
  const result = await db.execute(sql`UPDATE manual_couriers SET name=${name},service_types=${JSON.stringify(serviceTypes)}::jsonb,pincodes=${pincodes},max_weight_kg=${maxWeight},is_active=${input.isActive == null ? current.rows[0].is_active : Boolean(input.isActive)},updated_at=now() WHERE id=${id} RETURNING *`)
  await db.execute(sql`UPDATE couriers SET name=${name},"isEnabled"=${input.isActive == null ? current.rows[0].is_active : Boolean(input.isActive)},business_type=${JSON.stringify(serviceTypes)}::jsonb,updated_at=now() WHERE id=${current.rows[0].courier_id} AND "serviceProvider"='manual'`)
  return result.rows[0]
}

export async function deleteManualCourier(id: string) {
  const result = await db.execute(sql`UPDATE manual_couriers SET is_active=false,updated_at=now() WHERE id=${id} RETURNING *`)
  if (!result.rows[0]) throw new Error('Manual courier not found')
  await db.execute(sql`UPDATE couriers SET "isEnabled"=false,updated_at=now() WHERE id=${result.rows[0].courier_id} AND "serviceProvider"='manual'`)
  return result.rows[0]
}

export async function listManualShipments(params: any = {}) {
  const search = String(params.search || '').trim()
  const result = await db.execute(sql`
    SELECT 'b2c' AS order_type, o.id, o.order_number, o.order_id, o.awb_number, o.manual_awb_number,
      o.order_status, o.buyer_name, o.pincode, o.weight, o.freight_charges, o.courier_partner,
      o.manual_courier_id, o.created_at, mc.name AS manual_courier_name
    FROM b2c_orders o LEFT JOIN manual_couriers mc ON mc.id=o.manual_courier_id
    WHERE o.manual_courier_id IS NOT NULL ${search ? sql`AND (o.order_number ILIKE ${`%${search}%`} OR o.order_id ILIKE ${`%${search}%`} OR o.awb_number ILIKE ${`%${search}%`} OR o.manual_awb_number ILIKE ${`%${search}%`} OR o.buyer_name ILIKE ${`%${search}%`})` : sql``}
    UNION ALL
    SELECT 'b2b' AS order_type, o.id, o.order_number, o.order_id, o.awb_number, o.manual_awb_number,
      o.order_status, o.buyer_name, o.pincode, o.weight, o.freight_charges, o.courier_partner,
      o.manual_courier_id, o.created_at, mc.name AS manual_courier_name
    FROM b2b_orders o LEFT JOIN manual_couriers mc ON mc.id=o.manual_courier_id
    WHERE o.manual_courier_id IS NOT NULL ${search ? sql`AND (o.order_number ILIKE ${`%${search}%`} OR o.order_id ILIKE ${`%${search}%`} OR o.awb_number ILIKE ${`%${search}%`} OR o.manual_awb_number ILIKE ${`%${search}%`} OR o.buyer_name ILIKE ${`%${search}%`})` : sql``}
    ORDER BY created_at DESC LIMIT ${Math.min(Number(params.limit) || 100, 500)} OFFSET ${Math.max(Number(params.offset) || 0, 0)}
  `)
  return result.rows
}

export async function updateManualShipment(id: string, input: any, adminId?: string) {
  const orderType = String(input.orderType || '').toLowerCase() === 'b2b' ? 'b2b' : 'b2c'
  const table = orderType === 'b2b' ? 'b2b_orders' : 'b2c_orders'
  const status = String(input.status || '').trim().toLowerCase()
  const remarks = String(input.remarks || '').trim() || null
  if (!status) throw new Error('Status is required')
  const result = await db.execute(sql`UPDATE ${sql.raw(table)} SET order_status=${status},updated_at=now() WHERE id=${id} AND manual_courier_id IS NOT NULL RETURNING *`)
  if (!result.rows[0]) throw new Error('Manual shipment not found')
  await db.execute(sql`INSERT INTO manual_courier_status_events (order_id,order_type,manual_courier_id,awb_number,status,remarks,created_by) VALUES (${id},${orderType},${result.rows[0].manual_courier_id},${result.rows[0].manual_awb_number || result.rows[0].awb_number || null},${status},${remarks},${adminId || null})`)
  return result.rows[0]
}

export async function replaceManualAwb(id: string, input: any, adminId?: string) {
  const orderType = String(input.orderType || '').toLowerCase() === 'b2b' ? 'b2b' : 'b2c'
  const table = orderType === 'b2b' ? 'b2b_orders' : 'b2c_orders'
  const awb = String(input.awbNumber || '').trim()
  if (!awb) throw new Error('Manual AWB is required')
  const result = await db.execute(sql`UPDATE ${sql.raw(table)} SET manual_awb_number=${awb},awb_number=${awb},order_status=COALESCE(NULLIF(order_status,'pending'),'manual_booked'),updated_at=now() WHERE id=${id} AND manual_courier_id IS NOT NULL RETURNING *`)
  if (!result.rows[0]) throw new Error('Manual shipment not found')
  await db.execute(sql`INSERT INTO manual_courier_status_events (order_id,order_type,manual_courier_id,awb_number,status,remarks,created_by) VALUES (${id},${orderType},${result.rows[0].manual_courier_id},${awb},'booked',${String(input.remarks || '').trim() || null},${adminId || null})`)
  const wallet = await walletOfUser(String(result.rows[0].user_id))
  const amount = Number(result.rows[0].freight_charges || 0)
  if (amount > 0) {
    const existing = await db.execute(sql`SELECT id FROM wallet_transactions WHERE wallet_id=${wallet.id} AND type='debit' AND ref=${`manual_courier:${id}`} LIMIT 1`)
    if (!existing.rows[0]) await createWalletTransaction({ walletId: wallet.id, amount, type: 'debit', ref: `manual_courier:${id}`, reason: 'Manual courier shipment', meta: { orderId: id, awb, courierType: 'manual' } })
  }
  return result.rows[0]
}

