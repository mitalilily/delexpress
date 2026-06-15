import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { Request, Response } from 'express'
import Papa from 'papaparse'
import { db } from '../../models/client'
import {
  deleteCourierService,
  deleteShippingRate,
  getShippingRates,
  ShippingRateUpdatePayload,
  updateShippingRate,
  upsertShippingRate,
} from '../../models/services/courierIntegration.service'
import { ExpressflyService } from '../../models/services/couriers/expressfly.service'
import { ShadowfaxService } from '../../models/services/couriers/shadowfax.service'
import { fetchAvailableCouriersWithRatesAdmin } from '../../models/services/shiprocket.service'
import { courier_credentials } from '../../models/schema/courierCredentials'
import { couriers } from '../../models/schema/couriers'
import { getAllZones } from '../../models/services/zone.service'

const maskCredential = (value?: string | null) => {
  const raw = (value || '').trim()
  if (!raw) return ''
  return `${raw.slice(0, 4)}${'*'.repeat(Math.max(raw.length - 8, 0))}${raw.slice(-4)}`
}

export interface ShippingRateFilters {
  courier_name?: string[]
  mode?: string
  min_weight?: number
  plan_id?: string
  business_type?: 'b2b' | 'b2c'
}

export const fetchAvailableCouriersForAdmin = async (req: Request, res: Response) => {
  try {
    const {
      origin,
      destination,
      payment_type,
      order_amount,
      weight,
      length,
      breadth,
      height,
      shipment_type,
      plan_id,
      isCalculator,
      context,
    } = req.body
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'pickupPincode and deliveryPincode are required',
      })
    }

    const couriers = await fetchAvailableCouriersWithRatesAdmin(
      {
        origin: Number(origin),
        destination: Number(destination),
        payment_type: payment_type,
        order_amount: order_amount,
        shipment_type: shipment_type,
        weight: Number(weight),
        length: Number(length),
        breadth: Number(breadth),
        height: Number(height),
        isCalculator: isCalculator === true || context === 'rate_calculator',
      },
      plan_id,
    )

    return res.json({ success: true, data: couriers ?? [] })
  } catch (err: any) {
    console.error('Error fetching couriers:', err.message)
    return res.status(500).json({ success: false, error: err.message })
  }
}

export const getShippingRatesController = async (req: Request, res: Response) => {
  try {
    let courierNames: string[] = []

    const rawCourierNames = req.query['courier_name[]'] ?? req.query.courier_name

    if (Array.isArray(rawCourierNames)) {
      courierNames = rawCourierNames.flat().filter(Boolean).map(String)
    } else if (typeof rawCourierNames === 'string') {
      courierNames = [rawCourierNames]
    }

    const filters: ShippingRateFilters = {
      courier_name: courierNames.length ? courierNames : undefined,
      mode: req.query.mode as string | undefined,
      min_weight:
        (req.query.businessType as string | undefined)?.toLowerCase() === 'b2c'
          ? undefined
          : req.query.min_weight
            ? Number(req.query.min_weight)
            : undefined,
      plan_id: req.query.planId as string | undefined,
      business_type: (req.query.businessType as 'b2b' | 'b2c') || undefined,
    }

    const rates = await getShippingRates(filters)
    res.json({ success: true, data: rates })
  } catch (err) {
    console.error('Error fetching shipping rates:', err)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

export const getAllCouriersController = async (req: Request, res: Response) => {
  try {
    const courierList = await db
      .select({
        id: couriers.id,
        name: couriers.name,
        serviceProvider: couriers.serviceProvider,
        isEnabled: couriers.isEnabled,
        createdAt: couriers.createdAt,
      })
      .from(couriers)
      .orderBy(desc(couriers.createdAt))

    res.json({ success: true, data: courierList })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
}

export const getAllCouriersListController = async (req: Request, res: Response) => {
  try {
    const { search, serviceProvider, businessType } = req.query

    const whereClauses = []

    // Filter by search (name or id)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      whereClauses.push(
        or(
          ilike(couriers.name, searchTerm),
          sql`CAST(${couriers.id} AS TEXT) ILIKE ${searchTerm}`,
        )!,
      )
    }

    // Filter by service provider
    if (serviceProvider && typeof serviceProvider === 'string' && serviceProvider.trim()) {
      whereClauses.push(eq(couriers.serviceProvider, serviceProvider.trim()))
    }

    // Filter by business type (b2c or b2b)
    if (businessType && typeof businessType === 'string') {
      const normalizedBusinessType = businessType.trim().toLowerCase()
      if (normalizedBusinessType === 'b2c' || normalizedBusinessType === 'b2b') {
        // Construct JSONB array string - value is validated above (only 'b2c' or 'b2b')
        const jsonbArrayStr = JSON.stringify([normalizedBusinessType])
        // Match the pattern from shiprocket.service.ts - construct the full JSONB literal
        whereClauses.push(
          sql`${couriers.businessType} @> ${sql.raw(
            `'${jsonbArrayStr.replace(/'/g, "''")}'::jsonb`,
          )}`,
        )
      }
    }

    const whereCondition = whereClauses.length > 0 ? and(...whereClauses) : undefined

    const courierList = await db
      .select()
      .from(couriers)
      .where(whereCondition)
      .orderBy(desc(couriers.createdAt))

    res.json({ success: true, data: courierList })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to fetch couriers' })
  }
}

export const updateCourierStatusController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { serviceProvider, isEnabled, businessType } = req.body

  try {
    if (!serviceProvider) {
      return res.status(400).json({
        success: false,
        message: 'serviceProvider is required',
      })
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Update isEnabled if provided
    if (typeof isEnabled === 'boolean') {
      updateData.isEnabled = isEnabled
    }

    // Update businessType if provided
    if (businessType && Array.isArray(businessType) && businessType.length > 0) {
      // Validate businessType values
      const validTypes = businessType.filter((type) => type === 'b2c' || type === 'b2b')
      if (validTypes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'businessType must contain at least one valid value: "b2c" or "b2b"',
        })
      }
      updateData.businessType = validTypes
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 1) {
      // Only updatedAt was added, nothing to update
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update. Provide isEnabled and/or businessType',
      })
    }

    const updated = await db
      .update(couriers)
      .set(updateData)
      .where(and(eq(couriers.id, Number(id)), eq(couriers.serviceProvider, serviceProvider)))
      .returning()

    if (!updated.length) {
      return res.status(404).json({ success: false, message: 'Courier not found' })
    }

    res.json({ success: true, data: updated[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update courier' })
  }
}

export const getServiceProvidersController = async (req: Request, res: Response) => {
  try {
    // Only expose the main integrated service providers in the enable/disable UI
    const allowedProviders = ['delhivery', 'ekart', 'xpressbees', 'expressfly', 'shadowfax']

    const rows = await db
      .select({
        serviceProvider: couriers.serviceProvider,
        totalCouriers: sql<number>`count(*)`,
        enabledCouriers: sql<number>`sum(case when ${couriers.isEnabled} then 1 else 0 end)`,
      })
      .from(couriers)
      .where(inArray(couriers.serviceProvider, allowedProviders))
      .groupBy(couriers.serviceProvider)
      .orderBy(couriers.serviceProvider)

    const byProvider = new Map(
      rows.map((row) => [
        row.serviceProvider,
        {
          serviceProvider: row.serviceProvider,
          totalCouriers: Number(row.totalCouriers || 0),
          enabledCouriers: Number(row.enabledCouriers || 0),
          isEnabled: Number(row.enabledCouriers || 0) > 0,
        },
      ]),
    )

    // Ensure allowed providers are always visible in admin UI,
    // even when no rows exist in couriers table yet.
    const providers = allowedProviders.map((provider) => ({
      serviceProvider: provider,
      totalCouriers: byProvider.get(provider)?.totalCouriers ?? 0,
      enabledCouriers: byProvider.get(provider)?.enabledCouriers ?? 0,
      isEnabled: byProvider.get(provider)?.isEnabled ?? false,
    }))

    res.json({ success: true, data: providers })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to fetch service providers' })
  }
}

export const updateServiceProviderStatusController = async (req: Request, res: Response) => {
  const { serviceProvider } = req.params
  const { isEnabled } = req.body

  try {
    const allowedProviders = ['delhivery', 'ekart', 'xpressbees', 'expressfly', 'shadowfax']

    if (!serviceProvider || typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'serviceProvider (param) and boolean isEnabled (body) are required',
      })
    }
    if (!allowedProviders.includes(String(serviceProvider).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Only these providers are supported: ${allowedProviders.join(', ')}`,
      })
    }

    const updated = await db
      .update(couriers)
      .set({
        isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(couriers.serviceProvider, serviceProvider))
      .returning()

    if (!updated.length) {
      return res.status(404).json({ success: false, message: 'No couriers found for provider' })
    }

    res.json({
      success: true,
      data: {
        serviceProvider,
        isEnabled,
        affectedCouriers: updated.length,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update service provider status' })
  }
}

export const getCourierCredentialsController = async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        provider: courier_credentials.provider,
        apiBase: courier_credentials.apiBase,
        clientName: courier_credentials.clientName,
        apiKey: courier_credentials.apiKey,
        clientId: courier_credentials.clientId,
        username: courier_credentials.username,
        password: courier_credentials.password,
        webhookSecret: courier_credentials.webhookSecret,
      })
      .from(courier_credentials)
      .where(
        inArray(courier_credentials.provider, [
          'delhivery',
          'ekart',
          'xpressbees',
          'expressfly',
          'shadowfax',
        ]),
      )

    const defaults = {
      delhivery: {
        provider: 'delhivery',
        apiBase: 'https://track.delhivery.com',
        clientName: '',
        hasApiKey: false,
        apiKeyMasked: '',
      },
      ekart: {
        provider: 'ekart',
        apiBase: 'https://api.ekartlogistics.com',
        clientId: '',
        username: '',
        hasPassword: false,
        hasWebhookSecret: false,
      },
      xpressbees: {
        provider: 'xpressbees',
        apiBase: 'https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward',
        username: '',
        hasSecretKey: false,
        secretKeyMasked: '',
        hasXbKey: false,
        xbKeyMasked: '',
        hasApiKey: false,
        apiKeyMasked: '',
        hasPassword: false,
        hasWebhookSecret: false,
      },
      expressfly: {
        provider: 'expressfly',
        apiKey: '',
        apiKeyMasked: '',
        apiUserId: '',
        apiUserIdMasked: '',
        hasApiKey: false,
        hasApiUserId: false,
      },
      shadowfax: {
        provider: 'shadowfax',
        apiBase: '',
        apiKey: '',
        apiKeyMasked: '',
        hasApiKey: false,
      },
    }

    const data = rows.reduce<Record<string, any>>((acc, row) => {
      const provider = (row.provider || '').toLowerCase()
      if (!provider) return acc
      if (provider === 'delhivery') {
        const apiKey = row.apiKey || ''
        acc.delhivery = {
          provider: 'delhivery',
          apiBase: row.apiBase || 'https://track.delhivery.com',
          clientName: row.clientName || '',
          hasApiKey: Boolean(apiKey.trim()),
          apiKeyMasked: apiKey
            ? `${apiKey.slice(0, 4)}${'*'.repeat(Math.max(apiKey.length - 8, 0))}${apiKey.slice(-4)}`
            : '',
        }
      } else if (provider === 'ekart') {
        const hasPassword = Boolean((row.password || '').trim())
        const hasWebhookSecret = Boolean((row.webhookSecret || '').trim())
        acc.ekart = {
          provider: 'ekart',
          apiBase: row.apiBase || 'https://api.ekartlogistics.com',
          clientId: row.clientId || '',
          username: row.username || '',
          hasPassword,
          hasWebhookSecret,
        }
      } else if (provider === 'xpressbees') {
        const apiKey = row.apiKey || ''
        const hasPassword = Boolean((row.password || '').trim())
        const hasWebhookSecret = Boolean((row.webhookSecret || '').trim())
        const secretKey = row.clientId || ''
        const xbKey = row.clientName || ''
        acc.xpressbees = {
          provider: 'xpressbees',
          apiBase:
            row.apiBase || 'https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward',
          username: row.username || '',
          hasSecretKey: Boolean(secretKey.trim()),
          secretKeyMasked: maskCredential(secretKey),
          hasXbKey: Boolean(xbKey.trim()),
          xbKeyMasked: maskCredential(xbKey),
          hasApiKey: Boolean(apiKey.trim()),
          apiKeyMasked: maskCredential(apiKey),
          hasPassword,
          hasWebhookSecret,
        }
      } else if (provider === 'expressfly') {
        const apiKey = row.apiKey || ''
        const apiUserId = row.clientId || ''
        acc.expressfly = {
          provider: 'expressfly',
          apiKeyMasked: maskCredential(apiKey),
          apiUserIdMasked: maskCredential(apiUserId),
          hasApiKey: Boolean(apiKey.trim()),
          hasApiUserId: Boolean(apiUserId.trim()),
        }
      } else if (provider === 'shadowfax') {
        const apiKey = row.apiKey || ''
        acc.shadowfax = {
          provider: 'shadowfax',
          apiBase: row.apiBase || '',
          apiKeyMasked: maskCredential(apiKey),
          hasApiKey: Boolean(apiKey.trim()),
        }
      }
      return acc
    }, { ...defaults })

    res.json({
      success: true,
      data,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to fetch courier credentials' })
  }
}

export const updateDelhiveryCredentialsController = async (req: Request, res: Response) => {
  const { apiBase, clientName, apiKey } = req.body || {}

  try {
    const nextApiBase = typeof apiBase === 'string' ? apiBase.trim() : undefined
    const nextClientName = typeof clientName === 'string' ? clientName.trim() : undefined
    const nextApiKey = typeof apiKey === 'string' ? apiKey.trim() : undefined
    const hasNewApiKey = typeof nextApiKey === 'string' && nextApiKey.length > 0

    const [existing] = await db
      .select({ id: courier_credentials.id })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'delhivery'))
      .limit(1)

    if (existing) {
      const updatePayload: Record<string, any> = {
        updatedAt: new Date(),
      }
      if (nextApiBase !== undefined) {
        updatePayload.apiBase = nextApiBase || 'https://track.delhivery.com'
      }
      if (nextClientName !== undefined) {
        updatePayload.clientName = nextClientName
      }
      if (hasNewApiKey) {
        updatePayload.apiKey = nextApiKey
      }

      await db
        .update(courier_credentials)
        .set(updatePayload)
        .where(eq(courier_credentials.provider, 'delhivery'))
    } else {
      await db.insert(courier_credentials).values({
        provider: 'delhivery',
        apiBase: nextApiBase || 'https://track.delhivery.com',
        clientName: nextClientName || '',
        apiKey: hasNewApiKey ? nextApiKey : '',
      })
    }

    const [saved] = await db
      .select({
        apiBase: courier_credentials.apiBase,
        clientName: courier_credentials.clientName,
        apiKey: courier_credentials.apiKey,
      })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'delhivery'))
      .limit(1)

    res.json({
      success: true,
      message: 'Delhivery credentials updated successfully',
      data: {
        provider: 'delhivery',
        apiBase: saved?.apiBase || 'https://track.delhivery.com',
        clientName: saved?.clientName || '',
        hasApiKey: Boolean((saved?.apiKey || '').trim()),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update Delhivery credentials' })
  }
}

export const updateEkartCredentialsController = async (req: Request, res: Response) => {
  const { apiBase, clientId, username, password, webhookSecret } = req.body || {}

  try {
    const nextApiBase = typeof apiBase === 'string' ? apiBase.trim() : undefined
    const nextClientId = typeof clientId === 'string' ? clientId.trim() : undefined
    const nextUsername = typeof username === 'string' ? username.trim() : undefined
    const nextPassword = typeof password === 'string' ? password.trim() : undefined
    const hasPassword = typeof nextPassword === 'string' && nextPassword.length > 0
    const hasWebhookSecret = typeof webhookSecret === 'string' && webhookSecret.length > 0

    const [existing] = await db
      .select({ id: courier_credentials.id })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'ekart'))
      .limit(1)

    if (existing) {
      const updatePayload: Record<string, any> = {
        updatedAt: new Date(),
      }
      if (nextApiBase !== undefined) {
        updatePayload.apiBase = nextApiBase || 'https://api.ekartlogistics.com'
      }
      if (nextClientId !== undefined) {
        updatePayload.clientId = nextClientId
      }
      if (nextUsername !== undefined) {
        updatePayload.username = nextUsername
      }
      if (hasPassword) {
        updatePayload.password = nextPassword
      }
      if (hasWebhookSecret) {
        updatePayload.webhookSecret = webhookSecret
      }

      await db
        .update(courier_credentials)
        .set(updatePayload)
        .where(eq(courier_credentials.provider, 'ekart'))
    } else {
      await db.insert(courier_credentials).values({
        provider: 'ekart',
        apiBase: nextApiBase || 'https://api.ekartlogistics.com',
        clientName: '',
        apiKey: '',
        clientId: nextClientId || '',
        username: nextUsername || '',
        password: hasPassword ? nextPassword : '',
        webhookSecret: hasWebhookSecret ? webhookSecret : '',
      })
    }

    const [saved] = await db
      .select({
        apiBase: courier_credentials.apiBase,
        clientId: courier_credentials.clientId,
        username: courier_credentials.username,
        password: courier_credentials.password,
        webhookSecret: courier_credentials.webhookSecret,
      })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'ekart'))
      .limit(1)

    res.json({
      success: true,
      message: 'Ekart credentials updated successfully',
      data: {
        provider: 'ekart',
        apiBase: saved?.apiBase || 'https://api.ekartlogistics.com',
        clientId: saved?.clientId || '',
        username: saved?.username || '',
        hasPassword: Boolean((saved?.password || '').trim()),
        hasWebhookSecret: Boolean((saved?.webhookSecret || '').trim()),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update Ekart credentials' })
  }
}

export const updateXpressbeesCredentialsController = async (req: Request, res: Response) => {
  const { apiBase, username, password, apiKey, webhookSecret, secretKey, xbKey } = req.body || {}

  try {
    const nextApiBase = typeof apiBase === 'string' ? apiBase.trim() : undefined
    const nextUsername = typeof username === 'string' ? username.trim() : undefined
    const nextPassword = typeof password === 'string' ? password.trim() : undefined
    const nextApiKey = typeof apiKey === 'string' ? apiKey.trim() : undefined
    const nextWebhookSecret =
      typeof webhookSecret === 'string' ? webhookSecret.trim() : undefined
    const nextSecretKey = typeof secretKey === 'string' ? secretKey.trim() : undefined
    const nextXbKey = typeof xbKey === 'string' ? xbKey.trim() : undefined
    const hasPassword = typeof nextPassword === 'string' && nextPassword.length > 0
    const hasApiKey = typeof nextApiKey === 'string' && nextApiKey.length > 0
    const hasWebhookSecret =
      typeof nextWebhookSecret === 'string' && nextWebhookSecret.length > 0
    const hasSecretKey = typeof nextSecretKey === 'string' && nextSecretKey.length > 0
    const hasXbKey = typeof nextXbKey === 'string' && nextXbKey.length > 0

    const [existing] = await db
      .select({ id: courier_credentials.id })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'xpressbees'))
      .limit(1)

    if (existing) {
      const updatePayload: Record<string, any> = {
        updatedAt: new Date(),
      }
      if (nextApiBase !== undefined) {
        updatePayload.apiBase =
          nextApiBase || 'https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward'
      }
      if (nextUsername !== undefined) {
        updatePayload.username = nextUsername
      }
      if (hasSecretKey) {
        updatePayload.clientId = nextSecretKey
      }
      if (hasXbKey) {
        updatePayload.clientName = nextXbKey
      }
      if (hasPassword) {
        updatePayload.password = nextPassword
      }
      if (hasApiKey) {
        updatePayload.apiKey = nextApiKey
      }
      if (hasWebhookSecret) {
        updatePayload.webhookSecret = nextWebhookSecret
      }

      await db
        .update(courier_credentials)
        .set(updatePayload)
        .where(eq(courier_credentials.provider, 'xpressbees'))
    } else {
      await db.insert(courier_credentials).values({
        provider: 'xpressbees',
        apiBase:
          nextApiBase || 'https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward',
        clientName: hasXbKey ? nextXbKey : '',
        apiKey: hasApiKey ? nextApiKey : '',
        clientId: hasSecretKey ? nextSecretKey : '',
        username: nextUsername || '',
        password: hasPassword ? nextPassword : '',
        webhookSecret: hasWebhookSecret ? nextWebhookSecret : '',
      })
    }

    const [saved] = await db
      .select({
        apiBase: courier_credentials.apiBase,
        clientName: courier_credentials.clientName,
        clientId: courier_credentials.clientId,
        username: courier_credentials.username,
        password: courier_credentials.password,
        apiKey: courier_credentials.apiKey,
        webhookSecret: courier_credentials.webhookSecret,
      })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'xpressbees'))
      .limit(1)

    res.json({
      success: true,
      message: 'Xpressbees credentials updated successfully',
      data: {
        provider: 'xpressbees',
        apiBase:
          saved?.apiBase || 'https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward',
        username: saved?.username || '',
        hasSecretKey: Boolean((saved?.clientId || '').trim()),
        hasXbKey: Boolean((saved?.clientName || '').trim()),
        hasPassword: Boolean((saved?.password || '').trim()),
        hasApiKey: Boolean((saved?.apiKey || '').trim()),
        hasWebhookSecret: Boolean((saved?.webhookSecret || '').trim()),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update Xpressbees credentials' })
  }
}

export const updateExpressflyCredentialsController = async (req: Request, res: Response) => {
  const { apiBase, apiKey, apiUserId } = req.body || {}

  try {
    const nextApiBase = typeof apiBase === 'string' ? apiBase.trim() : undefined
    const nextApiKey = typeof apiKey === 'string' ? apiKey.trim() : undefined
    const nextApiUserId = typeof apiUserId === 'string' ? apiUserId.trim() : undefined
    const hasApiKey = typeof nextApiKey === 'string' && nextApiKey.length > 0
    const hasApiUserId = typeof nextApiUserId === 'string' && nextApiUserId.length > 0

    const [existing] = await db
      .select({ id: courier_credentials.id })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'expressfly'))
      .limit(1)

    if (existing) {
      const updatePayload: Record<string, any> = {
        updatedAt: new Date(),
      }
      if (nextApiBase !== undefined) {
        updatePayload.apiBase = nextApiBase
      }
      if (hasApiKey) {
        updatePayload.apiKey = nextApiKey
      }
      if (hasApiUserId) {
        updatePayload.clientId = nextApiUserId
      }

      await db
        .update(courier_credentials)
        .set(updatePayload)
        .where(eq(courier_credentials.provider, 'expressfly'))
    } else {
      await db.insert(courier_credentials).values({
        provider: 'expressfly',
        apiBase: nextApiBase || '',
        apiKey: hasApiKey ? nextApiKey : '',
        clientId: hasApiUserId ? nextApiUserId : '',
      })
    }

    const [saved] = await db
      .select({
        apiBase: courier_credentials.apiBase,
        apiKey: courier_credentials.apiKey,
        clientId: courier_credentials.clientId,
      })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'expressfly'))
      .limit(1)

    res.json({
      success: true,
      message: 'Expressfly credentials updated successfully',
      data: {
        provider: 'expressfly',
        apiBase: saved?.apiBase || '',
        hasApiKey: Boolean((saved?.apiKey || '').trim()),
        apiKeyMasked: maskCredential(saved?.apiKey),
        hasApiUserId: Boolean((saved?.clientId || '').trim()),
        apiUserIdMasked: maskCredential(saved?.clientId),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update Expressfly credentials' })
  }
}

export const updateShadowfaxCredentialsController = async (req: Request, res: Response) => {
  const { apiBase, apiKey } = req.body || {}

  try {
    const nextApiBase = typeof apiBase === 'string' ? apiBase.trim() : undefined
    const nextApiKey = typeof apiKey === 'string' ? apiKey.trim() : undefined
    const hasApiKey = typeof nextApiKey === 'string' && nextApiKey.length > 0

    const [existing] = await db
      .select({ id: courier_credentials.id })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'shadowfax'))
      .limit(1)

    if (existing) {
      const updatePayload: Record<string, any> = {
        updatedAt: new Date(),
      }
      if (nextApiBase !== undefined) {
        updatePayload.apiBase = nextApiBase
      }
      if (hasApiKey) {
        updatePayload.apiKey = nextApiKey
      }

      await db
        .update(courier_credentials)
        .set(updatePayload)
        .where(eq(courier_credentials.provider, 'shadowfax'))
    } else {
      await db.insert(courier_credentials).values({
        provider: 'shadowfax',
        apiBase: nextApiBase || '',
        clientName: '',
        apiKey: hasApiKey ? nextApiKey : '',
      })
    }

    const [saved] = await db
      .select({
        apiBase: courier_credentials.apiBase,
        apiKey: courier_credentials.apiKey,
      })
      .from(courier_credentials)
      .where(eq(courier_credentials.provider, 'shadowfax'))
      .limit(1)

    res.json({
      success: true,
      message: 'Shadowfax credentials updated successfully',
      data: {
        provider: 'shadowfax',
        apiBase: saved?.apiBase || '',
        hasApiKey: Boolean((saved?.apiKey || '').trim()),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to update Shadowfax credentials' })
  }
}

export const getExpressflyOrdersController = async (req: Request, res: Response) => {
  try {
    const offset = Number(req.query.offset ?? 0)
    const limit = Number(req.query.limit ?? 50)
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined
    const sortMode =
      req.query.sortMode === 'asc' || req.query.sortMode === 'desc'
        ? req.query.sortMode
        : undefined
    const order_status =
      typeof req.query.order_status === 'string' ? req.query.order_status : undefined
    const date_from = typeof req.query.date_from === 'string' ? req.query.date_from : undefined
    const date_to = typeof req.query.date_to === 'string' ? req.query.date_to : undefined
    const search = typeof req.query.search === 'string' ? req.query.search : undefined
    const shipment_type =
      req.query.shipment_type === 'true'
        ? true
        : req.query.shipment_type === 'false'
          ? false
          : undefined

    if (!Number.isFinite(offset) || offset < 0) {
      return res.status(400).json({ success: false, message: 'offset must be a non-negative number' })
    }

    if (!Number.isFinite(limit) || limit < 1) {
      return res.status(400).json({ success: false, message: 'limit must be a positive number' })
    }

    const service = new ExpressflyService()
    const result = await service.getOrders({
      offset,
      limit,
      sortBy,
      sortMode,
      order_status,
      date_from,
      date_to,
      search,
      shipment_type,
    })

    return res.json({
      success: true,
      message: result.message,
      data: result.data,
      status: result.status,
    })
  } catch (err: any) {
    console.error('Error fetching Expressfly orders:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to fetch Expressfly orders',
    })
  }
}

export const getExpressflyOrderController = async (req: Request, res: Response) => {
  try {
    const orderId = typeof req.params.orderId === 'string' ? req.params.orderId.trim() : ''

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' })
    }

    const service = new ExpressflyService()
    const result = await service.getOrder(orderId)

    return res.json({
      success: true,
      message: result.message,
      data: result.data,
      status: result.status,
    })
  } catch (err: any) {
    console.error('Error fetching Expressfly order:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to fetch Expressfly order',
    })
  }
}

export const getExpressflyOrderRatesController = async (req: Request, res: Response) => {
  try {
    const orderId = typeof req.params.orderId === 'string' ? req.params.orderId.trim() : ''

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' })
    }

    const service = new ExpressflyService()
    const result = await service.getOrderRates(orderId)

    return res.json({
      success: true,
      message: result.message,
      data: result.data,
      status: result.status,
    })
  } catch (err: any) {
    console.error('Error fetching Expressfly order rates:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to fetch Expressfly order rates',
    })
  }
}

export const getExpressflyWarehouseListController = async (req: Request, res: Response) => {
  try {
    const rawPage = typeof req.query.page === 'string' ? Number(req.query.page) : Number(req.query.page ?? 1)
    const rawOffset =
      typeof req.query.offset === 'string' ? Number(req.query.offset) : Number(req.query.offset ?? 0)
    const rawLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : Number(req.query.limit ?? 1000)
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined
    const userId =
      typeof req.query.user_id === 'string'
        ? req.query.user_id.trim()
        : typeof req.query.userId === 'string'
          ? req.query.userId.trim()
          : undefined

    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 1000
    const page =
      Number.isFinite(rawPage) && rawPage > 0
        ? Math.floor(rawPage)
        : Number.isFinite(rawOffset) && rawOffset >= 0
          ? Math.floor(rawOffset / limit) + 1
          : 1

    const service = new ExpressflyService()
    const result = await service.getWarehouseList({
      page,
      limit,
      search,
      userId,
      forceRefresh: req.query.forceRefresh === 'true',
    })

    return res.json({
      success: true,
      message: result.message,
      data: result.data,
      status: result.status,
      totalUsers: result.totalUsers,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    })
  } catch (err: any) {
    console.error('Error fetching Expressfly warehouse list:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to fetch Expressfly warehouse list',
    })
  }
}

export const createExpressflyWarehouseController = async (req: Request, res: Response) => {
  try {
    const warehouse_name =
      typeof req.body.warehouse_name === 'string' ? req.body.warehouse_name.trim() : ''
    const contact_person_name =
      typeof req.body.contact_person_name === 'string' ? req.body.contact_person_name.trim() : ''
    const contact_no = typeof req.body.contact_no === 'string' ? req.body.contact_no.trim() : ''
    const address_line1 =
      typeof req.body.address_line1 === 'string' ? req.body.address_line1.trim() : ''
    const city = typeof req.body.city === 'string' ? req.body.city.trim() : ''
    const state = typeof req.body.state === 'string' ? req.body.state.trim() : ''
    const pincode = typeof req.body.pincode === 'string' ? req.body.pincode.trim() : ''
    const landmark = typeof req.body.landmark === 'string' ? req.body.landmark.trim() : undefined

    if (!warehouse_name) return res.status(400).json({ success: false, message: 'warehouse_name is required' })
    if (!contact_person_name)
      return res.status(400).json({ success: false, message: 'contact_person_name is required' })
    if (!contact_no) return res.status(400).json({ success: false, message: 'contact_no is required' })
    if (!address_line1)
      return res.status(400).json({ success: false, message: 'address_line1 is required' })
    if (!city) return res.status(400).json({ success: false, message: 'city is required' })
    if (!state) return res.status(400).json({ success: false, message: 'state is required' })
    if (!pincode) return res.status(400).json({ success: false, message: 'pincode is required' })

    const service = new ExpressflyService()
    const result = await service.createWarehouse({
      warehouse_name,
      contact_person_name,
      contact_no,
      address_line1,
      landmark,
      city,
      state,
      pincode,
    })

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      status: result.status,
    })
  } catch (err: any) {
    console.error('Error creating Expressfly warehouse:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to create Expressfly warehouse',
    })
  }
}

export const updateExpressflyWarehouseController = async (req: Request, res: Response) => {
  try {
    const warehouseId =
      typeof req.params.warehouseId === 'string' ? req.params.warehouseId.trim() : ''
    const warehouse_name =
      typeof req.body.warehouse_name === 'string' ? req.body.warehouse_name.trim() : ''
    const contact_person_name =
      typeof req.body.contact_person_name === 'string' ? req.body.contact_person_name.trim() : ''
    const contact_no = typeof req.body.contact_no === 'string' ? req.body.contact_no.trim() : ''
    const address_line1 =
      typeof req.body.address_line1 === 'string' ? req.body.address_line1.trim() : ''
    const city = typeof req.body.city === 'string' ? req.body.city.trim() : ''
    const state = typeof req.body.state === 'string' ? req.body.state.trim() : ''
    const pincode = typeof req.body.pincode === 'string' ? req.body.pincode.trim() : ''
    const landmark = typeof req.body.landmark === 'string' ? req.body.landmark.trim() : undefined

    if (!warehouseId) return res.status(400).json({ success: false, message: 'warehouseId is required' })
    if (!warehouse_name) return res.status(400).json({ success: false, message: 'warehouse_name is required' })
    if (!contact_person_name)
      return res.status(400).json({ success: false, message: 'contact_person_name is required' })
    if (!contact_no) return res.status(400).json({ success: false, message: 'contact_no is required' })
    if (!address_line1)
      return res.status(400).json({ success: false, message: 'address_line1 is required' })
    if (!city) return res.status(400).json({ success: false, message: 'city is required' })
    if (!state) return res.status(400).json({ success: false, message: 'state is required' })
    if (!pincode) return res.status(400).json({ success: false, message: 'pincode is required' })

    const service = new ExpressflyService()
    const result = await service.updateWarehouse({
      warehouse_id: warehouseId,
      warehouse_name,
      contact_person_name,
      contact_no,
      address_line1,
      landmark,
      city,
      state,
      pincode,
    })

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      status: result.status,
    })
  } catch (err: any) {
    console.error('Error updating Expressfly warehouse:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to update Expressfly warehouse',
    })
  }
}

export const getExpressflyWarehouseController = async (req: Request, res: Response) => {
  try {
    const warehouseId =
      typeof req.params.warehouseId === 'string' ? req.params.warehouseId.trim() : ''

    if (!warehouseId) {
      return res.status(400).json({ success: false, message: 'warehouseId is required' })
    }

    const service = new ExpressflyService()
    const result = await service.getWarehouse(warehouseId)

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      status: result.status,
    })
  } catch (err: any) {
    console.error('Error fetching Expressfly warehouse:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to fetch Expressfly warehouse',
    })
  }
}

export const deleteExpressflyWarehouseController = async (req: Request, res: Response) => {
  try {
    const warehouseId =
      typeof req.params.warehouseId === 'string' ? req.params.warehouseId.trim() : ''

    if (!warehouseId) {
      return res.status(400).json({ success: false, message: 'warehouseId is required' })
    }

    const service = new ExpressflyService()
    const result = await service.deleteWarehouse(warehouseId)

    return res.status(200).json({
      success: true,
      message: result.message,
      status: result.status,
    })
  } catch (err: any) {
    console.error('Error deleting Expressfly warehouse:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to delete Expressfly warehouse',
    })
  }
}

export interface RateType {
  forward?: string | number
  rto?: string | number
}

// Utility: convert numbers to string for decimal fields
export const numericToString = (val: string | number | null | undefined): string | null => {
  if (val === null || val === undefined || val === '') return null
  return String(val)
}

// ---------------- Controller ----------------
export const updateShippingRateController = async (req: Request, res: Response) => {
  try {
    const courierId = Number(req.params.id) // courier_id from params
    let planId: string | undefined = req.params.planId // plan_id from params

    // Fallback: try to get planId from query or body if not in params
    if (!planId || planId === 'undefined') {
      planId = (req.query.planId as string) || (req.body.planId as string) || undefined
    }

    if (!courierId || isNaN(courierId)) {
      return res.status(400).json({ success: false, message: 'Invalid courier ID' })
    }

    if (!planId || planId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing plan ID. Please ensure a plan is selected.',
      })
    }

    const updates: ShippingRateUpdatePayload = req.body

    console.log(`[updateShippingRateController] courierId: ${courierId}, planId: ${planId}`)

    const updated = await updateShippingRate(courierId, updates, planId)
    if (!updated) return res.status(404).json({ success: false, message: 'Rate card not found' })

    res.json({ success: true, data: updated })
  } catch (err) {
    console.log('Error updating shipping rate:', err)
    const statusCode = isSlabValidationError(err) ? 400 : 500
    res.status(statusCode).json({
      success: false,
      message: isSlabValidationError(err)
        ? String((err as any)?.message || 'Invalid slab configuration')
        : 'Internal Server Error',
    })
  }
}

type CSVRow = Record<string, string | undefined>

const parseSlabJsonCell = (value?: string) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const isSlabValidationError = (err: unknown) =>
  /slab|overlap|extra_rate|extra_weight_unit/i.test(String((err as any)?.message || err || ''))

export const importShippingRatesController = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const { planId: plan_id, businessType: business_type } = req.query
    if (!plan_id || !business_type) {
      return res.status(400).json({ success: false, message: 'Missing plan_id or business_type' })
    }

    const csvContent = req.file.buffer.toString('utf8')

    const { data, errors } = Papa.parse<CSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
    })

    if (errors.length) {
      console.error('CSV parse errors:', errors)
      return res.status(400).json({ success: false, message: 'Invalid CSV format', errors: errors })
    }

    const zonesList = await getAllZones()

    for (const row of data as CSVRow[]) {
      const courierId = row['Courier ID']
      const courierName = row['Courier Name']
      const serviceProvider = row['Service Provider']
      const minWeight = row['Min Weight']
      const mode = row['Mode'] || ''

      if (!courierId || !courierName) continue

      // Parse rates for each zone
      type RateItem = { zone_id: string; type: 'forward' | 'rto'; rate: number }

      const rates: RateItem[] = Object.entries(row)
        .filter(([key]) =>
          business_type === 'b2b'
            ? key.toLowerCase().includes('forward') || key.toLowerCase().includes('rto')
            : key.includes('(Forward)') || key.includes('(RTO)'),
        )
        .flatMap(([zoneKey, value]): RateItem[] => {
          if (!value) return []

          const zone = zonesList.find((z) => zoneKey.includes(z.name))
          if (!zone) return []

          if (zoneKey.toLowerCase().includes('forward')) {
            return [{ zone_id: zone.id, type: 'forward', rate: Number(value) }]
          }

          if (zoneKey.toLowerCase().includes('rto')) {
            return [{ zone_id: zone.id, type: 'rto', rate: Number(value) }]
          }

          return []
        })

      const zoneSlabs: Record<string, { forward?: any[]; rto?: any[] }> = {}
      if (business_type === 'b2c') {
        for (const zone of zonesList) {
          const forwardSlabs = parseSlabJsonCell(row[`${zone.name} (Forward Slabs)`])
          const rtoSlabs = parseSlabJsonCell(row[`${zone.name} (RTO Slabs)`])
          if (forwardSlabs.length || rtoSlabs.length) {
            zoneSlabs[zone.id] = {}
            if (forwardSlabs.length) zoneSlabs[zone.id].forward = forwardSlabs
            if (rtoSlabs.length) zoneSlabs[zone.id].rto = rtoSlabs
          }
        }
      }

      const codCharges = row['COD Charges'] ? Number(row['COD Charges']) : null
      const codPercent = row['COD Percent'] ? Number(row['COD Percent']) : null
      const otherCharges = row['Other Charges'] ? Number(row['Other Charges']) : null

      // ✅ skip rows without mode, courier info, or any charges/rates
      const hasData =
        mode ||
        codCharges !== null ||
        codPercent !== null ||
        otherCharges !== null ||
        rates.length > 0 ||
        Object.keys(zoneSlabs).length > 0

      if (!hasData) continue

      await upsertShippingRate({
        courier_id: courierId,
        courier_name: courierName,
        service_provider: serviceProvider,
        plan_id: plan_id as string,
        min_weight: minWeight,
        business_type: business_type as 'b2b' | 'b2c',
        mode,
        cod_charges: codCharges,
        cod_percent: codPercent,
        other_charges: otherCharges,
        rates,
        zone_slabs: business_type === 'b2c' ? zoneSlabs : undefined,
      })
    }

    res.json({ success: true, message: 'Shipping rates imported successfully' })
  } catch (err) {
    console.error('Error importing shipping rates:', err)
    const statusCode = isSlabValidationError(err) ? 400 : 500
    res.status(statusCode).json({
      success: false,
      message: isSlabValidationError(err)
        ? String((err as any)?.message || 'Invalid slab configuration')
        : 'Internal Server Error',
    })
  }
}

export const deleteShippingRateController = async (req: Request, res: Response) => {
  try {
    const courierId = Number(req.params.id)
    const planId = req.params.planId
    const businessType = req.query.businessType as 'b2b' | 'b2c'
    const zoneId = req.query.zoneId as string | undefined
    const serviceProvider = req.query.serviceProvider as string | undefined
    const mode = req.query.mode as string | undefined

    if (!courierId || !planId || !businessType) {
      return res
        .status(400)
        .json({ success: false, message: 'courierId, planId and businessType are required' })
    }

    const deleted = await deleteShippingRate(
      courierId,
      planId,
      businessType,
      zoneId,
      serviceProvider,
      mode,
    )

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'No matching rate found' })
    }

    res.json({ success: true, message: 'Rate(s) deleted successfully', data: deleted })
  } catch (err) {
    console.error('Error deleting shipping rate:', err)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}

export const deleteCourierController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { serviceProvider } = req.body

  try {
    if (!serviceProvider) {
      return res.status(400).json({ success: false, message: 'Service provider is required' })
    }
    await deleteCourierService(id, serviceProvider)
    res.json({ success: true, message: 'Courier deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Failed to delete courier' })
  }
}

export const generateShadowfaxAwbController = async (req: Request, res: Response) => {
  try {
    const rawCount = req.body?.count ?? req.query?.count ?? 1
    const count = typeof rawCount === 'string' ? Number(rawCount.trim()) : Number(rawCount)

    if (!Number.isFinite(count) || count < 1) {
      return res.status(400).json({
        success: false,
        message: 'count must be a positive number',
      })
    }

    const service = new ShadowfaxService()
    const result = await service.generateAwb(count)

    return res.status(200).json({
      success: true,
      message: result.message,
      status: result.status,
      data: result,
    })
  } catch (err: any) {
    console.error('Error generating Shadowfax AWB:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to generate Shadowfax AWB',
    })
  }
}

export const getShadowfaxOrderDetailsController = async (req: Request, res: Response) => {
  try {
    const awbNumber =
      typeof req.params.awbNumber === 'string'
        ? req.params.awbNumber.trim()
        : typeof req.query.awbNumber === 'string'
          ? req.query.awbNumber.trim()
          : ''

    if (!awbNumber) {
      return res.status(400).json({
        success: false,
        message: 'awbNumber is required',
      })
    }

    const service = new ShadowfaxService()
    const result = await service.getOrderDetails(awbNumber)

    return res.status(200).json({
      success: true,
      message: result.message,
      status: result.status,
      data: result,
    })
  } catch (err: any) {
    console.error('Error fetching Shadowfax order details:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to fetch Shadowfax order details',
    })
  }
}

export const getShadowfaxBulkOrderDetailsController = async (req: Request, res: Response) => {
  try {
    const rawAwbNumbers =
      req.body?.awbNumbers ??
      req.body?.awb_numbers ??
      req.query?.awbNumbers ??
      req.query?.awb_numbers ??
      []

    const awbNumbers = Array.isArray(rawAwbNumbers)
      ? rawAwbNumbers.map((value) => String(value))
      : typeof rawAwbNumbers === 'string' && rawAwbNumbers.trim()
        ? rawAwbNumbers
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : []

    if (!awbNumbers.length) {
      return res.status(400).json({
        success: false,
        message: 'awbNumbers is required',
      })
    }

    const service = new ShadowfaxService()
    const result = await service.getMultipleOrderDetails(awbNumbers)

    return res.status(200).json({
      success: true,
      message: result.message,
      status: result.status,
      data: result,
    })
  } catch (err: any) {
    console.error('Error fetching Shadowfax bulk order details:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to fetch Shadowfax bulk order details',
    })
  }
}

export const updateShadowfaxOrderController = async (req: Request, res: Response) => {
  try {
    const body = req.body || {}
    const awbNumber =
      typeof req.params.awbNumber === 'string'
        ? req.params.awbNumber.trim()
        : typeof body.awbNumber === 'string'
          ? body.awbNumber.trim()
          : typeof body.awb_number === 'string'
            ? body.awb_number.trim()
            : ''

    if (!awbNumber) {
      return res.status(400).json({
        success: false,
        message: 'awbNumber is required',
      })
    }

    const service = new ShadowfaxService()
    const result = await service.updateOrderDetails({
      awbNumber,
      delivery_details: body.delivery_details ?? body.deliveryDetails ?? null,
      pickup_details: body.pickup_details ?? body.pickupDetails ?? null,
      return_details: body.return_details ?? body.returnDetails ?? null,
      order_details: body.order_details ?? body.orderDetails ?? null,
      status_update: body.status_update ?? body.statusUpdate ?? null,
    })

    return res.status(200).json({
      success: true,
      message: result.message,
      status: result.status,
      data: result,
    })
  } catch (err: any) {
    console.error('Error updating Shadowfax order:', err)
    return res.status(err?.status || 500).json({
      success: false,
      message: err?.message || 'Failed to update Shadowfax order',
    })
  }
}
