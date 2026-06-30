import { and, eq } from 'drizzle-orm'
import { Response } from 'express'
import { db } from '../models/client'
import { b2c_orders } from '../models/schema/b2cOrders'
import {
  adminNdrExport,
  getAdminNdrKpisData,
  getNdrTimeline,
  listNdrEvents,
  listNdrEventsAdmin,
} from '../models/services/ndr.service'

export const getMyNdrEvents = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub
    const {
      orderId,
      page,
      limit,
      search,
      fromDate,
      toDate,
      courier,
      integration_type,
      attempt_count,
      status,
    } = req.query as any
    const p = Number(page) || 1
    const l = Math.min(Number(limit) || 20, 200)
    const { rows, totalCount } = await listNdrEvents(userId, orderId, {
      page: p,
      limit: l,
      search: search || '',
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    })
    res.json({ success: true, data: rows, totalCount })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}

export const getAdminNdrEvents = async (req: any, res: Response) => {
  try {
    const {
      orderId,
      page,
      limit,
      search,
      fromDate,
      toDate,
      courier,
      integration_type,
      attempt_count,
      status,
    } = req.query as any
    const p = Number(page) || 1
    const l = Math.min(Number(limit) || 20, 200)
    const { rows, totalCount } = await listNdrEventsAdmin(orderId, {
      page: p,
      limit: l,
      search: search || '',
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      courier: courier || undefined,
      integration_type: integration_type || undefined,
      attempt_count: attempt_count ? Number(attempt_count) : undefined,
      status: status || undefined,
    })
    res.json({ success: true, data: rows, totalCount })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}

export const getAdminNdrTimeline = async (req: any, res: Response) => {
  try {
    const { awb, orderId } = req.query as { awb?: string; orderId?: string }
    if (!awb && !orderId) {
      return res.status(400).json({ success: false, message: 'Provide awb or orderId' })
    }
    const data = await getNdrTimeline({ awb, orderId })
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const getMyNdrTimeline = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub
    const { awb, orderId } = req.query as { awb?: string; orderId?: string }
    if (!awb && !orderId) {
      return res.status(400).json({ success: false, message: 'Provide awb or orderId' })
    }

    let resolvedOrderId: string | undefined

    if (orderId) {
      const [order] = await db
        .select({ id: b2c_orders.id })
        .from(b2c_orders)
        .where(and(eq(b2c_orders.id, orderId), eq(b2c_orders.user_id, userId)))
        .limit(1)
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }
      resolvedOrderId = order.id
    } else if (awb) {
      const [order] = await db
        .select({ id: b2c_orders.id })
        .from(b2c_orders)
        .where(and(eq(b2c_orders.awb_number, awb), eq(b2c_orders.user_id, userId)))
        .limit(1)
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
      }
      resolvedOrderId = order.id
    }

    const data = await getNdrTimeline({ orderId: resolvedOrderId })
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const exportAdminNdrCsv = async (req: any, res: Response) => {
  try {
    const { orderId, search, fromDate, toDate, courier, integration_type, attempt_count, status } =
      req.query as any
    const csv = await adminNdrExport({
      orderId: orderId || undefined,
      search: search || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      courier: courier || undefined,
      integration_type: integration_type || undefined,
      attempt_count: attempt_count ? Number(attempt_count) : undefined,
      status: status || undefined,
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="ndr_export.csv"`)
    return res.status(200).send(csv)
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const getAdminNdrKpis = async (req: any, res: Response) => {
  try {
    const { orderId, search, fromDate, toDate, courier, integration_type, attempt_count, status } =
      req.query as any
    const data = await getAdminNdrKpisData({
      orderId: orderId || undefined,
      search: search || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      courier: courier || undefined,
      integration_type: integration_type || undefined,
      attempt_count: attempt_count ? Number(attempt_count) : undefined,
      status: status || undefined,
    })

    return res.status(200).json({ success: true, data })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}
