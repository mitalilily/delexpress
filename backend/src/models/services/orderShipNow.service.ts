import { and, eq } from 'drizzle-orm'
import { db } from '../client'
import { addresses, b2c_orders, pickupAddresses } from '../../schema/schema'
import { DelhiveryService } from './couriers/delhivery.service'
import { regenerateOrderDocumentsServiceAdmin } from './adminOrders.service'
import { HttpError } from '../../utils/classes'

export type ShipNowOrderInput = {
  orderId: string
  expectedUserId?: string
  pickupDate?: string
  pickupTime?: string
  expectedPackageCount?: number | string
  pickupAddressId?: string
}

export type ShipNowOrderResult = {
  orderId: string
  orderNumber: string
  provider: string
  pickupRequested: boolean
  pickupLocation?: string | null
  pickupDate?: string | null
  pickupTime?: string | null
  expectedPackageCount?: number
  orderStatus?: string | null
  pickupStatus?: string | null
  label?: string | null
  invoice_link?: string | null
}

const normalizeProvider = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()

const parsePickupDetails = (value: unknown): Record<string, any> => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof value === 'object' ? (value as Record<string, any>) : {}
}

const normalizePickupDate = (value?: string | null) => {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  return text.slice(0, 10)
}

const normalizePickupTime = (value?: string | null) => {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) return text
  if (/^\d{2}:\d{2}$/.test(text)) return `${text}:00`
  return text
}

const getDefaultPickupTime = () => {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000)
  return `${String(nextHour.getHours()).padStart(2, '0')}:${String(nextHour.getMinutes()).padStart(2, '0')}:00`
}

const resolvePickupLocation = async (order: any, pickupAddressId?: string) => {
  const targetPickupAddressId = String(pickupAddressId || order?.pickup_location_id || '').trim()

  if (targetPickupAddressId) {
    const [pickupAddress] = await db
      .select({
        addressNickname: addresses.addressNickname,
        contactName: addresses.contactName,
      })
      .from(pickupAddresses)
      .innerJoin(addresses, eq(pickupAddresses.addressId, addresses.id))
      .where(
        and(
          eq(pickupAddresses.id, targetPickupAddressId),
          eq(pickupAddresses.userId, String(order.user_id)),
        ),
      )
      .limit(1)

    if (!pickupAddress) {
      throw new HttpError(404, 'Pickup address not found')
    }

    return pickupAddress.addressNickname?.trim() || pickupAddress.contactName?.trim() || ''
  }

  const pickupDetails = parsePickupDetails(order.pickup_details)
  return (
    String(pickupDetails?.warehouse_name || '').trim() ||
    String(pickupDetails?.name || '').trim() ||
    ''
  )
}

export const shipNowOrderService = async ({
  orderId,
  expectedUserId,
  pickupDate,
  pickupTime,
  expectedPackageCount,
  pickupAddressId,
}: ShipNowOrderInput): Promise<ShipNowOrderResult> => {
  const normalizedOrderId = String(orderId || '').trim()
  if (!normalizedOrderId) {
    throw new HttpError(400, 'Order ID is required.')
  }

  const [order] = await db.select().from(b2c_orders).where(eq(b2c_orders.id, normalizedOrderId)).limit(1)
  if (!order) {
    throw new HttpError(404, 'Order not found.')
  }

  if (expectedUserId && String(order.user_id) !== String(expectedUserId)) {
    throw new HttpError(404, 'Order not found.')
  }

  const provider = normalizeProvider(order.integration_type || order.courier_partner || '')
  const resolvedPackageCount = Math.max(
    1,
    Number.isFinite(Number(expectedPackageCount)) ? Math.floor(Number(expectedPackageCount)) : 1,
  )

  const isDelhivery = provider === 'delhivery'

  if (!isDelhivery) {
    const documents = await regenerateOrderDocumentsServiceAdmin({
      orderId: normalizedOrderId,
      regenerateLabel: true,
      regenerateInvoice: false,
      expectedUserId,
    })

    return {
      orderId: normalizedOrderId,
      orderNumber: order.order_number,
      provider: provider || String(order.integration_type || order.courier_partner || 'unknown'),
      pickupRequested: false,
      orderStatus: order.order_status ?? null,
      pickupStatus: order.pickup_status ?? null,
      label: documents.label ?? null,
      invoice_link: documents.invoice_link ?? null,
    }
  }

  if (!String(order.awb_number || '').trim()) {
    throw new HttpError(400, 'AWB number is required to request Delhivery pickup.')
  }

  const pickupLocation = await resolvePickupLocation(order, pickupAddressId)
  if (!pickupLocation) {
    throw new HttpError(400, 'Pickup warehouse name is required to request Delhivery pickup.')
  }

  const finalPickupDate = normalizePickupDate(pickupDate) || new Date().toISOString().slice(0, 10)
  const finalPickupTime = normalizePickupTime(pickupTime) || getDefaultPickupTime()

  const delhivery = new DelhiveryService()
  const pickupResponse = await delhivery.createPickupRequest({
    pickup_date: finalPickupDate,
    pickup_time: finalPickupTime,
    pickup_location: pickupLocation,
    expected_package_count: resolvedPackageCount,
  })

  const mergedPickupDetails = {
    ...(parsePickupDetails(order.pickup_details) || {}),
    pickup_date: finalPickupDate,
    pickup_time: finalPickupTime,
    expected_package_count: resolvedPackageCount,
    pickup_requested_via: 'ship_now',
    pickup_request_id:
      pickupResponse?.pickup_request_id ||
      pickupResponse?.request_id ||
      pickupResponse?.pickup_id ||
      null,
  }

  await db
    .update(b2c_orders)
    .set({
      order_status: 'pickup_initiated',
      pickup_status: 'pickup_initiated',
      pickup_error: null,
      pickup_details: mergedPickupDetails as any,
      updated_at: new Date(),
    })
    .where(eq(b2c_orders.id, normalizedOrderId))

  const documents = await regenerateOrderDocumentsServiceAdmin({
    orderId: normalizedOrderId,
    regenerateLabel: true,
    regenerateInvoice: true,
    expectedUserId,
  })

  return {
    orderId: normalizedOrderId,
    orderNumber: order.order_number,
    provider: 'delhivery',
    pickupRequested: true,
    pickupLocation,
    pickupDate: finalPickupDate,
    pickupTime: finalPickupTime,
    expectedPackageCount: resolvedPackageCount,
    orderStatus: 'pickup_initiated',
    pickupStatus: 'pickup_initiated',
    label: documents.label ?? null,
    invoice_link: documents.invoice_link ?? null,
  }
}
