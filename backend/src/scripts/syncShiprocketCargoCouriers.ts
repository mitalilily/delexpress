import { db } from '../models/client'
import { couriers } from '../models/schema/couriers'

const CARRIERS = [
  [3, 'Delhivery'],
  [5, 'Xpressbees'],
  [7, 'ScorpionExpress'],
  [8, 'Gati'],
  [9, 'TCIExpress'],
  [11, 'Delhivery Enterprise'],
  [12, 'OxyzenExpress'],
  [19, 'Bluedart'],
  [21, 'Movin'],
  [22, 'CargoPrime'],
  [24, 'Ekart'],
  [26, 'Delhivery Heavy'],
  [31, 'Rivigo'],
  [33, 'Delhivery KB'],
  [34, 'DP World'],
  [44, 'Velocity'],
  [50, 'Rivigo Priority'],
] as const

const run = async () => {
  for (const [id, name] of CARRIERS) {
    await db
      .insert(couriers)
      .values({ id, name, serviceProvider: 'shiprocket-cargo', isEnabled: true, businessType: ['b2b'] })
      .onConflictDoUpdate({
        target: [couriers.id, couriers.serviceProvider],
        set: { name, isEnabled: true, businessType: ['b2b'], updatedAt: new Date() },
      })
  }
  console.log(`Synced ${CARRIERS.length} Shiprocket Cargo B2B couriers.`)
  process.exit(0)
}

run().catch((error) => {
  console.error('Shiprocket Cargo courier sync failed:', error)
  process.exit(1)
})
