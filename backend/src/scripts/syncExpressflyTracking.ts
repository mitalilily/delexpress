import dotenv from 'dotenv'
import { and, eq, isNotNull, ne } from 'drizzle-orm'
import { db } from '../models/client'
import { b2c_orders } from '../models/schema/b2cOrders'
import { ExpressflyService } from '../models/services/couriers/expressfly.service'
import { persistExpressflyTracking } from '../models/services/expressflyTracking.service'

dotenv.config({ path: '.env.production' })
dotenv.config()

const main = async () => {
const orders = await db
  .select({
    orderNumber: b2c_orders.order_number,
    awbNumber: b2c_orders.awb_number,
    shipmentId: b2c_orders.shipment_id,
  })
  .from(b2c_orders)
  .where(
    and(
      eq(b2c_orders.integration_type, 'expressfly'),
      isNotNull(b2c_orders.awb_number),
      ne(b2c_orders.awb_number, ''),
    ),
  )

let succeeded = 0
let failed = 0
let inserted = 0

for (const order of orders) {
  const awb = String(order.awbNumber || '').trim()
  if (!awb) continue

  try {
    const service = new ExpressflyService()
    const raw = await service.trackShipment(
      awb,
      [order.shipmentId, order.orderNumber].filter(Boolean) as string[],
    )
    const result = await persistExpressflyTracking(raw.raw ?? raw, awb)
    if (!result.success) {
      failed += 1
      console.log(`${order.orderNumber}\t${awb}\t${result.reason}`)
      continue
    }
    succeeded += 1
    inserted += result.inserted
    console.log(`${order.orderNumber}\t${awb}\tinserted=${result.inserted}`)
  } catch (error: any) {
    failed += 1
    console.log(`${order.orderNumber}\t${awb}\terror=${error?.message || error}`)
  }
}

console.log(`ExpressFly tracking sync complete: orders=${orders.length} succeeded=${succeeded} failed=${failed} inserted=${inserted}`)
process.exitCode = failed ? 1 : 0
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exitCode = 1
})
