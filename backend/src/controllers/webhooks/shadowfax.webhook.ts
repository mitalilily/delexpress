import { Request, Response } from 'express'
import { and, eq, gte, isNull } from 'drizzle-orm'
import { db } from '../../models/client'
import { processShadowfaxWebhook } from '../../models/services/webhookProcessor'
import { pending_webhooks } from '../../schema/schema'
import {
  DEFAULT_EXPRESSOPRO_WEBHOOK_SECRET,
  getWebhookHeaderValue,
  verifyWebhookSecret,
} from './webhookSecret'

const SHADOWFAX_BASIC_AUTH_DEFAULTS = {
  staging: {
    username: 'expressopro-staging',
    password: 'expressopro-shadowfax-staging',
  },
  production: {
    username: 'expressopro-production',
    password: 'expressopro-shadowfax-production',
  },
  default: {
    username: 'expressopro',
    password: 'expressopro-shadowfax',
  },
} as const

const normalizeAuthValue = (value?: string | null) => String(value || '').trim()

const SHADOWFAX_WEBHOOK_SECRET_HEADERS = [
  'x-shadowfax-webhook-secret',
  'x-shadowfax-webhook-signature',
  'x-webhook-secret',
  'x-webhook-signature',
]

type ShadowfaxAuthMode = 'basic-auth' | 'shared-secret' | null

const resolveShadowfaxAuthConfig = (requestPath: string) => {
  const normalizedPath = requestPath.toLowerCase()

  if (normalizedPath.includes('/shadowfax/staging')) {
    return {
      ...SHADOWFAX_BASIC_AUTH_DEFAULTS.staging,
      username:
        normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_STAGING_USERNAME) ||
        normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_BASIC_AUTH_USERNAME) ||
        SHADOWFAX_BASIC_AUTH_DEFAULTS.staging.username,
      password:
        normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_STAGING_PASSWORD) ||
        normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_BASIC_AUTH_PASSWORD) ||
        SHADOWFAX_BASIC_AUTH_DEFAULTS.staging.password,
    }
  }

  if (normalizedPath.includes('/shadowfax/production')) {
    return {
      ...SHADOWFAX_BASIC_AUTH_DEFAULTS.production,
      username:
        normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_PRODUCTION_USERNAME) ||
        normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_BASIC_AUTH_USERNAME) ||
        SHADOWFAX_BASIC_AUTH_DEFAULTS.production.username,
      password:
        normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_PRODUCTION_PASSWORD) ||
        normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_BASIC_AUTH_PASSWORD) ||
        SHADOWFAX_BASIC_AUTH_DEFAULTS.production.password,
    }
  }

  return {
    ...SHADOWFAX_BASIC_AUTH_DEFAULTS.default,
    username:
      normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_BASIC_AUTH_USERNAME) ||
      SHADOWFAX_BASIC_AUTH_DEFAULTS.default.username,
    password:
      normalizeAuthValue(process.env.SHADOWFAX_WEBHOOK_BASIC_AUTH_PASSWORD) ||
      SHADOWFAX_BASIC_AUTH_DEFAULTS.default.password,
  }
}

const verifyShadowfaxBasicAuth = (authorizationHeader: string, requestPath: string) => {
  const normalizedAuthorization = normalizeAuthValue(authorizationHeader)
  if (!normalizedAuthorization.toLowerCase().startsWith('basic ')) {
    return { present: false, valid: false }
  }

  const encodedCredentials = normalizedAuthorization.slice(6).trim()
  if (!encodedCredentials) {
    return { present: true, valid: false }
  }

  let decodedCredentials = ''
  try {
    decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf8')
  } catch {
    return { present: true, valid: false }
  }

  const separatorIndex = decodedCredentials.indexOf(':')
  if (separatorIndex <= 0) {
    return { present: true, valid: false }
  }

  const username = decodedCredentials.slice(0, separatorIndex)
  const password = decodedCredentials.slice(separatorIndex + 1)
  const expected = resolveShadowfaxAuthConfig(requestPath)

  return {
    present: true,
    valid: username === expected.username && password === expected.password,
  }
}

const verifyShadowfaxWebhookCredentials = (
  req: Request,
  requestPath: string,
): { valid: boolean; authMode: ShadowfaxAuthMode } => {
  const authorizationHeader = String(req.headers.authorization || '').trim()
  const basicAuthCheck = verifyShadowfaxBasicAuth(authorizationHeader, requestPath)
  if (basicAuthCheck.present && basicAuthCheck.valid) {
    return { valid: true, authMode: 'basic-auth' }
  }

  const receivedSecret = getWebhookHeaderValue(req.headers, SHADOWFAX_WEBHOOK_SECRET_HEADERS)
  const rawBody = (req as any).rawBody || (req.body ? JSON.stringify(req.body) : '')
  const webhookSecret =
    String(process.env.SHADOWFAX_WEBHOOK_SECRET || '').trim() || DEFAULT_EXPRESSOPRO_WEBHOOK_SECRET

  if (
    verifyWebhookSecret({
      configuredSecret: webhookSecret,
      receivedSecret,
      rawBody,
    })
  ) {
    return { valid: true, authMode: 'shared-secret' }
  }

  return { valid: false, authMode: null }
}

const extractShadowfaxEventPayload = (payload: any) => {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  if (Array.isArray(payload?.data) && payload.data.length > 0) {
    return payload.data[0]
  }
  return payload
}

export const shadowfaxWebhookHandler = async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString()
  const payload = req.body
  const requestPath = req.originalUrl || req.path || ''
  const credentials = verifyShadowfaxWebhookCredentials(req, requestPath)

  if (!credentials.valid) {
    console.warn('Shadowfax webhook rejected: invalid credentials', {
      requestPath,
      hasAuthorization: Boolean(req.headers.authorization),
      hasSharedSecret: Boolean(
        getWebhookHeaderValue(req.headers, SHADOWFAX_WEBHOOK_SECRET_HEADERS),
      ),
    })
    return res.status(401).json({ success: false, message: 'invalid webhook credentials' })
  }

  const event = extractShadowfaxEventPayload(payload)
  const awb =
    event?.awb ||
    event?.awb_number ||
    event?.waybill ||
    event?.waybill_number ||
    event?.tracking_number ||
    event?.tracking_id ||
    null
  const statusId = event?.status_id || event?.statusId || event?.status_code || event?.status || 'unknown'

  console.log('='.repeat(80))
  console.log(`[${timestamp}] Shadowfax Webhook Received via ${credentials.authMode}`)
  console.log(`   AWB: ${awb || 'N/A'}`)
  console.log(`   Status ID: ${statusId}`)
  console.log(`   IP: ${req.ip || req.socket.remoteAddress || 'unknown'}`)
  console.log(`   Full Payload:`, JSON.stringify(payload, null, 2))
  console.log('='.repeat(80))

  try {
    const result = await processShadowfaxWebhook(payload)

    if (!result.success && result.reason === 'missing_awb') {
      return res.status(400).json({ success: false, message: 'Missing AWB/order reference' })
    }

    if (!result.success && result.reason === 'order_not_found') {
      const dedupeWindowStart = new Date(Date.now() - 10 * 60 * 1000)
      const [existingPending] = await db
        .select({ id: pending_webhooks.id })
        .from(pending_webhooks)
        .where(
          and(
            eq(pending_webhooks.awb_number, String(awb || 'unknown')),
            eq(pending_webhooks.status, `shadowfax:${String(statusId || 'unknown')}`),
            isNull(pending_webhooks.processed_at),
            gte(pending_webhooks.created_at, dedupeWindowStart),
          ),
        )
        .limit(1)

      if (!existingPending) {
        await db.insert(pending_webhooks).values({
          awb_number: awb || null,
          status: `shadowfax:${String(statusId || 'unknown')}`,
          payload: {
            __provider: 'shadowfax',
            body: payload,
          },
        })
        console.warn(`Stored Shadowfax webhook for AWB ${awb || 'N/A'} (order not yet created).`)
      } else {
        console.warn(
          `Duplicate pending Shadowfax webhook skipped for AWB ${awb || 'N/A'} (within dedupe window).`,
        )
      }

      return res.status(202).json({ success: true, queued: true })
    }

    if (!result.success) {
      return res.status(202).json({ success: false, reason: result.reason })
    }

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('Shadowfax webhook processing failed:', err?.message || err)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
