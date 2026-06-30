import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { billingInvoices, invoiceCodOffsets } from '../../schema/schema'
import { isRazorpayConfigured, razorpayApi } from '../../utils/razorpay'
import { db } from '../client'
import { bankAccounts } from '../schema/bankAccounts'
import { codRemittances } from '../schema/codRemittance'
import { getInvoiceStatement } from './invoiceStatement.service'

const DEFAULT_RAZORPAY_PAYOUT_MODE = 'IMPS'
export const COD_REMITTANCE_TYPE = 'cod'
export const CANCELLATION_REMITTANCE_TYPE = 'cancellation'

export type CodRemittanceType = typeof COD_REMITTANCE_TYPE | typeof CANCELLATION_REMITTANCE_TYPE

const toRazorpayPaise = (amount: number) => Math.round(amount * 100)

const formatRazorpayError = (error: any) => {
  const responseError = error?.response?.data?.error
  const description = responseError?.description || responseError?.reason || responseError?.code
  return description || error?.message || 'Razorpay payout failed'
}

const findPayoutBankAccount = async (userId: string, tx: any) => {
  const accounts = await tx
    .select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.status, 'verified')))

  return (
    accounts.find((account: any) => account.isPrimary && account.fundAccountId) ||
    accounts.find((account: any) => account.fundAccountId) ||
    accounts.find((account: any) => account.isPrimary) ||
    accounts[0] ||
    null
  )
}

const createRazorpayFundAccount = async (account: any) => {
  if (!account?.accountHolder || !account?.accountNumber || !account?.ifsc) {
    throw new Error('Verified bank account is missing account holder, account number, or IFSC')
  }

  const { data: contact } = await razorpayApi.post('/contacts', {
    name: account.accountHolder,
    type: 'customer',
    notes: {
      userId: account.userId,
      bankAccountId: account.id,
      purpose: 'COD remittance payout',
    },
  })

  const { data: fundAccount } = await razorpayApi.post('/fund_accounts', {
    contact_id: contact.id,
    account_type: 'bank_account',
    bank_account: {
      name: account.accountHolder,
      ifsc: account.ifsc,
      account_number: account.accountNumber,
    },
  })

  return fundAccount.id as string
}

const ensureRazorpayFundAccount = async (account: any, tx: any) => {
  if (account?.fundAccountId) return account.fundAccountId as string

  const fundAccountId = await createRazorpayFundAccount(account)
  await tx.update(bankAccounts).set({ fundAccountId }).where(eq(bankAccounts.id, account.id))

  return fundAccountId
}

const createCodRazorpayPayout = async ({
  remittance,
  amount,
  utrNumber,
  creditedBy,
  tx,
}: {
  remittance: any
  amount: number
  utrNumber?: string
  creditedBy?: string
  tx: any
}) => {
  if (!isRazorpayConfigured) {
    throw new Error('Razorpay is not configured for COD remittance payouts')
  }

  const sourceAccount = String(process.env.RAZORPAY_SOURCE_ACC || '').trim()
  if (!sourceAccount) {
    throw new Error('RAZORPAY_SOURCE_ACC is not configured for COD remittance payouts')
  }

  const bankAccount = await findPayoutBankAccount(remittance.userId, tx)
  if (!bankAccount) {
    throw new Error('Seller needs a verified bank account before COD remittance can be paid out')
  }

  const fundAccountId = await ensureRazorpayFundAccount(bankAccount, tx)
  const payoutMode = String(process.env.RAZORPAY_COD_PAYOUT_MODE || DEFAULT_RAZORPAY_PAYOUT_MODE)
    .trim()
    .toUpperCase()

  try {
    const payoutPurpose =
      remittance.remittanceType === CANCELLATION_REMITTANCE_TYPE
        ? 'Cancellation refund payout'
        : 'COD remittance payout'
    const referencePrefix =
      remittance.remittanceType === CANCELLATION_REMITTANCE_TYPE ? 'cancel' : 'cod'
    const narrationPrefix =
      remittance.remittanceType === CANCELLATION_REMITTANCE_TYPE ? 'CANCEL' : 'COD'

    const { data } = await razorpayApi.post('/payouts', {
      account_number: sourceAccount,
      fund_account_id: fundAccountId,
      amount: toRazorpayPaise(amount),
      currency: 'INR',
      mode: payoutMode,
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: `${referencePrefix}_${remittance.id}`,
      narration: `${narrationPrefix} ${remittance.orderNumber}`.slice(0, 30),
      notes: {
        remittanceId: remittance.id,
        orderId: remittance.orderId,
        orderNumber: remittance.orderNumber,
        remittanceType: remittance.remittanceType || COD_REMITTANCE_TYPE,
        courierPartner: remittance.courierPartner || 'Unknown',
        utrNumber: utrNumber || '',
        creditedBy: creditedBy || 'system',
        purpose: payoutPurpose,
      },
    })

    return {
      id: data.id as string,
      status: data.status as string,
      utr: (data.utr as string | undefined) || null,
      fundAccountId,
      mode: payoutMode,
    }
  } catch (error: any) {
    throw new Error(formatRazorpayError(error))
  }
}

type CodRemittancePayoutParams = {
  remittanceId: string
  settledDate?: Date
  utrNumber?: string
  settledAmount?: number
  notes?: string
  creditedBy?: string
}

/**
 * Create a COD remittance entry when an order is delivered with COD
 * DOES NOT automatically credit the panel wallet - waits for actual courier settlement
 * Real-world flow: Order delivered → Create pending remittance → Wait for courier to settle
 */
export async function createCodRemittance(params: {
  orderId: string
  orderType: 'b2c' | 'b2b'
  userId: string
  orderNumber: string
  awbNumber?: string
  courierPartner?: string
  codAmount: number
  codCharges: number
  freightCharges: number
  collectedAt?: Date
}): Promise<{ remittance: any; created: boolean }> {
  const {
    orderId,
    orderType,
    userId,
    orderNumber,
    awbNumber,
    courierPartner,
    codAmount,
    codCharges,
    freightCharges,
    collectedAt,
  } = params

  // COD remittance should default to full COD payable.
  // Sellers already recharge wallet separately, so we do not auto-deduct platform charges here.
  const normalizedFreightCharges = 0
  const normalizedCodCharges = 0
  const deductions = 0
  const remittableAmount = Number(codAmount)

  // Idempotency guard: delivered webhooks can be retried.
  const [existingRemittance] = await db
    .select()
    .from(codRemittances)
    .where(
      and(
        eq(codRemittances.userId, userId),
        eq(codRemittances.orderId, orderId),
        eq(codRemittances.orderType, orderType),
        eq(codRemittances.remittanceType, COD_REMITTANCE_TYPE),
      ),
    )
    .limit(1)

  if (existingRemittance) {
    console.log(
      `ℹ️ COD remittance already exists for order ${orderNumber} (status: ${existingRemittance.status})`,
    )
    return { remittance: existingRemittance, created: false }
  }

  // Create remittance entry with PENDING status
  const [remittance] = await db
    .insert(codRemittances)
    .values({
      userId,
      orderId,
      orderType,
      orderNumber,
      awbNumber: awbNumber || null,
      remittanceType: COD_REMITTANCE_TYPE,
      courierPartner: courierPartner || null,
      codAmount: codAmount.toString(),
      codCharges: normalizedCodCharges.toString(),
      // Legacy column name retained for compatibility; defaulted to zero for COD remittance flow.
      shippingCharges: normalizedFreightCharges.toString(),
      deductions: deductions.toString(),
      remittableAmount: remittableAmount.toString(),
      status: 'pending', // ✅ PENDING - waiting for courier settlement
      collectedAt: collectedAt || new Date(),
      notes: `COD collected by ${
        courierPartner || 'courier'
      }. No deduction applied by default. Awaiting settlement from courier partner.`,
    })
    .returning()

  console.log(
    `📦 COD Remittance created (PENDING): ₹${remittableAmount} for order ${orderNumber}. Waiting for courier settlement.`,
  )

  return { remittance, created: true }
}

export async function createCancellationRemittance(params: {
  orderId: string
  orderType: 'b2c' | 'b2b'
  userId: string
  orderNumber: string
  awbNumber?: string | null
  courierPartner?: string | null
  refundAmount: number
  source: string
  queuedAt?: Date
  notes?: string
  tx?: any
}): Promise<{ remittance: any; created: boolean }> {
  const {
    orderId,
    orderType,
    userId,
    orderNumber,
    awbNumber,
    courierPartner,
    refundAmount,
    source,
    queuedAt,
    notes,
    tx,
  } = params

  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    throw new Error('Cancellation refund amount must be greater than 0.')
  }

  const executor = tx ?? db

  const [existingRemittance] = await executor
    .select()
    .from(codRemittances)
    .where(
      and(
        eq(codRemittances.userId, userId),
        eq(codRemittances.orderId, orderId),
        eq(codRemittances.orderType, orderType),
        eq(codRemittances.remittanceType, CANCELLATION_REMITTANCE_TYPE),
      ),
    )
    .limit(1)

  if (existingRemittance) {
    console.log(
      `ℹ️ Cancellation refund remittance already exists for order ${orderNumber} (status: ${existingRemittance.status})`,
    )
    return { remittance: existingRemittance, created: false }
  }

  const queueNote =
    notes ||
    `Cancellation refund queued from ${source}. Pay the seller only after the courier reverses this cancellation amount back to the platform.`

  const [remittance] = await executor
    .insert(codRemittances)
    .values({
      userId,
      orderId,
      orderType,
      orderNumber,
      awbNumber: awbNumber || null,
      remittanceType: CANCELLATION_REMITTANCE_TYPE,
      courierPartner: courierPartner || null,
      codAmount: refundAmount.toString(),
      codCharges: '0',
      shippingCharges: '0',
      deductions: '0',
      remittableAmount: refundAmount.toString(),
      status: 'pending',
      collectedAt: queuedAt || new Date(),
      notes: queueNote,
    })
    .returning()

  console.log(
    `📦 Cancellation refund remittance created (PENDING): ₹${refundAmount} for order ${orderNumber}. Awaiting courier reversal before payout.`,
  )

  return { remittance, created: true }
}

/**
 * Pay seller through Razorpay when courier actually settles the payment.
 */
export async function initiateCodRemittancePayout(params: CodRemittancePayoutParams) {
  const { remittanceId, settledDate, utrNumber, settledAmount, notes, creditedBy } = params

  return await db
    .transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${remittanceId}))`)

      // 1. Get the remittance
      const [remittance] = await tx
        .select()
        .from(codRemittances)
        .where(eq(codRemittances.id, remittanceId))

      if (!remittance) {
        throw new Error(`Remittance not found: ${remittanceId}`)
      }

      if (remittance.status === 'credited') {
        throw new Error(`Remittance already credited: ${remittance.orderNumber}`)
      }

      // 2. Determine amount to settle (use settled amount if different from original)
      const amountToCredit =
        settledAmount !== undefined ? Number(settledAmount) : Number(remittance.remittableAmount)

      if (!Number.isFinite(amountToCredit) || amountToCredit <= 0) {
        throw new Error('Invalid settled amount. Amount to credit must be greater than 0.')
      }

      // 3. Send COD settlement to the seller's Razorpay fund account.
      const payout = await createCodRazorpayPayout({
        remittance,
        amount: amountToCredit,
        utrNumber,
        creditedBy,
        tx,
      })

      // 4. Update remittance status to credited
      const adminNote = creditedBy
        ? `Razorpay payout initiated by admin (ID: ${creditedBy}). `
        : 'Razorpay payout initiated via settlement reconciliation. '
      const payoutNote = `Razorpay payout: ${payout.id} (${payout.status}); Fund account: ${payout.fundAccountId}; Mode: ${payout.mode}`
      const fullNotes = `${adminNote}${notes || ''} ${utrNumber ? `UTR: ${utrNumber}` : ''} ${payoutNote}`

      const [updatedRemittance] = await tx
        .update(codRemittances)
        .set({
          // Persist the actual payout amount so admin summaries and exports reflect what was paid.
          remittableAmount: amountToCredit.toString(),
          status: 'credited',
          creditedAt: settledDate || new Date(),
          walletTransactionId: null,
          notes: fullNotes.trim(),
          updatedAt: new Date(),
        })
        .where(eq(codRemittances.id, remittance.id))
        .returning()

      // 5. Auto-create COD offsets for pending invoices (optional automation)
      let autoOffsetInvoiceId: string | null = null
      if (remittance.remittanceType !== CANCELLATION_REMITTANCE_TYPE) {
        try {
        const pendingInvoices = await tx
          .select()
          .from(billingInvoices)
          .where(
            and(
              eq(billingInvoices.sellerId, remittance.userId),
              eq(billingInvoices.status, 'pending' as any),
            ),
          )
          .orderBy(billingInvoices.createdAt) // oldest first

        // Check if any offset already exists for this remittance
        const [existingOffset] = await tx
          .select()
          .from(invoiceCodOffsets)
          .where(eq(invoiceCodOffsets.codRemittanceId, remittance.id))
          .limit(1)

        if (!existingOffset && pendingInvoices.length > 0) {
          // Auto-apply to oldest pending invoice
          const targetInvoice = pendingInvoices[0]
          await tx.insert(invoiceCodOffsets).values({
            invoiceId: targetInvoice.id,
            sellerId: remittance.userId,
            codRemittanceId: remittance.id,
            amount: amountToCredit.toString(),
          })
          autoOffsetInvoiceId = targetInvoice.id
          console.log(
            `💰 Auto-created COD offset: ₹${amountToCredit} for invoice ${targetInvoice.invoiceNo}`,
          )
        }
        } catch (offsetErr) {
          // Don't fail the credit transaction if offset creation fails
          console.error('Failed to auto-create COD offset:', offsetErr)
        }
      }

      console.log(
        `${remittance.remittanceType === CANCELLATION_REMITTANCE_TYPE ? 'Cancellation refund' : 'COD remittance'} sent via Razorpay payout ${payout.id}: Rs ${amountToCredit} for order ${remittance.orderNumber}`,
      )

      return {
        updatedRemittance: {
          ...updatedRemittance,
          razorpayPayout: payout,
        },
        autoOffsetInvoiceId,
      }
    })
    .then(async (result) => {
      // After transaction commits, check if invoice should be auto-marked as paid
      if (result.autoOffsetInvoiceId) {
        try {
          const stmt = await getInvoiceStatement(result.autoOffsetInvoiceId)
          if (stmt.outstanding <= 0) {
            const [inv] = await db
              .select()
              .from(billingInvoices)
              .where(eq(billingInvoices.id, result.autoOffsetInvoiceId))
              .limit(1)
            if (inv && inv.status !== 'paid') {
              await db
                .update(billingInvoices)
                .set({ status: 'paid', updatedAt: new Date() })
                .where(eq(billingInvoices.id, result.autoOffsetInvoiceId))
              console.log(`✅ Auto-marked invoice ${inv.invoiceNo} as paid (outstanding = 0)`)
            }
          }
        } catch (err) {
          // Don't fail if auto-paid check fails
          console.error('Failed to auto-mark invoice as paid:', err)
        }
      }
      return result.updatedRemittance
    })
}

// Backward-compatible alias for older callers. This still initiates a payout and never credits wallet.
export const creditCodRemittanceToWallet = initiateCodRemittancePayout

/**
 * Get all COD remittances for a user with filters
 */
export async function getCodRemittances(
  userId: string,
  filters: {
    status?: string
    fromDate?: Date
    toDate?: Date
    page?: number
    limit?: number
    remittanceType?: CodRemittanceType
  } = {},
) {
  const {
    status,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    remittanceType = COD_REMITTANCE_TYPE,
  } = filters
  const offset = (page - 1) * limit

  const conditions = [
    eq(codRemittances.userId, userId),
    eq(codRemittances.remittanceType, remittanceType),
  ]

  if (status) {
    conditions.push(eq(codRemittances.status, status as any))
  }

  if (fromDate) {
    conditions.push(gte(codRemittances.collectedAt, fromDate))
  }

  if (toDate) {
    conditions.push(lte(codRemittances.collectedAt, toDate))
  }

  const remittances = await db
    .select()
    .from(codRemittances)
    .where(and(...conditions))
    .orderBy(desc(codRemittances.createdAt))
    .limit(limit)
    .offset(offset)

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(codRemittances)
    .where(and(...conditions))

  return {
    remittances,
    totalCount: Number(countResult?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult?.count || 0) / limit),
  }
}

/**
 * Get COD remittance statistics for a user
 */
export async function getCodRemittanceStats(userId: string) {
  // Total credited remittances (Remitted Till Date)
  const [creditedStats] = await db
    .select({
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${codRemittances.remittableAmount}), 0)`,
    })
    .from(codRemittances)
    .where(
      and(
        eq(codRemittances.userId, userId),
        eq(codRemittances.remittanceType, COD_REMITTANCE_TYPE),
        eq(codRemittances.status, 'credited'),
      ),
    )

  // Total pending remittances (Next Remittance/Total Due)
  const [pendingStats] = await db
    .select({
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${codRemittances.remittableAmount}), 0)`,
    })
    .from(codRemittances)
    .where(
      and(
        eq(codRemittances.userId, userId),
        eq(codRemittances.remittanceType, COD_REMITTANCE_TYPE),
        eq(codRemittances.status, 'pending'),
      ),
    )

  // Get last credited remittance
  const [lastRemittance] = await db
    .select()
    .from(codRemittances)
    .where(
      and(
        eq(codRemittances.userId, userId),
        eq(codRemittances.remittanceType, COD_REMITTANCE_TYPE),
        eq(codRemittances.status, 'credited'),
      ),
    )
    .orderBy(desc(codRemittances.creditedAt))
    .limit(1)

  return {
    remittedTillDate: Number(creditedStats?.totalAmount || 0),
    lastRemittance: lastRemittance ? Number(lastRemittance.remittableAmount) : 0,
    nextRemittance: Number(pendingStats?.totalAmount || 0),
    totalDue: Number(pendingStats?.totalAmount || 0),
    // Additional info
    creditedCount: Number(creditedStats?.count || 0),
    pendingCount: Number(pendingStats?.count || 0),
  }
}

/**
 * Update remittance notes (status is auto-managed)
 */
export async function updateCodRemittanceNotes(remittanceId: string, notes: string) {
  const [updated] = await db
    .update(codRemittances)
    .set({
      notes,
      updatedAt: new Date(),
    })
    .where(eq(codRemittances.id, remittanceId))
    .returning()

  return updated
}

/**
 * Get COD dashboard summary
 */
export async function getCodDashboardSummary(userId: string) {
  const stats = await getCodRemittanceStats(userId)

  // Get recent remittances
  const recentRemittances = await db
    .select()
    .from(codRemittances)
    .where(
      and(
        eq(codRemittances.userId, userId),
        eq(codRemittances.remittanceType, COD_REMITTANCE_TYPE),
      ),
    )
    .orderBy(desc(codRemittances.createdAt))
    .limit(10)

  return {
    stats,
    recentRemittances,
  }
}
