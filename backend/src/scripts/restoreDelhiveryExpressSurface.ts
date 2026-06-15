import { randomUUID } from 'crypto'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../models/client'
import { couriers } from '../models/schema/couriers'
import { plans } from '../models/schema/plans'
import { shippingRates } from '../models/schema/shippingRates'
import { zones } from '../models/schema/zones'

const TARGET_COURIER_ID = 99
const TARGET_COURIER_NAME = 'Delhivery Express Surface'
const TARGET_SERVICE_PROVIDER = 'delhivery'
const TARGET_MODE = 'Surface'
const TARGET_BUSINESS_TYPE = 'b2c'
const DEFAULT_MIN_WEIGHT = '1.00'
const DEFAULT_COD_CHARGES = '32.70'
const DEFAULT_COD_PERCENT = '1.80'
const DEFAULT_OTHER_CHARGES = '0.00'
const RATE_BY_ZONE_INDEX = ['48.00', '90.00', '35.00', '53.00', '41.00', '85.00']

const getTargetPlans = () => {
  const raw = process.argv.slice(2).map((value) => value.trim()).filter(Boolean)
  return raw.length ? raw : ['Basic', 'Signature']
}

const restoreForPlan = async (planName: string) => {
  const [plan] = await db.select({ id: plans.id, name: plans.name }).from(plans).where(eq(plans.name, planName)).limit(1)
  if (!plan) {
    throw new Error(`Plan not found: ${planName}`)
  }

  const [courier] = await db.select().from(couriers).where(eq(couriers.id, TARGET_COURIER_ID)).limit(1)
  if (courier) {
    await db
      .update(couriers)
      .set({
        name: TARGET_COURIER_NAME,
        serviceProvider: TARGET_SERVICE_PROVIDER,
        isEnabled: true,
        businessType: ['b2c'],
        updatedAt: new Date(),
      } as any)
      .where(eq(couriers.id, TARGET_COURIER_ID))
  } else {
    await db.insert(couriers).values({
      id: TARGET_COURIER_ID,
      name: TARGET_COURIER_NAME,
      serviceProvider: TARGET_SERVICE_PROVIDER,
      isEnabled: true,
      businessType: ['b2c'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
  }

  const zoneRows = await db
    .select({ id: zones.id, code: zones.code, name: zones.name })
    .from(zones)
    .where(eq(zones.business_type, 'B2C'))
    .orderBy(asc(zones.id))

  if (zoneRows.length !== RATE_BY_ZONE_INDEX.length) {
    throw new Error(
      `Expected ${RATE_BY_ZONE_INDEX.length} B2C zones but found ${zoneRows.length}. Restore aborted to avoid misaligned rates.`,
    )
  }

  await db
    .delete(shippingRates)
    .where(and(eq(shippingRates.plan_id, plan.id), eq(shippingRates.courier_id, TARGET_COURIER_ID)))

  const insertRows = zoneRows.flatMap((zoneRow, index) => {
    const rate = RATE_BY_ZONE_INDEX[index]
    const basePayload = {
      plan_id: plan.id,
      service_provider: TARGET_SERVICE_PROVIDER,
      cod_charges: DEFAULT_COD_CHARGES,
      cod_percent: DEFAULT_COD_PERCENT,
      other_charges: DEFAULT_OTHER_CHARGES,
      courier_id: TARGET_COURIER_ID,
      courier_name: TARGET_COURIER_NAME,
      mode: TARGET_MODE,
      business_type: TARGET_BUSINESS_TYPE,
      min_weight: DEFAULT_MIN_WEIGHT,
      zone_id: zoneRow.id,
      rate,
      last_updated: new Date(),
    }

    return [
      {
        id: randomUUID(),
        ...basePayload,
        type: 'forward',
      },
      {
        id: randomUUID(),
        ...basePayload,
        type: 'rto',
      },
    ]
  })

  await db.insert(shippingRates).values(insertRows as any)

  console.log('[Restore Delhivery Express Surface] Completed', {
    plan: plan.name,
    planId: plan.id,
    courierId: TARGET_COURIER_ID,
    courierName: TARGET_COURIER_NAME,
    inserted: insertRows.length,
    zoneCount: zoneRows.length,
  })
}

async function main() {
  const plansToRestore = getTargetPlans()
  for (const planName of plansToRestore) {
    await restoreForPlan(planName)
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('[Restore Delhivery Express Surface] Done')
      process.exit(0)
    })
    .catch((error) => {
      console.error('[Restore Delhivery Express Surface] Failed:', error)
      process.exit(1)
    })
}
