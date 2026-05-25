import { db } from '../client'
import { tracking_events } from '../schema/trackingEvents'

const truncateNullableText = (value: string | null | undefined, maxLength: number) => {
  const text = String(value || '').trim()
  return text ? text.slice(0, maxLength) : null
}

export async function logTrackingEvent(params: {
  orderId: string
  userId: string
  awbNumber?: string | null
  courier?: string | null
  statusCode?: string | null
  statusText?: string | null
  location?: string | null
  raw?: any
}) {
  const { orderId, userId, awbNumber, courier, statusCode, statusText, location, raw } = params
  await db.insert(tracking_events).values({
    order_id: orderId,
    user_id: userId,
    awb_number: truncateNullableText(awbNumber, 100),
    courier: truncateNullableText(courier, 60),
    status_code: truncateNullableText(statusCode, 80),
    status_text: truncateNullableText(statusText, 200),
    location: truncateNullableText(location, 120),
    raw: raw || null,
  })
}
