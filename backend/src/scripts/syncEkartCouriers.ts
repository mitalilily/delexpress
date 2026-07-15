import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import forwardRates from './forwardRateCardData.json'
import { db } from '../models/client'
import { couriers, plans, shippingRates, zones } from '../schema/schema'

type ForwardRateRow = {
  id: number
  courier_name: string
  mode: string
  min_weight: number
  type: string
  zone_a_forward?: number | null
  zone_a_rto?: number | null
  zone_b_forward?: number | null
  zone_b_rto?: number | null
  zone_c_forward?: number | null
  zone_c_rto?: number | null
  zone_d_forward?: number | null
  zone_d_rto?: number | null
  zone_e_forward?: number | null
  zone_e_rto?: number | null
  cod_charges?: number | null
  cod_percent?: number | null
  other_charges?: number | null
}

type RateSlot = 'zone_a' | 'zone_b' | 'zone_c' | 'zone_d' | 'zone_e'

const EKART_PROVIDER = 'ekart'
const RATE_SLOTS: RateSlot[] = ['zone_a', 'zone_b', 'zone_c', 'zone_d', 'zone_e']

const SEMANTIC_ZONE_SLOT_MAP: Record<string, RateSlot> = {
  WITHIN_CITY: 'zone_a',
  WITHIN_STATE: 'zone_b',
  WITHIN_REGION: 'zone_c',
  METRO_TO_METRO: 'zone_d',
  ROI: 'zone_e',
  SPECIAL_ZONE: 'zone_e',
}

const normalize = (value?: string | null) => String(value || '').trim().toUpperCase()

const getRateValue = (row: ForwardRateRow, slot: RateSlot, type: 'forward' | 'rto') => {
  const field = `${slot}_${type}` as keyof ForwardRateRow
  const value = row[field]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const resolveRateSlot = (zoneCode: string, index: number) => {
  const normalized = normalize(zoneCode)
  return SEMANTIC_ZONE_SLOT_MAP[normalized] || RATE_SLOTS[Math.min(index, RATE_SLOTS.length - 1)]
}

const loadPlans = async () => {
  const rows = await db.select({ id: plans.id, name: plans.name }).from(plans)
  if (!rows.length) {
    throw new Error('No plans found. Create at least one plan before syncing Ekart couriers.')
  }
  return rows
}

const loadB2CZones = async () => {
  const rows = await db
    .select({ id: zones.id, code: zones.code, businessType: zones.business_type })
    .from(zones)

  return rows
    .filter((row) => normalize(row.businessType) === 'B2C')
    .map((row) => ({ id: row.id, code: normalize(row.code) }))
}

const ensureEkartCourier = async (row: ForwardRateRow) => {
  const [existing] = await db
    .select()
    .from(couriers)
    .where(and(eq(couriers.id, Number(row.id)), eq(couriers.serviceProvider, EKART_PROVIDER)))
    .limit(1)

  const values = {
    name: row.courier_name,
    serviceProvider: EKART_PROVIDER,
    isEnabled: true,
    businessType: ['b2c', 'b2b'],
    updatedAt: new Date(),
  }

  if (existing) {
    await db
      .update(couriers)
      .set(values as any)
      .where(and(eq(couriers.id, Number(row.id)), eq(couriers.serviceProvider, EKART_PROVIDER)))
    return 'updated'
  }

  await db.insert(couriers).values({
    id: Number(row.id),
    ...values,
    createdAt: new Date(),
  } as any)
  return 'inserted'
}

const ensureRateRow = async (params: {
  planId: string
  courierId: number
  courierName: string
  zoneId: string
  type: 'forward' | 'rto'
  rate: number
  mode: string
  minWeight: number
  codCharges?: number | null
  codPercent?: number | null
  otherCharges?: number | null
}) => {
  const [existing] = await db
    .select({ id: shippingRates.id })
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.plan_id, params.planId),
        eq(shippingRates.courier_id, params.courierId),
        eq(shippingRates.service_provider, EKART_PROVIDER),
        eq(shippingRates.business_type, 'b2c'),
        eq(shippingRates.zone_id, params.zoneId),
        eq(shippingRates.type, params.type),
      ),
    )
    .limit(1)

  const payload = {
    plan_id: params.planId,
    courier_id: params.courierId,
    courier_name: params.courierName,
    service_provider: EKART_PROVIDER,
    mode: params.mode || '',
    business_type: 'b2c',
    min_weight: params.minWeight.toString(),
    zone_id: params.zoneId,
    type: params.type,
    rate: params.rate.toString(),
    cod_charges: params.codCharges?.toString() ?? null,
    cod_percent: params.codPercent?.toString() ?? null,
    other_charges: params.otherCharges?.toString() ?? null,
    last_updated: new Date(),
  }

  if (existing) {
    await db.update(shippingRates).set(payload as any).where(eq(shippingRates.id, existing.id))
    return 'updated'
  }

  await db.insert(shippingRates).values({ id: randomUUID(), ...payload } as any)
  return 'inserted'
}

export async function syncEkartCouriers() {
  const ekartRows = (forwardRates as ForwardRateRow[]).filter((row) =>
    normalize(row.courier_name).includes('EKART'),
  )

  if (!ekartRows.length) {
    throw new Error('No Ekart rows found in forwardRateCardData.json')
  }

  const plansToSeed = await loadPlans()
  const zoneRows = await loadB2CZones()

  if (!zoneRows.length) {
    throw new Error('No B2C zones found. Create B2C zones before syncing Ekart couriers.')
  }

  let couriersInserted = 0
  let couriersUpdated = 0
  let ratesInserted = 0
  let ratesUpdated = 0

  for (const row of ekartRows) {
    const courierResult = await ensureEkartCourier(row)
    if (courierResult === 'inserted') couriersInserted += 1
    if (courierResult === 'updated') couriersUpdated += 1

    for (let index = 0; index < zoneRows.length; index += 1) {
      const zoneRow = zoneRows[index]
      const slot = resolveRateSlot(zoneRow.code, index)

      for (const plan of plansToSeed) {
        const forwardRate = getRateValue(row, slot, 'forward')
        const rtoRate = getRateValue(row, slot, 'rto')

        if (forwardRate != null) {
          const result = await ensureRateRow({
            planId: plan.id,
            courierId: Number(row.id),
            courierName: row.courier_name,
            zoneId: zoneRow.id,
            type: 'forward',
            rate: forwardRate,
            mode: row.mode,
            minWeight: Number(row.min_weight || 0),
            codCharges: row.cod_charges ?? null,
            codPercent: row.cod_percent ?? null,
            otherCharges: row.other_charges ?? null,
          })
          if (result === 'inserted') ratesInserted += 1
          if (result === 'updated') ratesUpdated += 1
        }

        if (rtoRate != null) {
          const result = await ensureRateRow({
            planId: plan.id,
            courierId: Number(row.id),
            courierName: row.courier_name,
            zoneId: zoneRow.id,
            type: 'rto',
            rate: rtoRate,
            mode: row.mode,
            minWeight: Number(row.min_weight || 0),
            codCharges: row.cod_charges ?? null,
            codPercent: row.cod_percent ?? null,
            otherCharges: row.other_charges ?? null,
          })
          if (result === 'inserted') ratesInserted += 1
          if (result === 'updated') ratesUpdated += 1
        }
      }
    }
  }

  console.log('[Ekart courier sync] Completed', {
    couriersInserted,
    couriersUpdated,
    ratesInserted,
    ratesUpdated,
    ekartCouriers: ekartRows.length,
    planCount: plansToSeed.length,
    zoneCount: zoneRows.length,
  })
}

if (require.main === module) {
  syncEkartCouriers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[Ekart courier sync] Failed:', error)
      process.exit(1)
    })
}
