import { and, eq } from 'drizzle-orm'
import { db } from '../models/client'
import { couriers } from '../models/schema/couriers'
import { resolveCourierId } from '../models/services/courierIntegration.service'

const SERVICE_PROVIDER = 'shadowfax'
const COURIER_NAME = 'Shadowfax'
const DEFAULT_BUSINESS_TYPES = ['b2c', 'b2b'] as const

async function main() {
  const [existing] = await db
    .select()
    .from(couriers)
    .where(and(eq(couriers.serviceProvider, SERVICE_PROVIDER)))
    .limit(1)

  if (existing) {
    const nextValues: Record<string, any> = {
      name: COURIER_NAME,
      isEnabled: true,
      businessType: Array.isArray(existing.businessType) && existing.businessType.length
        ? existing.businessType
        : [...DEFAULT_BUSINESS_TYPES],
      updatedAt: new Date(),
    }

    await db
      .update(couriers)
      .set(nextValues as any)
      .where(and(eq(couriers.id, existing.id), eq(couriers.serviceProvider, SERVICE_PROVIDER)))

    console.log(`[Shadowfax seed] Updated existing courier row ${existing.id}`)
    return
  }

  const courierId = resolveCourierId(SERVICE_PROVIDER, SERVICE_PROVIDER)

  await db.insert(couriers).values({
    id: courierId,
    name: COURIER_NAME,
    serviceProvider: SERVICE_PROVIDER,
    isEnabled: true,
    businessType: [...DEFAULT_BUSINESS_TYPES],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any)

  console.log(`[Shadowfax seed] Inserted courier row ${courierId}`)
}

main()
  .then(() => {
    console.log('[Shadowfax seed] Complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[Shadowfax seed] Failed:', error)
    process.exit(1)
  })
