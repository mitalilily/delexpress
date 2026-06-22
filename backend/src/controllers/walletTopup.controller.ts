import { Request, Response } from 'express'
import { createWalletOrder, markTopupProcessing } from '../models/services/walletTopupService'
import { getPaymentOptions } from '../models/services/paymentOptions.service'
import { verifyRazorpayCheckoutSignature } from '../utils/razorpay'

export const createTopup = async (req: Request, res: Response): Promise<any> => {
  const amt = Number(req.body.amount)
  const { name, email, phone } = req.body

  if (!amt || amt <= 0) {
    return res.status(400).json({ error: 'Invalid amount' })
  }
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing customer details' })
  }

  try {
    // Enforce minimum wallet recharge amount (if configured)
    const paymentSettings = await getPaymentOptions()
    const minWalletRecharge = paymentSettings.minWalletRecharge ?? 0

    if (minWalletRecharge > 0 && amt < minWalletRecharge) {
      return res.status(400).json({
        error: `Minimum wallet recharge amount is ₹${minWalletRecharge}`,
        minWalletRecharge,
      })
    }

    const userId = (req as any).user?.sub
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Razorpay order creation
    const data = await createWalletOrder(userId, amt, { name, email, phone })

    // returns { orderId, amount, currency, key, name, description, prefill, theme }
    res.status(201).json(data)
  } catch (err: any) {
    console.error('Razorpay top-up error:', err)
    res.status(500).json({ error: err?.message || 'Top-up failed' })
  }
}

export const confirmFromClient = async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body || {}

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ ok: false, error: 'Missing payment confirmation details' })
  }

  const isValidSignature = verifyRazorpayCheckoutSignature({ orderId, paymentId, signature })
  if (!isValidSignature) {
    return res.status(400).json({ ok: false, error: 'Invalid payment signature' })
  }

  await markTopupProcessing(orderId, paymentId)
  res.json({
    ok: true,
    message: 'Payment verified. Wallet balance will update after Razorpay webhook capture.',
  })
}
