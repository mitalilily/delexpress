import axios from 'axios'
import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'
import Razorpay from 'razorpay'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

type RazorpayMode = 'test' | 'live'

const resolveMode = (): RazorpayMode => {
  const configuredMode = String(process.env.RAZORPAY_MODE || '').trim().toLowerCase()
  if (configuredMode === 'test' || configuredMode === 'live') return configuredMode
  return process.env.NODE_ENV === 'production' ? 'live' : 'test'
}

const fromEnv = (key: string) => String(process.env[key] || '').trim()

export const razorpayMode = resolveMode()

const credentialsByMode: Record<RazorpayMode, { key_id: string; key_secret: string }> = {
  test: {
    key_id: fromEnv('RAZORPAY_KEY_ID'),
    key_secret: fromEnv('RAZORPAY_KEY_SECRET'),
  },
  live: {
    key_id: fromEnv('RAZORPAY_KEY_ID_PROD'),
    key_secret: fromEnv('RAZORPAY_KEY_SECRET_PROD'),
  },
}

const activeCredentials = credentialsByMode[razorpayMode]

export const isRazorpayConfigured = Boolean(
  activeCredentials.key_id && activeCredentials.key_secret,
)
export const razorpayKeyId = activeCredentials.key_id

const maskCredential = (value: string) =>
  value ? `${value.slice(0, 4)}...${value.slice(-4)}` : 'missing'

if (!isRazorpayConfigured) {
  console.warn(
    `[Razorpay] Missing credentials for ${razorpayMode.toUpperCase()} mode. Wallet topups are disabled until env vars are set.`,
  )
}

export const razorpay = new Razorpay({
  key_id: activeCredentials.key_id || 'disabled',
  key_secret: activeCredentials.key_secret || 'disabled',
})

if (isRazorpayConfigured) {
  console.info(
    `[Razorpay] Initialised in ${razorpayMode.toUpperCase()} mode with key ${maskCredential(
      activeCredentials.key_id,
    )}`,
  )
}

export const razorpayApi = axios.create({
  baseURL: 'https://api.razorpay.com/v1',
  auth: {
    username: activeCredentials.key_id || 'disabled',
    password: activeCredentials.key_secret || 'disabled',
  },
})

const getWebhookSecret = () =>
  razorpayMode === 'live'
    ? fromEnv('RAZORPAY_WEBHOOK_SECRET_PROD')
    : fromEnv('RAZORPAY_WEBHOOK_SECRET')

const safeCompare = (expected: string, actual: string) => {
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(actual)

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  )
}

export function isValidSig(body: string | Buffer, sig?: string) {
  const webhookSecret = getWebhookSecret()
  if (!webhookSecret || !sig) return false

  const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')
  return safeCompare(expected, sig)
}

export function verifyRazorpayCheckoutSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string
  paymentId: string
  signature: string
}) {
  if (!activeCredentials.key_secret || !orderId || !paymentId || !signature) return false

  const expected = crypto
    .createHmac('sha256', activeCredentials.key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return safeCompare(expected, signature)
}
