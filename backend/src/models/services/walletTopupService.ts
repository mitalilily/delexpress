import { and, eq, or } from 'drizzle-orm'
import { isRazorpayConfigured, razorpay, razorpayKeyId } from '../../utils/razorpay'
import { db } from '../client'
import { wallets, walletTopups } from '../schema/wallet'
import { createWalletTransaction } from './wallet.service'

export async function walletOfUser(userId: string, tx: any = db) {
  const existingWallet = await tx?.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  })

  if (existingWallet) return existingWallet

  await tx
    .insert(wallets)
    .values({
      userId,
      balance: '0.00',
      currency: 'INR',
    })
    .onConflictDoNothing({ target: wallets.userId })

  const createdWallet = await tx?.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  })

  if (!createdWallet) throw new Error('Wallet not found')
  return createdWallet
}

export async function createWalletOrder(
  userId: string,
  amount: number,
  details: { name: string; email: string; phone: string },
) {
  if (!isRazorpayConfigured) {
    throw new Error('Razorpay credentials are not configured')
  }

  const wallet = await walletOfUser(userId)
  const receipt = `wallet_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: wallet.currency ?? 'INR',
    receipt,
    notes: {
      userId,
      walletId: wallet.id,
      type: 'wallet_recharge',
    },
  })

  await db.insert(walletTopups).values({
    walletId: wallet.id,
    amount,
    currency: wallet.currency ?? 'INR',
    gatewayOrderId: razorpayOrder.id,
    status: 'created',
  })

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: razorpayKeyId,
    name: 'ExpressoPro',
    description: 'Wallet Recharge',
    prefill: {
      name: details.name,
      email: details.email,
      contact: details.phone,
    },
    theme: {
      color: '#4b8e40',
    },
  }
}

export async function confirmSuccess(orderId: string, paymentId: string, paise: number) {
  const gatewayAmount = paise / 100

  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(walletTopups)
      .set({
        status: 'success',
        gatewayPaymentId: paymentId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(walletTopups.gatewayOrderId, orderId),
          or(eq(walletTopups.status, 'created'), eq(walletTopups.status, 'processing')),
        ),
      )
      .returning()

    if (!row) {
      console.error('Topup not found or already processed for order:', orderId)
      return
    }

    await createWalletTransaction({
      walletId: row.walletId,
      amount: Number(row.amount || gatewayAmount),
      currency: row.currency ?? 'INR',
      type: 'credit',
      ref: paymentId,
      reason: 'Wallet Recharge',
      meta: { orderId, gateway: 'razorpay', gatewayAmount },
      tx: tx as any,
    })
  })
}

export async function confirmFailure(orderId: string, paymentId: string | null, reason: string) {
  await db
    .update(walletTopups)
    .set({
      status: 'failed',
      gatewayPaymentId: paymentId,
      meta: { reason },
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(walletTopups.gatewayOrderId, orderId),
        or(eq(walletTopups.status, 'created'), eq(walletTopups.status, 'processing')),
      ),
    )
}

export async function markTopupProcessing(orderId: string, paymentId: string) {
  await db
    .update(walletTopups)
    .set({
      status: 'processing',
      gatewayPaymentId: paymentId,
      updatedAt: new Date(),
    })
    .where(and(eq(walletTopups.gatewayOrderId, orderId), eq(walletTopups.status, 'created')))
}
