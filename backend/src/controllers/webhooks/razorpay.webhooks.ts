import { Request, Response } from 'express'
import { markBankRejected, markBankVerified } from '../../models/services/bankAccount.service'
import { confirmFailure, confirmSuccess } from '../../models/services/walletTopupService'
import { isValidSig } from '../../utils/razorpay'

const getRawBody = (req: Request) => {
  if (Buffer.isBuffer(req.body)) return req.body
  const rawBody = (req as any).rawBody
  if (Buffer.isBuffer(rawBody)) return rawBody
  if (typeof rawBody === 'string') return Buffer.from(rawBody, 'utf8')
  return Buffer.from(JSON.stringify(req.body || {}), 'utf8')
}

export const razorpayWebhook = async (req: Request, res: Response): Promise<any> => {
  const timestamp = new Date().toISOString()
  const signature = req.headers['x-razorpay-signature'] as string | undefined
  const rawBody = getRawBody(req)

  if (!isValidSig(rawBody, signature)) {
    console.error(`[${timestamp}] Razorpay webhook rejected: invalid signature`)
    return res.status(400).send('Invalid signature')
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch (error) {
    console.error(`[${timestamp}] Razorpay webhook rejected: invalid JSON payload`)
    return res.status(400).send('Invalid JSON')
  }

  const event = payload?.event
  const payment = payload?.payload?.payment?.entity
  const validation = payload?.payload?.fund_account_validation?.entity

  console.log('[Razorpay webhook]', {
    timestamp,
    event: event || 'unknown',
    paymentId: payment?.id || null,
    orderId: payment?.order_id || null,
    fundAccountValidationId: validation?.id || null,
    signaturePresent: Boolean(signature),
  })

  try {
    switch (event) {
      case 'payment.captured': {
        if (!payment?.order_id || !payment?.id || !payment?.amount) {
          return res.status(400).send('Invalid payment payload')
        }

        await confirmSuccess(payment.order_id, payment.id, Number(payment.amount))
        break
      }

      case 'payment.failed': {
        if (!payment?.order_id) {
          return res.status(400).send('Invalid payment payload')
        }

        await confirmFailure(
          payment.order_id,
          payment.id || null,
          payment.error_description || payment.error_reason || 'Payment failed',
        )
        break
      }

      case 'fund.account.validation.completed': {
        if (!validation?.fund_account_id) {
          return res.status(400).send('Invalid validation payload')
        }

        if (validation.status === 'success') {
          await markBankVerified(validation.fund_account_id)
        } else {
          const reason =
            validation.results?.reason_description ||
            validation.results?.reason ||
            'Bank account validation failed'
          await markBankRejected(validation.fund_account_id, reason)
        }
        break
      }

      default:
        console.warn(`[Razorpay webhook] Unhandled event: ${event || 'unknown'}`)
    }

    return res.json({ received: true })
  } catch (error: any) {
    console.error('[Razorpay webhook] Handler error', {
      timestamp,
      event: event || 'unknown',
      message: error?.message || String(error),
      stack: error?.stack,
    })
    return res.status(500).json({ error: 'Internal webhook handler error' })
  }
}
