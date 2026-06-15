import crypto from 'crypto'
import { Request } from 'express'

export const DEFAULT_EXPRESSOPRO_WEBHOOK_SECRET = 'expresoprosecret'

export const normalizeWebhookSecret = (value?: string | null) => String(value || '').trim()

export const getWebhookHeaderValue = (
  headers: Request['headers'],
  candidates: string[],
) => {
  const normalized = headers as Record<string, string | string[] | undefined>
  for (const header of candidates) {
    const value = normalized[header] || normalized[header.toLowerCase()]
    if (!value) continue
    if (Array.isArray(value) && value.length) return String(value[0]).trim()
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

export const verifyWebhookSecret = ({
  configuredSecret,
  receivedSecret,
  rawBody,
}: {
  configuredSecret: string
  receivedSecret: string
  rawBody?: string
}) => {
  const expectedSecret = normalizeWebhookSecret(configuredSecret)
  if (!expectedSecret) return false

  const normalizedReceived = normalizeWebhookSecret(receivedSecret).replace(/^Bearer\s+/i, '')
  if (!normalizedReceived) return false

  if (normalizedReceived === expectedSecret) return true

  if (!rawBody) return false

  const expectedHmac =
    'sha256=' + crypto.createHmac('sha256', expectedSecret).update(rawBody).digest('hex')
  const candidateValues = [
    normalizedReceived,
    normalizedReceived.startsWith('sha256=') ? normalizedReceived : `sha256=${normalizedReceived}`,
  ]

  return candidateValues.some((value) => {
    const expectedBuf = Buffer.from(expectedHmac)
    const providedBuf = Buffer.from(value)
    return expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)
  })
}
