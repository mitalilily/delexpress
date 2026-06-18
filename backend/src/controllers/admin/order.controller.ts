import { Response } from 'express'
import { eq } from 'drizzle-orm'
import {
  getAllOrdersServiceAdmin,
  regenerateOrderDocumentsServiceAdmin,
} from '../../models/services/adminOrders.service'
import { shipNowOrderService } from '../../models/services/orderShipNow.service'
import { db } from '../../models/client'
import { recordNdrEvent } from '../../models/services/ndr.service'
import { b2c_orders } from '../../models/schema/b2cOrders'
import { getMerchantSafeOperationalError } from '../../utils/merchantErrorMessages'
import { buildCsv } from '../../utils/csv'
import { createZipBuffer } from '../../utils/zip'

export const getAllOrdersControllerAdmin = async (req: any, res: Response) => {
  try {
    // Pagination params
    const page = parseInt(req.query.page as string, 10) || 1
    const limit = parseInt(req.query.limit as string, 10) || 10

    // Filters from query
    const filters = {
      status: req.query.status as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      search: req.query.search as string | undefined,
      userId: req.query.userId as string | undefined,
      sortBy: (req.query.sortBy as 'created_at' | undefined) || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc' | undefined) || 'desc',
    }

    const { orders, totalCount, totalPages } = await getAllOrdersServiceAdmin({
      page,
      limit,
      filters,
    })

    res.status(200).json({ success: true, orders, totalCount, totalPages })
  } catch (error: any) {
    console.error('Error fetching all orders:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const exportOrdersControllerAdmin = async (req: any, res: Response) => {
  try {
    // Filters from query
    const filters = {
      status: req.query.status as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      search: req.query.search as string | undefined,
      userId: req.query.userId as string | undefined,
      sortBy: (req.query.sortBy as 'created_at' | undefined) || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc' | undefined) || 'desc',
    }

    // Fetch all orders without pagination for export
    const { orders } = await getAllOrdersServiceAdmin({
      page: 1,
      limit: 100000, // Large limit to get all orders
      filters,
    })

    // Generate CSV
    const headers = [
      'Order ID',
      'AWB Number',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Status',
      'Order Type',
      'Amount',
      'Courier Partner',
      'Order Date',
      'City',
      'State',
      'Pincode',
      'Address',
    ]

    const rows = orders.map((order: any) => [
      order.order_id,
      order.awb_number,
      order.buyer_name,
      order.buyer_phone,
      order.buyer_email,
      order.order_status,
      order.order_type,
      order.order_amount,
      order.display_courier_partner || order.courier_partner,
      order.order_date,
      order.city,
      order.state,
      order.pincode,
      order.address,
    ])

    const csv = buildCsv(headers, rows)
    const exportDate = new Date().toISOString().split('T')[0]
    const csvFilename = `orders_export_${exportDate}.csv`
    const zipFilename = `orders_export_${exportDate}.zip`
    const zip = createZipBuffer([{ filename: csvFilename, content: csv }])

    // Set headers for file download
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`)
    res.setHeader('Content-Length', String(zip.length))
    res.status(200).send(zip)
  } catch (error: any) {
    console.error('Error exporting orders:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const regenerateOrderDocumentsControllerAdmin = async (req: any, res: Response) => {
  try {
    const orderId = String(req.params.id || '').trim()
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' })
    }

    const regenerateLabel =
      typeof req.body?.regenerateLabel === 'boolean' ? req.body.regenerateLabel : true
    const regenerateInvoice =
      typeof req.body?.regenerateInvoice === 'boolean' ? req.body.regenerateInvoice : true

    const result = await regenerateOrderDocumentsServiceAdmin({
      orderId,
      regenerateLabel,
      regenerateInvoice,
    })

    return res.status(200).json({
      success: true,
      message: 'Order documents regenerated successfully',
      data: result,
    })
  } catch (error: any) {
    console.error('Error regenerating order documents:', error?.message || error)
    return res.status(400).json({
      success: false,
      message: error?.message || 'Failed to regenerate order documents',
    })
  }
}

export const updateOrderStatusControllerAdmin = async (req: any, res: Response) => {
  try {
    const orderId = String(req.params.id || '').trim()
    const status = String(req.body?.status || '').trim().toLowerCase()
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
    const remarks = typeof req.body?.remarks === 'string' ? req.body.remarks.trim() : ''
    const attemptNo =
      req.body?.attemptNo !== undefined && req.body?.attemptNo !== null
        ? String(req.body.attemptNo).trim()
        : ''

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' })
    }

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' })
    }

    const [order] = await db.select().from(b2c_orders).where(eq(b2c_orders.id, orderId)).limit(1)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const [updated] = await db
      .update(b2c_orders)
      .set({
        order_status: status,
        updated_at: new Date(),
      })
      .where(eq(b2c_orders.id, orderId))
      .returning()

    if (status === 'ndr' || status === 'undelivered') {
      await recordNdrEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number || undefined,
        status,
        reason: reason || null,
        remarks: remarks || null,
        attemptNo: attemptNo || null,
        payload: {
          source: 'admin_order_status_update',
          adminUserId: req.user?.sub || null,
        },
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updated,
    })
  } catch (error: any) {
    console.error('Error updating order status:', error?.message || error)
    return res.status(400).json({
      success: false,
      message: error?.message || 'Failed to update order status',
    })
  }
}

export const shipNowOrderControllerAdmin = async (req: any, res: Response) => {
  try {
    const orderId = String(req.params.id || '').trim()
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' })
    }

    const result = await shipNowOrderService({
      orderId,
      pickupDate: req.body?.pickup_date ?? req.body?.pickupDate ?? undefined,
      pickupTime: req.body?.pickup_time ?? req.body?.pickupTime ?? undefined,
      expectedPackageCount:
        req.body?.expected_package_count ??
        req.body?.expectedPackageCount ??
        req.body?.package_count ??
        req.body?.packageCount ??
        undefined,
      pickupAddressId:
        req.body?.pickup_address_id ?? req.body?.pickupAddressId ?? req.body?.pickup_location_id ?? undefined,
    })

    return res.status(200).json({
      success: true,
      message: result.pickupRequested
        ? 'Pickup request submitted and documents generated successfully'
        : 'Label regenerated successfully',
      data: result,
    })
  } catch (error: any) {
    console.error('Error processing ship now request:', error?.message || error)
    const rawMessage = error?.response?.data?.message || error?.message || ''
    const errorMessage = getMerchantSafeOperationalError(
      rawMessage,
      'Please contact your admin to add wallet balance and retry.',
    )
    return res.status(typeof error?.statusCode === 'number' ? error.statusCode : 400).json({
      success: false,
      message: errorMessage || 'Failed to process ship now request',
    })
  }
}

export const addManualNdrControllerAdmin = async (req: any, res: Response) => {
  try {
    const orderId = String(req.params.id || '').trim()
    const status = String(req.body?.status || 'ndr').trim().toLowerCase()
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
    const remarks = typeof req.body?.remarks === 'string' ? req.body.remarks.trim() : ''
    const attemptNo =
      req.body?.attemptNo !== undefined && req.body?.attemptNo !== null
        ? String(req.body.attemptNo).trim()
        : ''

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' })
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' })
    }

    const [order] = await db.select().from(b2c_orders).where(eq(b2c_orders.id, orderId)).limit(1)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const [updated] = await db
      .update(b2c_orders)
      .set({
        order_status: status,
        updated_at: new Date(),
      })
      .where(eq(b2c_orders.id, orderId))
      .returning()

    const event = await recordNdrEvent({
      orderId: order.id,
      userId: order.user_id,
      awbNumber: order.awb_number || undefined,
      status,
      reason,
      remarks: remarks || null,
      attemptNo: attemptNo || null,
      payload: {
        source: 'admin_manual_ndr',
        adminUserId: req.user?.sub || null,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'NDR added successfully',
      data: {
        order: updated,
        event,
      },
    })
  } catch (error: any) {
    console.error('Error adding manual NDR:', error?.message || error)
    return res.status(400).json({
      success: false,
      message: error?.message || 'Failed to add manual NDR',
    })
  }
}
