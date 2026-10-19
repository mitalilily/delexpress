import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '../client'
import { createWalletTransaction } from './wallet.service'
import { walletOfUser } from './walletTopupService'
import Papa from 'papaparse'

const stableId = (name: string) => {
  let hash = 2166136261
  for (const char of `manual:${name.trim().toLowerCase()}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return (hash >>> 0) % 900000000 + 100000000
}
const list = (value: unknown) => {
  let source: unknown = value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      source = Array.isArray(parsed) ? parsed : value
    } catch {
      source = value
    }
  }
  return Array.from(new Set((Array.isArray(source) ? source : String(source || '').split(/[,\n]/)).map((v) => String(v).trim()).filter(Boolean)))
}
const types = (value: unknown) => list(value).map((v) => v.toLowerCase()).filter((v) => v === 'b2b' || v === 'b2c')
const pgTextArray = (values: string[]) => sql`ARRAY[${sql.join(values.map((value) => sql`${value}`), sql`, `)}]::text[]`

export async function allocateManualAwb(
  tx: any,
  manualCourierId: string,
  courierId: number | string,
) {
  const result = await tx.execute(sql`
    INSERT INTO manual_courier_awb_sequences (manual_courier_id, next_value)
    VALUES (${manualCourierId}, 2)
    ON CONFLICT (manual_courier_id)
    DO UPDATE SET next_value = manual_courier_awb_sequences.next_value + 1
    RETURNING next_value - 1 AS allocated_value
  `)
  const sequence = Number(result.rows[0]?.allocated_value)
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new Error('Unable to allocate a manual courier AWB')
  }
  return `MNL-${String(courierId).trim()}-${String(sequence).padStart(8, '0')}`
}

export async function listManualCouriers(search = '', includeInactive = true) {
  const conditions = []
  if (!includeInactive) conditions.push(sql`is_active = true`)
  if (search.trim()) conditions.push(sql`name ILIKE ${`%${search.trim()}%`}`)
  const where = conditions.length ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``
  const result = await db.execute(sql`SELECT * FROM manual_couriers ${where} ORDER BY name`)
  return result.rows
}

export async function getServiceableManualCouriers(serviceType: 'b2c' | 'b2b', origin: string, destination: string, weightKg?: number) {
  const weight = Number(weightKg ?? 0)
  const result = await db.execute(sql`
    SELECT * FROM manual_couriers
    WHERE is_active = true
      AND service_types @> ${JSON.stringify([serviceType])}::jsonb
      AND pincodes @> ARRAY[${String(origin).trim()}, ${String(destination).trim()}]::text[]
      AND (max_weight_kg IS NULL OR max_weight_kg >= ${weight})
    ORDER BY name
  `)
  return result.rows
}

export async function createManualCourier(input: any) {
  const name = String(input.name || '').trim()
  const serviceTypes = types(input.serviceTypes || input.service_types)
  const csvPincodes = input.pincodesCsv ? parsePincodeCsv(input.pincodesCsv) : []
  const pincodes = Array.from(new Set([...list(input.pincodes), ...csvPincodes])).filter((p) => /^\d{6}$/.test(p))
  const maxWeight = input.maxWeightKg === '' || input.maxWeightKg == null ? null : Number(input.maxWeightKg)
  if (!name) throw new Error('Courier name is required')
  if (!serviceTypes.length) throw new Error('Select B2C or B2B')
  if (!pincodes.length) throw new Error('At least one valid 6-digit pincode is required')
  if (maxWeight != null && (!Number.isFinite(maxWeight) || maxWeight <= 0)) throw new Error('Maximum weight must be positive')
  const courierId = stableId(name)
  return db.transaction(async (tx) => {
    const row = await tx.execute(sql`INSERT INTO manual_couriers (courier_id,name,service_types,pincodes,max_weight_kg,is_active) VALUES (${courierId},${name},${JSON.stringify(serviceTypes)}::jsonb,${pgTextArray(pincodes)},${maxWeight},true) RETURNING *`)
    await tx.execute(sql`INSERT INTO couriers (id,name,"serviceProvider","isEnabled",business_type) VALUES (${courierId},${name},'manual',true,${JSON.stringify(serviceTypes)}::jsonb) ON CONFLICT (id,"serviceProvider") DO UPDATE SET name=EXCLUDED.name,"isEnabled"=true,business_type=EXCLUDED.business_type,updated_at=now()`)
    return row.rows[0]
  })
}

function parsePincodeCsv(buffer: Buffer | string) {
  const parsed = Papa.parse<Record<string, unknown>>(buffer.toString(), { header: true, skipEmptyLines: true })
  const values: string[] = []
  for (const row of parsed.data || []) {
    const key = Object.keys(row).find((name) => /pin(code)?|zip/i.test(name))
    const value = key ? row[key] : Object.values(row)[0]
    if (value != null) values.push(...String(value).split(/[,\s]+/))
  }
  return values.map((value) => value.trim()).filter((value) => /^\d{6}$/.test(value))
}

export async function importManualCourierPincodes(id: string, buffer: Buffer) {
  const current = await db.execute(sql`SELECT pincodes FROM manual_couriers WHERE id=${id} LIMIT 1`)
  if (!current.rows[0]) throw new Error('Manual courier not found')
  const incoming = parsePincodeCsv(buffer)
  if (!incoming.length) throw new Error('CSV must contain at least one valid 6-digit pincode')
  const merged = Array.from(new Set([...list(current.rows[0].pincodes), ...incoming]))
  const result = await db.execute(sql`UPDATE manual_couriers SET pincodes=${pgTextArray(merged)},updated_at=now() WHERE id=${id} RETURNING *`)
  return { courier: result.rows[0], added: incoming.length, total: merged.length }
}

export async function updateManualCourier(id: string, input: any) {
  const current = await db.execute(sql`SELECT * FROM manual_couriers WHERE id=${id} LIMIT 1`)
  if (!current.rows[0]) throw new Error('Manual courier not found')
  const name = String(input.name ?? current.rows[0].name).trim()
  const serviceTypes = types(input.serviceTypes ?? current.rows[0].service_types)
  const pincodes = list(input.pincodes ?? current.rows[0].pincodes).filter((p) => /^\d{6}$/.test(p))
  const maxWeight = input.maxWeightKg === '' ? null : input.maxWeightKg == null ? current.rows[0].max_weight_kg : Number(input.maxWeightKg)
  if (!name || !serviceTypes.length || !pincodes.length) throw new Error('Name, service type and at least one valid pincode are required')
  const result = await db.execute(sql`UPDATE manual_couriers SET name=${name},service_types=${JSON.stringify(serviceTypes)}::jsonb,pincodes=${pgTextArray(pincodes)},max_weight_kg=${maxWeight},is_active=${input.isActive == null ? current.rows[0].is_active : Boolean(input.isActive)},updated_at=now() WHERE id=${id} RETURNING *`)
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
      o.order_status, o.buyer_name, o.buyer_phone, o.buyer_email, o.address, o.city, o.state, o.country,
      o.pincode, o.weight, o.length, o.breadth, o.height, o.order_amount, o.order_type AS payment_type,
      o.freight_charges, o.shipping_charges, o.other_charges, o.cod_charges, o.invoice_number, o.invoice_date,
      o.invoice_amount, o.products, o.pickup_details, o.pickup_location_id, o.courier_partner, o.integration_type,
      o.manual_courier_id, o.user_id, o.created_at, mc.name AS manual_courier_name
    FROM b2c_orders o LEFT JOIN manual_couriers mc ON mc.id=o.manual_courier_id
    WHERE o.manual_courier_id IS NOT NULL ${search ? sql`AND (o.order_number ILIKE ${`%${search}%`} OR o.order_id ILIKE ${`%${search}%`} OR o.awb_number ILIKE ${`%${search}%`} OR o.manual_awb_number ILIKE ${`%${search}%`} OR o.buyer_name ILIKE ${`%${search}%`})` : sql``}
    UNION ALL
    SELECT 'b2b' AS order_type, o.id, o.order_number, o.order_id, o.awb_number, o.manual_awb_number,
      o.order_status, o.buyer_name, o.buyer_phone, o.buyer_email, o.address, o.city, o.state, o.country,
      o.pincode, o.weight, o.length, o.breadth, o.height, o.order_amount, o.order_type AS payment_type,
      o.freight_charges, o.shipping_charges, NULL::numeric AS other_charges, o.cod_charges, o.invoice_number, o.invoice_date,
      o.invoice_amount, o.products, o.pickup_details, o.pickup_location_id, o.courier_partner, 'manual' AS integration_type,
      o.manual_courier_id, o.user_id, o.created_at, mc.name AS manual_courier_name
    FROM b2b_orders o LEFT JOIN manual_couriers mc ON mc.id=o.manual_courier_id
    WHERE o.manual_courier_id IS NOT NULL ${search ? sql`AND (o.order_number ILIKE ${`%${search}%`} OR o.order_id ILIKE ${`%${search}%`} OR o.awb_number ILIKE ${`%${search}%`} OR o.manual_awb_number ILIKE ${`%${search}%`} OR o.buyer_name ILIKE ${`%${search}%`})` : sql``}
    ORDER BY created_at DESC LIMIT ${Math.min(Number(params.limit) || 100, 500)} OFFSET ${Math.max(Number(params.offset) || 0, 0)}
  `)
  return result.rows
}

export async function updateManualShipment(id: string, input: any, adminId?: string) {
  const orderType = String(input.orderType || '').toLowerCase() === 'b2b' ? 'b2b' : 'b2c'
  const table = orderType === 'b2b' ? 'b2b_orders' : 'b2c_orders'
  const allowedStatuses = new Set([
    'manual_booked',
    'pickup_initiated',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'ndr',
    'rto',
    'rto_delivered',
    'cancelled',
  ])
  const status = String(input.status || '').trim().toLowerCase().replace(/[ -]+/g, '_')
  const remarks = String(input.remarks || '').trim() || null
  if (!status) throw new Error('Status is required')
  if (!allowedStatuses.has(status)) throw new Error('Unsupported shipment status')
  const result = await db.execute(sql`UPDATE ${sql.raw(table)} SET order_status=${status},updated_at=now() WHERE id=${id} AND manual_courier_id IS NOT NULL RETURNING *`)
  if (!result.rows[0]) throw new Error('Manual shipment not found')
  await db.execute(sql`INSERT INTO manual_courier_status_events (order_id,order_type,manual_courier_id,awb_number,status,remarks,created_by) VALUES (${id},${orderType},${result.rows[0].manual_courier_id},${result.rows[0].manual_awb_number || result.rows[0].awb_number || null},${status},${remarks},${adminId || null})`)
  if (orderType === 'b2c' && result.rows[0].user_id) {
    await db.execute(sql`INSERT INTO tracking_events (order_id,user_id,awb_number,courier,status_code,status_text,location,raw,created_at) VALUES (${id},${result.rows[0].user_id},${result.rows[0].awb_number || result.rows[0].manual_awb_number || null},'manual',${status},${remarks || status},${input.location ? String(input.location).trim() : null},${JSON.stringify({ source: 'manual_admin', status, remarks, created_by: adminId || null })}::jsonb,now())`)
  }
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
    const existing = await db.execute(sql`SELECT id FROM wallet_transactions WHERE wallet_id=${wallet.id} AND type='debit' AND (ref=${`manual_courier:${id}`} OR ref=${id}) LIMIT 1`)
    if (!existing.rows[0]) await createWalletTransaction({ walletId: wallet.id, amount, type: 'debit', ref: `manual_courier:${id}`, reason: 'Manual courier shipment', meta: { orderId: id, awb, courierType: 'manual' } })
  }
  return result.rows[0]
}

const parseJson = (value: unknown) => {
  if (!value) return null
  if (typeof value === 'object') return value
  try { return JSON.parse(String(value)) } catch { return null }
}

const normalizeOrderItems = (value: unknown) => {
  const parsed = parseJson(value)
  if (!Array.isArray(parsed)) return []
  return parsed.map((item: any) => ({
    name: item.name || item.box_name || item.title || 'Item',
    sku: item.sku || item.itemSku || 'NA',
    qty: Number(item.qty ?? item.quantity ?? 1) || 1,
    quantity: Number(item.quantity ?? item.qty ?? 1) || 1,
    price: Number(item.price ?? item.sellingPrice ?? item.unit_price ?? 0) || 0,
    hsn: item.hsn || item.hsnCode || '',
    discount: Number(item.discount || 0) || 0,
    tax_rate: Number(item.tax_rate ?? item.taxRate ?? 0) || 0,
  }))
}

const getManualOrder = async (id: string, orderType: string) => {
  const table = orderType === 'b2b' ? 'b2b_orders' : 'b2c_orders'
  const result = await db.execute(sql`SELECT * FROM ${sql.raw(table)} WHERE id=${id} AND manual_courier_id IS NOT NULL LIMIT 1`)
  return result.rows[0] || null
}

const pickupFromOrder = (order: any) => {
  const parsed = parseJson(order.pickup_details) || parseJson(order.pickup) || {}
  return {
    ...parsed,
    warehouse_name: parsed.warehouse_name || parsed.name || order.pickup_location_id || 'Pickup warehouse',
    address: parsed.address || parsed.address_line1 || '',
    city: parsed.city || '',
    state: parsed.state || '',
    pincode: parsed.pincode || parsed.pin_code || parsed.pickup_pincode || '',
    phone: parsed.phone || parsed.contact || parsed.phone_number || '',
  }
}

export async function getManualShipmentProviderOptions(id: string, orderTypeInput: string) {
  const orderType = String(orderTypeInput || '').toLowerCase() === 'b2b' ? 'b2b' : 'b2c'
  const order = await getManualOrder(id, orderType)
  if (!order) throw new Error('Manual shipment not found')
  if (orderType === 'b2b') {
    throw new Error('Integrated provider booking is currently available for B2C manual shipments only')
  }
  const { fetchAvailableCouriersWithRatesAdmin } = await import('./shiprocket.service')
  let planId: string | undefined
  const plan = await db.execute(sql`SELECT plan_id FROM user_plans WHERE user_id=${order.user_id} LIMIT 1`)
  planId = plan.rows[0]?.plan_id ? String(plan.rows[0].plan_id) : undefined
  return fetchAvailableCouriersWithRatesAdmin({
    origin: pickupFromOrder(order).pincode,
    destination: order.pincode,
    payment_type: String(order.order_type || 'prepaid').toLowerCase(),
    order_amount: Number(order.order_amount || 0),
    weight: Number(order.weight || 0) * 1000,
    length: Number(order.length || 0),
    breadth: Number(order.breadth || 0),
    height: Number(order.height || 0),
    shipment_type: 'b2c',
    isCalculator: false,
  } as any, planId)
}

export async function bookManualShipmentWithProvider(id: string, input: any, adminId?: string) {
  const orderType = String(input.orderType || '').toLowerCase() === 'b2b' ? 'b2b' : 'b2c'
  const order = await getManualOrder(id, orderType)
  if (!order) throw new Error('Manual shipment not found')
  if (orderType === 'b2b') throw new Error('Integrated provider booking is currently available for B2C manual shipments only')
  const currentIntegrationType = String(order.integration_type || 'manual').trim().toLowerCase()
  if (currentIntegrationType !== 'manual') throw new Error('This shipment is already mapped to an integrated provider')
  const provider = String(input.integrationType || input.integration_type || '').trim().toLowerCase()
  const courierId = Number(input.courierId ?? input.courier_id)
  if (!provider) throw new Error('Integrated provider is required')
  if (!Number.isInteger(courierId) || courierId <= 0) throw new Error('A valid integrated courier is required')

  const { createB2CShipmentService } = await import('./shiprocket.service')
  const pickup = pickupFromOrder(order)
  const payload: any = {
    order_number: order.order_number,
    source_order_id: order.id,
    order_amount: Number(order.order_amount || 0),
    payment_type: String(order.order_type || 'prepaid').toLowerCase(),
    consignee: {
      name: order.buyer_name,
      phone: order.buyer_phone,
      email: order.buyer_email || undefined,
      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      country: order.country || 'India',
    },
    pickup,
    pickup_location_id: order.pickup_location_id || pickup.warehouse_name,
    order_items: normalizeOrderItems(order.products),
    package_weight: Number(order.weight || 0),
    package_length: Number(order.length || 0),
    package_breadth: Number(order.breadth || 0),
    package_height: Number(order.height || 0),
    shipping_charges: Number(order.shipping_charges || 0),
    other_charges: Number(order.other_charges || 0),
    freight_charges: Number(order.freight_charges || 0),
    cod_charges: Number(order.cod_charges || 0),
    invoice_number: order.invoice_number || undefined,
    invoice_date: order.invoice_date || undefined,
    invoice_amount: order.invoice_amount || order.order_amount || 0,
    courier_id: courierId,
    integration_type: provider,
    courier_partner: input.courierName || undefined,
    selected_max_slab_weight: input.selectedMaxSlabWeight || undefined,
  }

  const inFlight = await db.execute(sql`
    SELECT id
    FROM manual_courier_provider_bookings
    WHERE order_id=${id} AND order_type=${orderType} AND status='processing'
    LIMIT 1
  `)
  if (inFlight.rows[0]) throw new Error('A provider booking is already in progress for this shipment')

  await db.execute(sql`INSERT INTO manual_courier_provider_bookings (order_id,order_type,manual_courier_id,provider,courier_id,previous_awb,status,created_by) VALUES (${id},${orderType},${order.manual_courier_id},${provider},${courierId},${order.awb_number || order.manual_awb_number || null},'processing',${adminId || null})`)
  try {
    const result = await createB2CShipmentService(payload, String(order.user_id), false, {
      allowManualRebook: true,
      skipWalletDebit: true,
      preserveManualCourierId: String(order.manual_courier_id),
      preserveManualAwb: String(order.manual_awb_number || order.awb_number || ''),
    })
    const booked = result?.order || result?.shipment?.order || result?.shipment || {}
    const providerAwb = booked.awb_number || result?.shipment?.awb_number || result?.shipment?.awbNumber || null
    if (!providerAwb) throw new Error('Integrated provider did not return an AWB')
    await db.execute(sql`UPDATE manual_courier_provider_bookings SET provider_awb=${providerAwb},provider_reference=${booked.shipment_id || result?.shipment?.shipment_id || null},status='succeeded',response=${JSON.stringify({ shipment: result?.shipment || null })}::jsonb,updated_at=now() WHERE order_id=${id} AND order_type=${orderType} AND status='processing'`)
    await db.execute(sql`INSERT INTO manual_courier_status_events (order_id,order_type,manual_courier_id,awb_number,status,remarks,created_by) VALUES (${id},${orderType},${order.manual_courier_id},${providerAwb},'provider_booked',${`Booked with ${input.courierName || provider}`},${adminId || null})`)
    return { order: booked, shipment: result?.shipment || result, providerAwb }
  } catch (error: any) {
    await db.execute(sql`UPDATE manual_courier_provider_bookings SET status='failed',error_message=${String(error?.message || error).slice(0, 1000)},response=${JSON.stringify(error?.response?.data || null)}::jsonb,updated_at=now() WHERE order_id=${id} AND order_type=${orderType} AND status='processing'`)
    throw error
  }
}

