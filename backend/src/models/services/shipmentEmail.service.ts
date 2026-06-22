import { eq, sql } from 'drizzle-orm'
import { db } from '../client'
import { userProfiles } from '../schema/userProfile'
import { users } from '../schema/users'
import { sendShipmentTrackingUpdateEmail } from '../../utils/emailSender'

const normalizeStatus = (status: unknown) => String(status || '').trim().toLowerCase()

const resolveSellerName = (email?: string | null, companyName?: string | null) => {
  const fallback = String(email || '').split('@')[0].trim()
  return companyName?.trim() || fallback || 'Seller'
}

const resolveProductName = (products: unknown) => {
  if (!products) return 'Product'

  if (Array.isArray(products)) {
    const names = products
      .map((product: any) =>
        String(product?.productName || product?.name || product?.title || '').trim(),
      )
      .filter(Boolean)

    if (names.length > 0) {
      return names.slice(0, 3).join(', ')
    }
  }

  if (typeof products === 'object') {
    const product = products as Record<string, any>
    const resolved = String(product.productName || product.name || product.title || '').trim()
    if (resolved) return resolved
  }

  return 'Product'
}

const formatAddress = (order: any) =>
  [order?.address, order?.city, order?.state, order?.pincode]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')

export async function sendSellerShipmentTrackingUpdateEmail(params: {
  order: any
  trackingStatus: string
  courierName?: string | null
  previousStatus?: string | null
  executor?: typeof db
}) {
  const { order, trackingStatus, courierName, previousStatus, executor = db } = params

  if (normalizeStatus(previousStatus) === normalizeStatus(trackingStatus)) {
    return false
  }

  const [seller] = await executor
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, order.user_id))
    .limit(1)

  if (!seller?.email) {
    console.warn(`Skipping shipment email for order ${order?.order_number || order?.id}: seller email not found`)
    return false
  }

  const [profile] = await executor
    .select({
      companyName: sql<string>`(${userProfiles.companyInfo} ->> 'companyName')`,
      businessName: sql<string>`(${userProfiles.companyInfo} ->> 'businessName')`,
      brandName: sql<string>`(${userProfiles.companyInfo} ->> 'brandName')`,
    })
    .from(userProfiles)
    .where(eq(userProfiles.userId, order.user_id))
    .limit(1)

  const sellerName = resolveSellerName(
    seller.email,
    profile?.companyName || profile?.businessName || profile?.brandName || null,
  )

  await sendShipmentTrackingUpdateEmail({
    to: seller.email,
    sellerName,
    orderNumber: String(order.order_number || order.id || ''),
    awbNumber: order.awb_number ?? null,
    courierName: courierName || order.courier_partner || 'Courier',
    trackingStatus,
    consigneeName: order.buyer_name,
    consigneeAddress: formatAddress(order),
    productName: resolveProductName(order.products),
    phoneNumber: order.buyer_phone,
  })

  return true
}
