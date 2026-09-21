import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm'
import { Request, Response } from 'express'
import { db } from '../../models/client'
import { computeB2CFreightForOrder } from '../../models/services/shiprocket.service'
import { presignDownload } from '../../models/services/upload.service'
import { createWalletTransaction } from '../../models/services/wallet.service'
import {
  sendAdminWeightDiscrepancyEmail,
  sendDisputeUpdateEmail,
} from '../../models/services/weightReconciliationEmail.service'
import {
  b2c_orders,
  users,
  wallets,
  walletTransactions,
  weight_adjustment_history,
  weight_discrepancies,
  weight_disputes,
} from '../../schema/schema'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizeKgInputToGrams(value: unknown, fieldName: string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`${fieldName} must be greater than 0`)
  }
  return Math.round(numeric > 100 ? numeric : numeric * 1000)
}

function formatKgSlab(weightG: number) {
  return `${(weightG / 1000).toFixed(3)}kg`
}

function splitCsvLine(line: string) {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

function parseDiscrepancyCsv(csvText: string) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((header) =>
    header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
  )

  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, cellIndex) => {
      row[header] = cells[cellIndex] || ''
    })
    const pick = (...keys: string[]) => keys.map((key) => row[key]).find((value) => value)
    return {
      rowNumber: index + 2,
      orderId: pick('order_id', 'order', 'order_number', 'order_no'),
      awbNumber: pick('awb', 'awb_number'),
      sellerWeightKg: pick(
        'seller_weight_kg',
        'charged_weight',
        'charged_weight_kg',
        'initial_weight',
        'initial_weight_kg',
      ),
      freightPaid: pick('freight_paid', 'freight', 'original_freight', 'original_shipping_charge'),
      courierWeightKg: pick(
        'courier_weight_kg',
        'declared_weight',
        'declared_weight_kg',
        'actual_weight',
        'charged_by_courier_kg',
      ),
      notes: pick('notes', 'admin_notes', 'remark', 'remarks'),
    }
  })
}

async function findB2COrder(orderId?: string, awbNumber?: string) {
  const trimmedOrder = String(orderId || '').trim()
  const trimmedAwb = String(awbNumber || '').trim()
  const orderConditions: any[] = []
  if (trimmedOrder) {
    orderConditions.push(eq(b2c_orders.order_number, trimmedOrder))
    orderConditions.push(eq(b2c_orders.order_id, trimmedOrder))
    if (uuidRegex.test(trimmedOrder)) orderConditions.push(eq(b2c_orders.id, trimmedOrder))
  }
  if (!orderConditions.length && trimmedAwb) {
    orderConditions.push(eq(b2c_orders.awb_number, trimmedAwb))
  }
  if (!orderConditions.length) {
    throw new Error('Order ID or AWB is required')
  }

  const [order] = await db
    .select()
    .from(b2c_orders)
    .where(or(...orderConditions))
    .limit(1)

  if (!order) throw new Error('B2C order not found')
  if (trimmedAwb && order.awb_number && String(order.awb_number) !== trimmedAwb) {
    throw new Error(`AWB mismatch for order ${order.order_number}`)
  }
  return order
}

async function createAdminDiscrepancyRecord(input: {
  orderId?: string
  awbNumber?: string
  sellerWeightKg: unknown
  freightPaid?: unknown
  courierWeightKg: unknown
  notes?: string
  source: 'admin_manual' | 'admin_csv'
  rowNumber?: number
}) {
  const order = await findB2COrder(input.orderId, input.awbNumber)
  const sellerWeightG = normalizeKgInputToGrams(input.sellerWeightKg, 'Seller weight')
  const courierWeightG = normalizeKgInputToGrams(input.courierWeightKg, 'Courier weight')
  const originalFreight = toNumber(
    input.freightPaid ?? order.freight_charges ?? order.shipping_charges,
    0,
  )
  const courierId = Number(order.courier_id)
  if (!Number.isFinite(courierId) || courierId <= 0) {
    throw new Error(`Courier ID is missing for order ${order.order_number}`)
  }

  const pickupDetails = (order.pickup_details || {}) as any
  const rtoDetails = (order.rto_details || {}) as any
  const originPincode = String(pickupDetails.pincode || rtoDetails.pincode || '').trim()
  if (!originPincode || !order.pincode) {
    throw new Error(`Origin/destination pincode missing for order ${order.order_number}`)
  }

  const recalculated = await computeB2CFreightForOrder({
    userId: order.user_id,
    courierId,
    serviceProvider: order.integration_type,
    mode: order.shipping_mode,
    selectedMaxSlabWeight: order.selected_max_slab_weight ?? null,
    destinationPincode: String(order.pincode),
    originPincode,
    orderAmount: Number(order.order_amount || 0),
    weightG: courierWeightG,
    lengthCm: Number(order.length || 0),
    breadthCm: Number(order.breadth || 0),
    heightCm: Number(order.height || 0),
  })

  const revisedFreight = Number(recalculated.freight || 0)
  const additionalCharge = Math.max(0, Number((revisedFreight - originalFreight).toFixed(2)))

  const [existing] = await db
    .select()
    .from(weight_discrepancies)
    .where(
      and(
        eq(weight_discrepancies.b2c_order_id, order.id),
        eq(weight_discrepancies.charged_weight, courierWeightG.toString()),
        eq(weight_discrepancies.declared_weight, sellerWeightG.toString()),
        eq(weight_discrepancies.status, 'pending'),
      ),
    )
    .limit(1)

  if (existing) return { discrepancy: existing, order, duplicate: true }

  const [discrepancy] = await db
    .insert(weight_discrepancies)
    .values({
      b2c_order_id: order.id,
      b2b_order_id: null,
      order_type: 'b2c',
      user_id: order.user_id,
      order_number: order.order_number,
      awb_number: order.awb_number,
      courier_partner: order.courier_partner,
      declared_weight: sellerWeightG.toString(),
      actual_weight: courierWeightG.toString(),
      charged_weight: courierWeightG.toString(),
      weight_difference: (courierWeightG - sellerWeightG).toString(),
      declared_dimensions: {
        length: Number(order.length || 0),
        breadth: Number(order.breadth || 0),
        height: Number(order.height || 0),
      },
      actual_dimensions: {
        length: Number(order.length || 0),
        breadth: Number(order.breadth || 0),
        height: Number(order.height || 0),
      },
      original_shipping_charge: originalFreight.toFixed(2),
      revised_shipping_charge: revisedFreight.toFixed(2),
      additional_charge: additionalCharge.toFixed(2),
      weight_slab_original: formatKgSlab(sellerWeightG),
      weight_slab_charged: formatKgSlab(courierWeightG),
      status: 'pending',
      auto_accepted: false,
      has_dispute: false,
      admin_notes: input.notes || null,
      courier_remarks: 'Admin added courier weight discrepancy',
      weighing_metadata: {
        source: input.source,
        admin_created: true,
        row_number: input.rowNumber,
        recalculated_rate: recalculated,
      } as any,
      courier_reported_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning()

  await db.insert(weight_adjustment_history).values({
    discrepancy_id: discrepancy.id,
    b2c_order_id: order.id,
    action_type: 'discrepancy_detected',
    previous_weight: sellerWeightG.toString(),
    new_weight: courierWeightG.toString(),
    weight_difference: (courierWeightG - sellerWeightG).toString(),
    charge_adjustment: additionalCharge.toFixed(2),
    changed_by_type: 'admin',
    source: input.source,
    reason: 'Admin entered weight discrepancy',
    notes: input.notes || null,
    created_at: new Date(),
  })

  await db
    .update(b2c_orders)
    .set({ weight_discrepancy: true, updated_at: new Date() })
    .where(eq(b2c_orders.id, order.id))

  const [user] = await db.select().from(users).where(eq(users.id, order.user_id)).limit(1)
  if (user?.email) {
    sendAdminWeightDiscrepancyEmail({
      userEmail: user.email,
      userName: user.email,
      orderNumber: order.order_number,
      discrepancyId: discrepancy.id,
      awbNumber: order.awb_number || undefined,
      courierPartner: order.courier_partner || undefined,
      declaredWeight: sellerWeightG,
      chargedWeight: courierWeightG,
      weightDifference: courierWeightG - sellerWeightG,
      additionalCharge,
      originalShippingCharge: originalFreight,
      revisedShippingCharge: revisedFreight,
      approved: false,
    }).catch((err) => console.error('Failed to send admin discrepancy email:', err))
  }

  return { discrepancy, order, duplicate: false }
}

/**
 * Helper: Extract R2 key from full R2 URL
 * Example: https://xxx.r2.cloudflarestorage.com/bucket-name/folder/file.mp4 -> folder/file.mp4
 */
function extractR2Key(url: string): string {
  try {
    // Parse the URL to get the path
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    // Remove empty strings and bucket name (first part after /)
    const [, bucketName, ...keyParts] = pathParts
    return keyParts.join('/')
  } catch (error) {
    console.error('Error extracting R2 key from URL:', url, error)
    return url // Return original if parsing fails
  }
}

/**
 * Get all weight discrepancies (admin view)
 */
export async function getAllDiscrepancies(req: Request, res: Response) {
  try {
    const { status, hasDispute, userId, fromDate, toDate, page = 1, limit = 50 } = req.query

    const conditions: any[] = []

    if (status) conditions.push(eq(weight_discrepancies.status, status as string))
    if (hasDispute === 'true') conditions.push(eq(weight_discrepancies.has_dispute, true))
    if (userId) conditions.push(eq(weight_discrepancies.user_id, userId as string))
    if (fromDate)
      conditions.push(gte(weight_discrepancies.created_at, new Date(fromDate as string)))
    if (toDate) conditions.push(lte(weight_discrepancies.created_at, new Date(toDate as string)))

    const offset = (Number(page) - 1) * Number(limit)

    const discrepancies = await db
      .select({
        discrepancy: weight_discrepancies,
        user: {
          id: users.id,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(weight_discrepancies)
      .leftJoin(users, eq(users.id, weight_discrepancies.user_id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(weight_discrepancies.created_at))
      .limit(Number(limit))
      .offset(offset)

    // Convert R2 URLs to presigned download URLs for courier weight proof images
    const discrepanciesWithPresignedUrls = await Promise.all(
      discrepancies.map(async (item) => {
        if (
          item.discrepancy?.courier_weight_proof_images &&
          Array.isArray(item.discrepancy.courier_weight_proof_images) &&
          item.discrepancy.courier_weight_proof_images.length > 0
        ) {
          try {
            const keys = item.discrepancy.courier_weight_proof_images.map((url) =>
              extractR2Key(url),
            )
            const presignedUrls = await presignDownload(keys)
            return {
              ...item,
              discrepancy: {
                ...item.discrepancy,
                courier_weight_proof_images: Array.isArray(presignedUrls)
                  ? presignedUrls
                  : [presignedUrls],
              },
            }
          } catch (error) {
            console.error('Error generating presigned URLs for courier proof:', error)
            return item
          }
        }
        return item
      }),
    )

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(weight_discrepancies)
      .where(conditions.length ? and(...conditions) : undefined)

    res.json({
      discrepancies: discrepanciesWithPresignedUrls,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        totalPages: Math.ceil(Number(count) / Number(limit)),
      },
    })
  } catch (error) {
    console.error('Error fetching admin discrepancies:', error)
    res.status(500).json({ error: 'Failed to fetch discrepancies' })
  }
}

/**
 * Create one admin-entered weight discrepancy.
 */
export async function createManualWeightDiscrepancy(req: Request, res: Response) {
  try {
    const result = await createAdminDiscrepancyRecord({
      orderId: req.body.orderId || req.body.orderNumber,
      awbNumber: req.body.awbNumber,
      sellerWeightKg: req.body.sellerWeightKg,
      freightPaid: req.body.freightPaid,
      courierWeightKg: req.body.courierWeightKg,
      notes: req.body.notes,
      source: 'admin_manual',
    })

    res.status(result.duplicate ? 200 : 201).json({
      success: true,
      duplicate: result.duplicate,
      discrepancy: result.discrepancy,
    })
  } catch (error: any) {
    console.error('Error creating manual weight discrepancy:', error)
    res.status(400).json({ error: error.message || 'Failed to create weight discrepancy' })
  }
}

/**
 * Create admin-entered discrepancies from pasted/uploaded CSV text.
 */
export async function createCsvWeightDiscrepancies(req: Request, res: Response) {
  try {
    const rows = parseDiscrepancyCsv(req.body.csvText || req.body.csv || '')
    if (!rows.length) {
      return res.status(400).json({
        error:
          'CSV must include headers and at least one row. Required: order_id, awb, seller_weight_kg, freight_paid, courier_weight_kg',
      })
    }

    const results: any[] = []
    for (const row of rows) {
      try {
        const result = await createAdminDiscrepancyRecord({
          orderId: row.orderId,
          awbNumber: row.awbNumber,
          sellerWeightKg: row.sellerWeightKg,
          freightPaid: row.freightPaid,
          courierWeightKg: row.courierWeightKg,
          notes: row.notes,
          source: 'admin_csv',
          rowNumber: row.rowNumber,
        })
        results.push({
          rowNumber: row.rowNumber,
          success: true,
          duplicate: result.duplicate,
          discrepancyId: result.discrepancy.id,
          orderNumber: result.discrepancy.order_number,
          additionalCharge: result.discrepancy.additional_charge,
        })
      } catch (rowError: any) {
        results.push({
          rowNumber: row.rowNumber,
          success: false,
          error: rowError.message || 'Failed to create row',
        })
      }
    }

    res.json({
      success: results.some((row) => row.success),
      total: results.length,
      created: results.filter((row) => row.success && !row.duplicate).length,
      duplicates: results.filter((row) => row.success && row.duplicate).length,
      failed: results.filter((row) => !row.success).length,
      results,
    })
  } catch (error: any) {
    console.error('Error creating CSV weight discrepancies:', error)
    res.status(400).json({ error: error.message || 'Failed to import weight discrepancies' })
  }
}

/**
 * Admin approval applies the discrepancy debit to the seller wallet.
 */
export async function approveWeightDiscrepancy(req: Request, res: Response) {
  try {
    const { id } = req.params
    const adminId = (req as any).user?.sub
    const { notes } = req.body || {}

    const [discrepancy] = await db
      .select()
      .from(weight_discrepancies)
      .where(eq(weight_discrepancies.id, id))
      .limit(1)

    if (!discrepancy) {
      return res.status(404).json({ error: 'Weight discrepancy not found' })
    }
    if (!['pending', 'accepted'].includes(discrepancy.status || '')) {
      return res.status(400).json({
        error: `Weight discrepancy cannot be approved from status ${discrepancy.status}`,
      })
    }

    const additionalCharge = Number(discrepancy.additional_charge || 0)
    const debitRef = `weight_discrepancy_${discrepancy.id}`
    let walletTransactionCreated = false

    const [updatedDiscrepancy] = await db.transaction(async (tx) => {
      if (additionalCharge > 0) {
        const [userWallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.userId, discrepancy.user_id))
          .limit(1)

        if (!userWallet) throw new Error('Seller wallet not found')

        const [existingDebit] = await tx
          .select()
          .from(walletTransactions)
          .where(
            and(
              eq(walletTransactions.wallet_id, userWallet.id),
              eq(walletTransactions.type, 'debit'),
              eq(walletTransactions.ref, debitRef),
            ),
          )
          .limit(1)

        if (!existingDebit) {
          await createWalletTransaction({
            walletId: userWallet.id,
            amount: additionalCharge,
            type: 'debit',
            reason: `Weight discrepancy charge for order ${discrepancy.order_number}`,
            ref: debitRef,
            meta: {
              discrepancy_id: discrepancy.id,
              order_number: discrepancy.order_number,
              awb_number: discrepancy.awb_number,
              order_type: discrepancy.order_type,
              invoice_billable: true,
              source: 'admin_weight_discrepancy',
            },
            tx: tx as any,
          })
          walletTransactionCreated = true
        }
      }

      const [updated] = await tx
        .update(weight_discrepancies)
        .set({
          status: 'accepted',
          resolution_notes: notes || 'Approved by admin',
          resolved_by: adminId || null,
          resolved_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(weight_discrepancies.id, discrepancy.id))
        .returning()

      if (discrepancy.b2c_order_id) {
        await tx
          .update(b2c_orders)
          .set({
            actual_weight: discrepancy.actual_weight as any,
            charged_weight: discrepancy.charged_weight as any,
            weight_discrepancy: true,
            updated_at: new Date(),
          })
          .where(eq(b2c_orders.id, discrepancy.b2c_order_id))
      }

      await tx.insert(weight_adjustment_history).values({
        discrepancy_id: discrepancy.id,
        b2c_order_id: discrepancy.b2c_order_id,
        b2b_order_id: discrepancy.b2b_order_id,
        action_type: additionalCharge > 0 ? 'charge_applied' : 'weight_updated',
        previous_weight: discrepancy.declared_weight,
        new_weight: discrepancy.charged_weight,
        weight_difference: discrepancy.weight_difference,
        charge_adjustment: additionalCharge.toFixed(2),
        changed_by: adminId || null,
        changed_by_type: 'admin',
        source: 'admin_panel',
        reason: 'Admin approved weight discrepancy',
        notes: notes || null,
        created_at: new Date(),
      })

      return [updated]
    })

    const [user] = await db.select().from(users).where(eq(users.id, discrepancy.user_id)).limit(1)
    if (user?.email) {
    sendAdminWeightDiscrepancyEmail({
        userEmail: user.email,
        userName: user.email,
        orderNumber: discrepancy.order_number,
        discrepancyId: discrepancy.id,
        awbNumber: discrepancy.awb_number || undefined,
        courierPartner: discrepancy.courier_partner || undefined,
        declaredWeight: Number(discrepancy.declared_weight || 0),
        chargedWeight: Number(discrepancy.charged_weight || 0),
        weightDifference: Number(discrepancy.weight_difference || 0),
        additionalCharge,
        originalShippingCharge: Number(discrepancy.original_shipping_charge || 0),
        revisedShippingCharge: Number(discrepancy.revised_shipping_charge || 0),
        approved: true,
      }).catch((err) => console.error('Failed to send approved discrepancy email:', err))
    }

    res.json({ success: true, walletTransactionCreated, discrepancy: updatedDiscrepancy })
  } catch (error: any) {
    console.error('Error approving weight discrepancy:', error)
    res.status(400).json({ error: error.message || 'Failed to approve weight discrepancy' })
  }
}

/**
 * Get all disputes (admin view)
 */
export async function getAllDisputes(req: Request, res: Response) {
  try {
    const { status, userId, fromDate, toDate, page = 1, limit = 50 } = req.query

    const conditions: any[] = []

    if (status) conditions.push(eq(weight_disputes.status, status as string))
    if (userId) conditions.push(eq(weight_disputes.user_id, userId as string))
    if (fromDate) conditions.push(gte(weight_disputes.created_at, new Date(fromDate as string)))
    if (toDate) conditions.push(lte(weight_disputes.created_at, new Date(toDate as string)))

    const offset = (Number(page) - 1) * Number(limit)

    const disputes = await db
      .select({
        dispute: weight_disputes,
        discrepancy: weight_discrepancies,
        user: {
          id: users.id,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(weight_disputes)
      .leftJoin(weight_discrepancies, eq(weight_discrepancies.id, weight_disputes.discrepancy_id))
      .leftJoin(users, eq(users.id, weight_disputes.user_id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(weight_disputes.created_at))
      .limit(Number(limit))
      .offset(offset)

    // Convert R2 URLs to presigned download URLs for evidence
    const disputesWithPresignedUrls = await Promise.all(
      disputes.map(async (item) => {
        if (
          item.dispute?.customer_evidence_urls &&
          Array.isArray(item.dispute.customer_evidence_urls) &&
          item.dispute.customer_evidence_urls.length > 0
        ) {
          try {
            // Extract R2 keys from full URLs
            const keys = item.dispute.customer_evidence_urls.map((url) => extractR2Key(url))
            // Generate presigned URLs
            const presignedUrls = await presignDownload(keys)
            return {
              ...item,
              dispute: {
                ...item.dispute,
                customer_evidence_urls: Array.isArray(presignedUrls)
                  ? presignedUrls
                  : [presignedUrls],
              },
            }
          } catch (error) {
            console.error('Error generating presigned URLs for evidence:', error)
            return item // Return original if presigning fails
          }
        }
        return item
      }),
    )

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(weight_disputes)
      .where(conditions.length ? and(...conditions) : undefined)

    res.json({
      disputes: disputesWithPresignedUrls,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        totalPages: Math.ceil(Number(count) / Number(limit)),
      },
    })
  } catch (error) {
    console.error('Error fetching admin disputes:', error)
    res.status(500).json({ error: 'Failed to fetch disputes' })
  }
}

/**
 * Approve dispute (admin action)
 */
export async function approveDispute(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { adminComment, adjustWeight, adjustCharge } = req.body

    const [dispute] = await db.select().from(weight_disputes).where(eq(weight_disputes.id, id))

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' })
    }
    if (!['open', 'under_review'].includes(dispute.status || '')) {
      return res.status(400).json({ error: `Dispute cannot be approved from status ${dispute.status}` })
    }

    const [currentDiscrepancy] = await db
      .select()
      .from(weight_discrepancies)
      .where(eq(weight_discrepancies.id, dispute.discrepancy_id))

    if (!currentDiscrepancy) {
      return res.status(404).json({ error: 'Linked discrepancy not found' })
    }

    // Update dispute
    const [updatedDispute] = await db
      .update(weight_disputes)
      .set({
        status: 'approved',
        admin_response: adminComment,
        reviewed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(weight_disputes.id, id))
      .returning()

    // Update discrepancy
    const updates: any = {
      status: 'resolved',
      resolution_notes: `Dispute approved. ${adminComment || ''}`,
      resolved_at: new Date(),
      updated_at: new Date(),
    }

    if (adjustWeight !== undefined) {
      updates.charged_weight = adjustWeight.toString()
    }
    if (adjustCharge !== undefined) {
      updates.revised_shipping_charge = adjustCharge.toString()
    }

    const [updatedDiscrepancy] = await db
      .update(weight_discrepancies)
      .set(updates)
      .where(eq(weight_discrepancies.id, dispute.discrepancy_id))
      .returning()

    // If customer was already debited for this discrepancy, refund on approval.
    const additionalCharge = Number(currentDiscrepancy.additional_charge || 0)
    if (additionalCharge > 0) {
      const [userWallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, dispute.user_id))
        .limit(1)

      if (userWallet) {
        const [existingRefund] = await db
          .select()
          .from(walletTransactions)
          .where(
            and(
              eq(walletTransactions.wallet_id, userWallet.id),
              eq(walletTransactions.type, 'credit'),
              eq(walletTransactions.ref, `dispute_approved_refund_${dispute.id}`),
            ),
          )
          .limit(1)

        if (!existingRefund) {
          const [chargeDebit] = await db
            .select()
            .from(walletTransactions)
            .where(
              and(
                eq(walletTransactions.wallet_id, userWallet.id),
                eq(walletTransactions.type, 'debit'),
                or(
                  eq(walletTransactions.ref, `weight_discrepancy_${dispute.discrepancy_id}`),
                  eq(walletTransactions.ref, `dispute_rejected_${dispute.id}`),
                ),
              ),
            )
            .limit(1)

          if (chargeDebit) {
            await createWalletTransaction({
              walletId: userWallet.id,
              amount: additionalCharge,
              type: 'credit',
              reason: `Weight discrepancy refund - Dispute approved for order ${currentDiscrepancy.order_number}`,
              ref: `dispute_approved_refund_${dispute.id}`,
              meta: {
                dispute_id: dispute.id,
                discrepancy_id: updatedDiscrepancy.id,
                order_number: currentDiscrepancy.order_number,
                admin_comment: adminComment,
              },
            })
          }
        }
      }
    }

    // Create history entry
    await db.insert(weight_adjustment_history).values({
      discrepancy_id: dispute.discrepancy_id,
      action_type: 'dispute_resolved',
      reason: 'Dispute approved by admin',
      notes: adminComment,
      changed_by_type: 'admin',
      source: 'admin_panel',
      created_at: new Date(),
    })

    // Send email to customer
    const [user] = await db.select().from(users).where(eq(users.id, dispute.user_id)).limit(1)
    if (user?.email) {
      const [discrepancy] = await db
        .select()
        .from(weight_discrepancies)
        .where(eq(weight_discrepancies.id, dispute.discrepancy_id))
        .limit(1)

      sendDisputeUpdateEmail(
        user.email,
        user.email || 'User',
        discrepancy?.order_number || '',
        'approved',
        adminComment,
      ).catch((err) => console.error('Failed to send dispute update email:', err))
    }

    res.json({ dispute: updatedDispute, discrepancy: updatedDiscrepancy })
  } catch (error) {
    console.error('Error approving dispute:', error)
    res.status(500).json({ error: 'Failed to approve dispute' })
  }
}

/**
 * Reject dispute (admin action)
 */
export async function rejectDispute(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { adminComment } = req.body

    const [dispute] = await db.select().from(weight_disputes).where(eq(weight_disputes.id, id))

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' })
    }
    if (!['open', 'under_review'].includes(dispute.status || '')) {
      return res.status(400).json({ error: `Dispute cannot be rejected from status ${dispute.status}` })
    }

    // Update dispute
    const [updatedDispute] = await db
      .update(weight_disputes)
      .set({
        status: 'rejected',
        admin_response: adminComment,
        reviewed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(weight_disputes.id, id))
      .returning()

    // Update discrepancy to resolved (dispute rejected - courier weight is confirmed correct)
    const [updatedDiscrepancy] = await db
      .update(weight_discrepancies)
      .set({
        status: 'resolved',
        resolution_notes: `Dispute rejected - Courier weight confirmed correct. Admin response: ${
          adminComment || ''
        }`,
        resolved_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(weight_discrepancies.id, dispute.discrepancy_id))
      .returning()

    // Debit wallet for the additional charge (dispute rejected = customer must pay)
    const additionalCharge = Number(updatedDiscrepancy.additional_charge || 0)
    if (additionalCharge > 0) {
      const [userWallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, dispute.user_id))
        .limit(1)

      if (userWallet) {
        await createWalletTransaction({
          walletId: userWallet.id,
          amount: additionalCharge,
          type: 'debit',
          reason: `Weight discrepancy charge - Dispute rejected for order ${updatedDiscrepancy.order_number}`,
          ref: `dispute_rejected_${dispute.id}`,
          meta: {
            dispute_id: dispute.id,
            discrepancy_id: updatedDiscrepancy.id,
            order_number: updatedDiscrepancy.order_number,
            weight_difference: updatedDiscrepancy.weight_difference,
            admin_comment: adminComment,
          },
        })
      }
    }

    // Create history entry
    await db.insert(weight_adjustment_history).values({
      discrepancy_id: dispute.discrepancy_id,
      action_type: 'dispute_resolved',
      reason: 'Dispute rejected by admin',
      notes: adminComment,
      changed_by_type: 'admin',
      source: 'admin_panel',
      created_at: new Date(),
    })

    // Send email to customer
    const [user] = await db.select().from(users).where(eq(users.id, dispute.user_id)).limit(1)
    if (user?.email) {
      const [discrepancy] = await db
        .select()
        .from(weight_discrepancies)
        .where(eq(weight_discrepancies.id, dispute.discrepancy_id))
        .limit(1)

      sendDisputeUpdateEmail(
        user.email,
        user.email || 'User',
        discrepancy?.order_number || '',
        'rejected',
        adminComment,
      ).catch((err) => console.error('Failed to send dispute update email:', err))
    }

    res.json({ dispute: updatedDispute, discrepancy: updatedDiscrepancy })
  } catch (error) {
    console.error('Error rejecting dispute:', error)
    res.status(500).json({ error: 'Failed to reject dispute' })
  }
}

/**
 * Get admin weight reconciliation dashboard stats
 */
export async function getAdminWeightStats(req: Request, res: Response) {
  try {
    const { fromDate, toDate } = req.query

    const conditions: any[] = []
    if (fromDate)
      conditions.push(gte(weight_discrepancies.created_at, new Date(fromDate as string)))
    if (toDate) conditions.push(lte(weight_discrepancies.created_at, new Date(toDate as string)))

    // Total discrepancies by status
    const statusStats = await db
      .select({
        status: weight_discrepancies.status,
        count: sql<number>`count(*)`,
        totalAdditionalCharge: sql<number>`COALESCE(SUM(CAST(${weight_discrepancies.additional_charge} AS NUMERIC)), 0)`,
      })
      .from(weight_discrepancies)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(weight_discrepancies.status)

    // Total disputes by status
    const disputeStats = await db
      .select({
        status: weight_disputes.status,
        count: sql<number>`count(*)`,
      })
      .from(weight_disputes)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(weight_disputes.status)

    // Top couriers with most discrepancies
    const courierStats = await db
      .select({
        courier: weight_discrepancies.courier_partner,
        count: sql<number>`count(*)`,
        avgWeightDifference: sql<number>`AVG(CAST(${weight_discrepancies.weight_difference} AS NUMERIC))`,
      })
      .from(weight_discrepancies)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(weight_discrepancies.courier_partner)
      .orderBy(desc(sql`count(*)`))
      .limit(10)

    // Recent large discrepancies
    const largeDiscrepancies = await db
      .select({
        discrepancy: weight_discrepancies,
        user: {
          id: users.id,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(weight_discrepancies)
      .leftJoin(users, eq(users.id, weight_discrepancies.user_id))
      .where(
        and(
          conditions.length ? and(...conditions) : undefined,
          or(
            gte(weight_discrepancies.weight_difference, '0.5'),
            lte(weight_discrepancies.weight_difference, '-0.5'),
          ),
        ),
      )
      .orderBy(desc(weight_discrepancies.created_at))
      .limit(20)

    res.json({
      statusStats,
      disputeStats,
      courierStats,
      largeDiscrepancies,
    })
  } catch (error) {
    console.error('Error fetching admin weight stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
