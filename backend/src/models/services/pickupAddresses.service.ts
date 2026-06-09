// services/pickupAddresses.service.ts
import { and, asc, desc, eq, ilike, ne, or, sql } from 'drizzle-orm'
import { CreatePickupDto, HydratedPickupAddress, UpdatePickupDto } from '../../types/generic.types'
import { db } from '../client'
import { couriers } from '../schema/couriers'
import { addresses, pickupAddresses } from '../schema/pickupAddresses'
import {
  DelhiveryConfig,
  EkartConfig,
  XpressbeesConfig,
  getEffectiveCourierConfig,
} from './courierCredentials.service'
import { DelhiveryService } from './couriers/delhivery.service'
import { EkartService } from './couriers/ekart.service'

function parseCoordinate(value: string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildEkartGeo(latitude: string | null | undefined, longitude: string | null | undefined) {
  const lat = parseCoordinate(latitude)
  const lon = parseCoordinate(longitude)
  if (lat === null || lon === null) return null
  return { lat, lon }
}

function buildEkartWarehouseAlias(input: {
  addressNickname?: string | null
  contactName?: string | null
  id?: string | null
}) {
  const seed = input.addressNickname || input.contactName || input.id || 'WAREHOUSE'
  return (
    String(seed)
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 50) || 'WAREHOUSE'
  )
}

const MIN_COURIER_ADDRESS_ALNUM_LENGTH = 10

function compactText(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function courierSafeText(value: unknown) {
  return compactText(value)
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function alnumLength(value: unknown) {
  return courierSafeText(value).replace(/[^a-zA-Z0-9]/g, '').length
}

function joinUniqueAddressParts(parts: unknown[]) {
  const seen = new Set<string>()
  const cleaned: string[] = []

  for (const part of parts) {
    const value = courierSafeText(part)
    if (!value) continue

    const key = value.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    cleaned.push(value)
  }

  return cleaned.join(', ')
}

function buildCourierAddressLine(address: any) {
  const addressLine = joinUniqueAddressParts([
    address?.addressLine1,
    address?.addressLine2,
    address?.landmark,
  ])

  if (alnumLength(addressLine) >= MIN_COURIER_ADDRESS_ALNUM_LENGTH) {
    return addressLine
  }

  const contextualAddressLine = joinUniqueAddressParts([
    addressLine,
    address?.city,
    address?.state,
    address?.pincode,
  ])

  return contextualAddressLine || addressLine
}

function assertUsableCourierAddress(address: any, message: string, field: string) {
  if (alnumLength(buildCourierAddressLine(address)) >= MIN_COURIER_ADDRESS_ALNUM_LENGTH) return

  const err: any = new Error(message)
  err.code = 'PICKUP_PROVIDER_PREFLIGHT_FAILED'
  err.field = field
  throw err
}

function buildDelhiveryWarehouseName(address: any) {
  return (
    courierSafeText(address?.addressNickname) ||
    courierSafeText(address?.contactName) ||
    courierSafeText(address?.id) ||
    'Default Warehouse'
  ).slice(0, 100)
}

function normalizeCourierPhone(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

function assertPresent(value: unknown, message: string, field?: string) {
  if (String(value ?? '').trim()) return
  const err: any = new Error(message)
  err.code = 'PICKUP_PROVIDER_PREFLIGHT_FAILED'
  err.field = field
  throw err
}

function preflightDelhiveryWarehouse(payload: CreatePickupDto) {
  const pickup = payload.pickup
  assertPresent(
    pickup.contactName,
    'Pickup contact name is required before registering courier warehouses.',
    'pickup.contactName',
  )
  assertPresent(
    pickup.contactPhone,
    'Pickup phone is required before registering courier warehouses.',
    'pickup.contactPhone',
  )
  assertPresent(
    pickup.addressLine1,
    'Pickup address is required before registering courier warehouses.',
    'pickup.addressLine1',
  )
  assertUsableCourierAddress(
    pickup,
    'Pickup Address Line 1 must include at least 10 letters/numbers for courier warehouse registration.',
    'pickup.addressLine1',
  )
  assertPresent(
    pickup.city,
    'Pickup city is required before registering courier warehouses.',
    'pickup.city',
  )
  assertPresent(
    pickup.state,
    'Pickup state is required before registering courier warehouses.',
    'pickup.state',
  )
  assertPresent(
    pickup.pincode,
    'Pickup pincode is required before registering courier warehouses.',
    'pickup.pincode',
  )

  if (payload.rtoAddress) {
    assertPresent(
      payload.rtoAddress.addressLine1,
      'RTO address is required before registering courier warehouses.',
      'rtoAddress.addressLine1',
    )
    assertUsableCourierAddress(
      payload.rtoAddress,
      'RTO Address Line 1 must include at least 10 letters/numbers for courier warehouse registration.',
      'rtoAddress.addressLine1',
    )
  }
}

function preflightEkartWarehouse(payload: CreatePickupDto) {
  preflightDelhiveryWarehouse(payload)
}

function preflightWarehouseSyncTargets(
  syncTargets: Awaited<ReturnType<typeof getWarehouseSyncTargets>>,
  payload: CreatePickupDto,
) {
  if (syncTargets.delhivery.shouldSync) {
    preflightDelhiveryWarehouse(payload)
  }

  if (syncTargets.ekart.shouldSync) {
    preflightEkartWarehouse(payload)
  }
}

async function isServiceProviderEnabled(serviceProvider: 'delhivery' | 'ekart' | 'xpressbees') {
  const [row] = await db
    .select({ serviceProvider: couriers.serviceProvider })
    .from(couriers)
    .where(and(eq(couriers.serviceProvider, serviceProvider), eq(couriers.isEnabled, true)))

  return !!row
}

function hasDelhiveryCredentials(config: DelhiveryConfig | null) {
  return !!(config?.apiKey?.trim() && config?.clientName?.trim())
}

function hasEkartCredentials(config: EkartConfig | null) {
  return !!(config?.clientId?.trim() && config?.username?.trim() && config?.password?.trim())
}

function hasXpressbeesCredentials(config: XpressbeesConfig | null) {
  return !!(config?.apiToken?.trim() || (config?.email?.trim() && config?.password?.trim()))
}

async function canSyncWarehouseToProvider(serviceProvider: 'delhivery' | 'ekart' | 'xpressbees') {
  const enabled = await isServiceProviderEnabled(serviceProvider)
  if (!enabled) {
    return { enabled: false, configured: false, shouldSync: false }
  }

  if (serviceProvider === 'delhivery') {
    const config = await getEffectiveCourierConfig<DelhiveryConfig>('delhivery', 'b2c')
    const configured = hasDelhiveryCredentials(config)
    return { enabled: true, configured, shouldSync: configured }
  }

  if (serviceProvider === 'xpressbees') {
    const config = await getEffectiveCourierConfig<XpressbeesConfig>('xpressbees', 'b2c')
    const configured = hasXpressbeesCredentials(config)
    return { enabled: true, configured, shouldSync: false }
  }

  const config = await getEffectiveCourierConfig<EkartConfig>('ekart', 'b2c')
  const configured = hasEkartCredentials(config)
  return { enabled: true, configured, shouldSync: configured }
}

async function getWarehouseSyncTargets() {
  const [delhivery, ekart, xpressbees] = await Promise.all([
    canSyncWarehouseToProvider('delhivery'),
    canSyncWarehouseToProvider('ekart'),
    canSyncWarehouseToProvider('xpressbees'),
  ])

  const availableTargets = [delhivery, ekart, xpressbees].filter((item) => item.configured)

  return {
    delhivery,
    ekart,
    xpressbees,
    hasAnyEnabled: delhivery.enabled || ekart.enabled || xpressbees.enabled,
    hasAnyConfiguredTarget: availableTargets.length > 0,
  }
}

let pickupSyncColumnsReady: Promise<void> | null = null

async function ensurePickupSyncColumns() {
  if (!pickupSyncColumnsReady) {
    pickupSyncColumnsReady = (async () => {
      await db.execute(sql`
        ALTER TABLE pickup_addresses
        ADD COLUMN IF NOT EXISTS "delhiverySynced" boolean DEFAULT false NOT NULL
      `)
      await db.execute(sql`
        ALTER TABLE pickup_addresses
        ADD COLUMN IF NOT EXISTS "delhiverySyncError" text
      `)
      await db.execute(sql`
        ALTER TABLE pickup_addresses
        ADD COLUMN IF NOT EXISTS "ekartSynced" boolean DEFAULT false NOT NULL
      `)
      await db.execute(sql`
        ALTER TABLE pickup_addresses
        ADD COLUMN IF NOT EXISTS "ekartSyncError" text
      `)
    })().catch((error) => {
      pickupSyncColumnsReady = null
      throw error
    })
  }

  await pickupSyncColumnsReady
}

function extractEkartValidationMessage(err: any) {
  return (
    err?.response?.data?.description ||
    err?.response?.data?.message ||
    err?.message ||
    'Ekart warehouse registration failed.'
  )
}

async function syncDelhiveryWarehouse(params: { pickupAddr: any; rtoAddressData: any }) {
  const { pickupAddr, rtoAddressData } = params
  const delhivery = new DelhiveryService()
  const pickupAddressLine = buildCourierAddressLine(pickupAddr)
  const returnAddressLine = buildCourierAddressLine(rtoAddressData) || pickupAddressLine
  const pickupPhone = normalizeCourierPhone(pickupAddr.contactPhone)
  const delhiveryResp = await delhivery.createWarehouse({
    name: buildDelhiveryWarehouseName(pickupAddr),
    registered_name: 'ExpressoPro',
    phone: pickupPhone || pickupAddr.contactPhone,
    email: courierSafeText(pickupAddr.contactEmail),
    address: pickupAddressLine,
    city: courierSafeText(pickupAddr.city),
    pin: compactText(pickupAddr.pincode).toString(),
    country: courierSafeText(pickupAddr.country) || 'India',
    return_address: returnAddressLine,
    return_city: courierSafeText(rtoAddressData.city) || courierSafeText(pickupAddr.city),
    return_pin: compactText(rtoAddressData.pincode) || compactText(pickupAddr.pincode),
    return_state: courierSafeText(rtoAddressData.state) || courierSafeText(pickupAddr.state),
    return_country: 'India',
  })

  if (!delhiveryResp || delhiveryResp.success === false) {
    console.error('❌ Delhivery warehouse creation failed:', delhiveryResp)
    const errorToThrow: any = new Error('Delhivery warehouse registration failed')
    errorToThrow.code = 'DELHIVERY_WAREHOUSE_GENERAL_ERROR'
    throw errorToThrow
  }

  console.log(`✅ Delhivery warehouse registered: ${pickupAddr.addressNickname}`)
}

async function syncEkartWarehouse(params: { pickupAddr: any }) {
  const { pickupAddr } = params
  const ekart = new EkartService()
  const alias = buildEkartWarehouseAlias(pickupAddr)
  const phoneRaw = String(pickupAddr.contactPhone || '')
  const phoneDigits = phoneRaw.replace(/\D/g, '')
  const geo = buildEkartGeo(pickupAddr.latitude, pickupAddr.longitude)
  const addressLine1 = buildCourierAddressLine(pickupAddr)
  const addressLine2 = joinUniqueAddressParts([pickupAddr.addressLine2, pickupAddr.landmark])

  const payload = {
    alias,
    contactName: pickupAddr.contactName || 'ExpressoPro',
    phone: Number(phoneDigits) || 0,
    email: pickupAddr.contactEmail || '',
    addressLine1,
    addressLine2,
    city: courierSafeText(pickupAddr.city),
    state: courierSafeText(pickupAddr.state),
    pincode: Number(pickupAddr.pincode) || 0,
    country: (courierSafeText(pickupAddr.country) || 'India').toUpperCase(),
    ...(geo ? { geo } : {}),
    returnAddress: {
      contactName: pickupAddr.contactName || 'ExpressoPro',
      phone: Number(phoneDigits) || 0,
      addressLine1,
      addressLine2,
      city: courierSafeText(pickupAddr.city),
      state: courierSafeText(pickupAddr.state),
      pincode: Number(pickupAddr.pincode) || 0,
      country: (courierSafeText(pickupAddr.country) || 'India').toUpperCase(),
      ...(geo ? { geo } : {}),
    },
  }

  await ekart.createWarehouse(payload)
  console.log(`✅ Ekart warehouse registered: ${alias}`)
}

/**
 * Create Pickup + optional RTO
 */

export async function createPickupAddressService(data: CreatePickupDto, userId: string) {
  await ensurePickupSyncColumns()
  const syncTargets = await getWarehouseSyncTargets()

  if (!syncTargets.hasAnyEnabled) {
    const err: any = new Error(
      'At least one courier provider must be enabled before adding a pickup location.',
    )
    err.code = 'NO_PICKUP_PROVIDER_ENABLED'
    throw err
  }

  if (!syncTargets.hasAnyConfiguredTarget) {
    const err: any = new Error(
      'At least one enabled courier provider must have valid credentials before adding a pickup location.',
    )
    err.code = 'NO_PICKUP_PROVIDER_CONFIGURED'
    throw err
  }

  // Preflight every enabled/configured courier first. Do not create a warehouse in one provider
  // when another provider is already guaranteed to reject this pickup payload.
  preflightWarehouseSyncTargets(syncTargets, data)

  const createdBundle = await db.transaction(async (txn) => {
    const existing = await txn.query.pickupAddresses.findFirst({
      where: eq(pickupAddresses.userId, userId),
    })

    const isPrimary = !existing

    // 🔹 Reset existing primary if new one is requested
    if (data.isPrimary && existing) {
      await txn
        .update(pickupAddresses)
        .set({ isPrimary: false })
        .where(eq(pickupAddresses.userId, userId))
    }

    // 🔹 Insert pickup address
    const [pickupAddr] = await txn
      .insert(addresses)
      .values({
        userId,
        type: 'pickup',
        ...data.pickup,
      })
      .returning()

    // 🔹 Insert optional RTO address
    let rtoAddressId: string | null = null
    let isRTOSame = true
    let rtoAddressData = pickupAddr

    if (data?.rtoAddress) {
      const [rtoAddr] = await txn
        .insert(addresses)
        .values({
          userId,
          type: 'rto',
          ...data.rtoAddress,
        })
        .returning()
      rtoAddressId = rtoAddr.id
      isRTOSame = false
      rtoAddressData = rtoAddr
    } else {
      rtoAddressId = pickupAddr.id
    }

    // 🔹 Link in pickup_addresses
    const [created] = await txn
      .insert(pickupAddresses)
      .values({
        userId,
        addressId: pickupAddr.id,
        rtoAddressId,
        isPrimary: data.isPrimary ?? isPrimary,
        isPickupEnabled: data.isPickupEnabled ?? true,
        isRTOSame,
        delhiverySynced: false,
        delhiverySyncError: null,
        ekartSynced: false,
        ekartSyncError: null,
      })
      .returning()
    return { created, pickupAddr, rtoAddressData }
  })

  const { created, pickupAddr, rtoAddressData } = createdBundle
  const { delhivery: delhiverySync, ekart: ekartSync } = syncTargets
  const warnings: string[] = []
  let delhiverySynced = !delhiverySync.shouldSync
  let delhiverySyncError: string | null = null
  let ekartSynced = !ekartSync.shouldSync
  let ekartSyncError: string | null = null

  if (delhiverySync.shouldSync) {
    try {
      await syncDelhiveryWarehouse({ pickupAddr, rtoAddressData })
      delhiverySynced = true
    } catch (err: any) {
      const rawError = err?.response?.data ?? err
      console.error('❌ Error registering Delhivery warehouse:', rawError)
      const delhiveryErrorText: string | undefined =
        rawError?.error?.[0] || rawError?.message || rawError?.data?.message

      if (
        typeof delhiveryErrorText === 'string' &&
        delhiveryErrorText.includes('client-warehouse of client') &&
        delhiveryErrorText.toLowerCase().includes('already exists')
      ) {
        delhiverySyncError =
          'A pickup location with this nickname already exists. Please choose a different nickname.'
      } else if (
        typeof delhiveryErrorText === 'string' &&
        delhiveryErrorText.toLowerCase().includes('serviceability')
      ) {
        delhiverySyncError =
          'This pickup pincode is not serviceable for pickups. Please use a different pincode.'
      } else {
        delhiverySyncError =
          'Pickup location could not be verified in Delhivery. Please check the address details and try again.'
      }

      warnings.push(delhiverySyncError)
    }
  } else {
    console.log(
      `ℹ️ Skipping Delhivery warehouse registration. enabled=${delhiverySync.enabled} configured=${delhiverySync.configured}`,
    )
  }

  if (ekartSync.shouldSync) {
    try {
      await syncEkartWarehouse({ pickupAddr })
      ekartSynced = true
    } catch (err: any) {
      console.error(
        '❌ Failed to register Ekart warehouse:',
        err?.response?.data || err?.message || err,
      )
      ekartSyncError = extractEkartValidationMessage(err)
      warnings.push(`Ekart: ${ekartSyncError}`)
    }
  } else {
    console.log(
      `ℹ️ Skipping Ekart warehouse registration. enabled=${ekartSync.enabled} configured=${ekartSync.configured}`,
    )
  }

  const [updatedCreated] = await db
    .update(pickupAddresses)
    .set({
      delhiverySynced,
      delhiverySyncError,
      ekartSynced,
      ekartSyncError,
    })
    .where(eq(pickupAddresses.id, created.id))
    .returning()

  return {
    ...updatedCreated,
    warnings,
    providerSync: {
      delhivery: { synced: delhiverySynced, error: delhiverySyncError },
      ekart: { synced: ekartSynced, error: ekartSyncError },
    },
  }
}
/**
 * Update Pickup + optional RTO
 */

export async function updatePickupAddressService(
  pickupId: string | null,
  userId: string,
  data: UpdatePickupDto & { id?: string },
) {
  try {
    await ensurePickupSyncColumns()
    const targetPickupId = pickupId ?? data.id
    if (!targetPickupId) throw new Error('Pickup ID is required')

    // ✅ Handle primary switch (if making this the new primary)
    if (data.isPrimary) {
      await db
        .update(pickupAddresses)
        .set({ isPrimary: false })
        .where(and(eq(pickupAddresses.userId, userId), ne(pickupAddresses.id, targetPickupId)))
    }

    // ✅ Update pickup record (flags only)
    const [pickup] = await db
      .update(pickupAddresses)
      .set({
        isPrimary: data.isPrimary,
        isPickupEnabled: data.isPickupEnabled ?? true,
      })
      .where(and(eq(pickupAddresses.id, targetPickupId), eq(pickupAddresses.userId, userId)))
      .returning()

    if (!pickup) return null

    // 🟡 If only flags are provided (no pickup or RTO details) — skip courier syncs
    const onlyFlagsChanged = !data.pickup && !data.rtoAddress
    if (onlyFlagsChanged) {
      console.log('⚙️ Only flags updated (isPrimary/isPickupEnabled). Skipping courier syncs.')
      return pickup
    }

    // ✅ Start transaction for atomic updates
    const transactionalResult = await db.transaction(async (txn) => {
      // ✅ Update pickup address itself
      let updatedPickup: any = null
      if (data.pickup && pickup.addressId) {
        const { createdAt, ...safeData } = data.pickup
        const [addr] = await txn
          .update(addresses)
          .set({
            ...safeData,
            updatedAt: new Date(),
          })
          .where(eq(addresses.id, pickup.addressId))
          .returning()
        updatedPickup = addr
      }

      // ✅ Update / Create RTO address
      if (data.rtoAddress) {
        if (pickup.rtoAddressId) {
          const { createdAt, ...safeData } = data?.rtoAddress
          await txn
            .update(addresses)
            .set({ ...safeData, updatedAt: new Date() })
            .where(eq(addresses.id, pickup.rtoAddressId))
        } else {
          const [newRto] = await txn
            .insert(addresses)
            .values({
              userId,
              type: 'rto',
              contactName: data.rtoAddress.contactName!,
              contactPhone: data.rtoAddress.contactPhone!,
              addressLine1: data.rtoAddress.addressLine1!,
              city: data.rtoAddress.city!,
              state: data.rtoAddress.state!,
              country: data.rtoAddress.country ?? 'India',
              pincode: data.rtoAddress.pincode!,
              contactEmail: data.rtoAddress.contactEmail,
              addressLine2: data.rtoAddress.addressLine2,
              landmark: data.rtoAddress.landmark,
              gstNumber: data.rtoAddress.gstNumber,
            })
            .returning()

          await txn
            .update(pickupAddresses)
            .set({ rtoAddressId: newRto.id, isRTOSame: false })
            .where(eq(pickupAddresses.id, targetPickupId))
        }
      }

      return { pickup, updatedPickup }
    })

    const currentPickup = transactionalResult.pickup as any
    const updatedPickup = transactionalResult.updatedPickup as any
    const warnings: string[] = []

    if (updatedPickup) {
      const syncTargets = await getWarehouseSyncTargets()
      const needsBackfill =
        currentPickup.delhiverySynced === false || currentPickup.ekartSynced === false

      if (syncTargets.delhivery.shouldSync) {
        if (needsBackfill && currentPickup.delhiverySynced) {
          console.log('ℹ️ Skipping Delhivery retry because this pickup is already synced there.')
        } else {
          try {
            if (needsBackfill && currentPickup.delhiverySynced === false) {
              await syncDelhiveryWarehouse({ pickupAddr: updatedPickup, rtoAddressData: updatedPickup })
            } else {
              const delhivery = new DelhiveryService()
              assertUsableCourierAddress(
                updatedPickup,
                'Pickup Address Line 1 must include at least 10 letters/numbers for courier warehouse registration.',
                'pickup.addressLine1',
              )
              const delhiveryResp = await delhivery.updateWarehouse({
                name: buildDelhiveryWarehouseName(updatedPickup),
                address: buildCourierAddressLine(updatedPickup),
                pin: compactText(updatedPickup?.pincode),
                phone: normalizeCourierPhone(updatedPickup?.contactPhone),
              })

              if (!delhiveryResp || delhiveryResp.success === false) {
                throw new Error('Warehouse update failed')
              }
              console.log(`✅ Warehouse updated in Delhivery: ${updatedPickup?.addressNickname}`)
            }

            await db
              .update(pickupAddresses)
              .set({ delhiverySynced: true, delhiverySyncError: null })
              .where(eq(pickupAddresses.id, targetPickupId))
          } catch (err: any) {
            console.error('❌ Delhivery warehouse update error:', err.message)
            const message =
              err?.message ||
              'Pickup location could not be verified in Delhivery. Please check the address details and try again.'
            warnings.push(message)
            await db
              .update(pickupAddresses)
              .set({ delhiverySynced: false, delhiverySyncError: message })
              .where(eq(pickupAddresses.id, targetPickupId))
          }
        }
      }

      if (syncTargets.ekart.shouldSync && currentPickup.ekartSynced === false) {
        try {
          await syncEkartWarehouse({ pickupAddr: updatedPickup })
          await db
            .update(pickupAddresses)
            .set({ ekartSynced: true, ekartSyncError: null })
            .where(eq(pickupAddresses.id, targetPickupId))
        } catch (err: any) {
          const message = extractEkartValidationMessage(err)
          warnings.push(`Ekart: ${message}`)
          await db
            .update(pickupAddresses)
            .set({ ekartSynced: false, ekartSyncError: message })
            .where(eq(pickupAddresses.id, targetPickupId))
        }
      }
    } else {
      console.log('ℹ️ No pickup address change detected — skipped courier sync update.')
    }

    return { ...transactionalResult.pickup, warnings }
  } catch (error) {
    console.error('❌ Failed to update pickup address:', error)
    throw new Error('Failed to update pickup address')
  }
}

/**
 * Get pickup addresses with hydrated pickup + rto
 */

export async function getPickupAddressesService(
  userId: string,
  filters: Record<string, any> = {},
  page = 1,
  limit = 10,
): Promise<{ data: HydratedPickupAddress[]; totalCount: number }> {
  await ensurePickupSyncColumns()
  const conditions: any[] = [eq(pickupAddresses.userId, userId)]

  // ✅ Pickup status filters
  if (filters.isPickupEnabled === 'active')
    conditions.push(eq(pickupAddresses.isPickupEnabled, true))
  if (filters.isPickupEnabled === 'inactive')
    conditions.push(eq(pickupAddresses.isPickupEnabled, false))
  if (filters.isPrimary !== undefined && filters.isPrimary !== '')
    conditions.push(eq(pickupAddresses.isPrimary, filters.isPrimary === 'true'))

  // ✅ Helper for pickup OR rto field
  const pickupOrRto = (field: string, value: string) => {
    const search = `%${value}%`
    return or(
      ilike((addresses as any)[field], search),
      sql<boolean>`EXISTS (
        SELECT 1 FROM addresses rto
        WHERE rto.id = ${pickupAddresses.rtoAddressId}
          AND rto.${sql.identifier(field)} ILIKE ${search}
      )`,
    )
  }

  // ✅ Field-specific filters
  if (filters.name) conditions.push(pickupOrRto('addressNickname', filters.name))
  if (filters.city) conditions.push(pickupOrRto('city', filters.city))
  if (filters.state) conditions.push(pickupOrRto('state', filters.state))
  if (filters.pincode) conditions.push(pickupOrRto('pincode', filters.pincode))

  // ✅ Sorting
  let sortByClause = desc(addresses.createdAt)
  switch (filters.sortBy) {
    case 'oldest':
      sortByClause = asc(addresses.createdAt)
      break
    case 'az':
      sortByClause = asc(addresses.contactName)
      break
    case 'za':
      sortByClause = desc(addresses.contactName)
      break
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // ✅ Count query
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(pickupAddresses)
    .innerJoin(addresses, eq(pickupAddresses.addressId, addresses.id))
    .where(whereClause) // safe: Drizzle skips undefined

  const totalCount = Number(totalCountResult[0]?.count ?? 0)

  const offset = (page - 1) * limit

  // ✅ Data query
  const data = await db
    .select({
      pickupId: pickupAddresses.id,
      isPrimary: pickupAddresses.isPrimary,
      isPickupEnabled: pickupAddresses.isPickupEnabled,
      isRTOSame: pickupAddresses.isRTOSame,
      delhiverySynced: pickupAddresses.delhiverySynced,
      delhiverySyncError: pickupAddresses.delhiverySyncError,
      ekartSynced: pickupAddresses.ekartSynced,
      ekartSyncError: pickupAddresses.ekartSyncError,
      pickup: {
        id: addresses.id,
        userId: addresses.userId,
        type: addresses.type,
        contactName: addresses.contactName,
        contactPhone: addresses.contactPhone,
        addressNickname: addresses.addressNickname,
        contactEmail: addresses.contactEmail,
        addressLine1: addresses.addressLine1,
        addressLine2: addresses.addressLine2,
        landmark: addresses.landmark,
        city: addresses.city,
        state: addresses.state,
        country: addresses.country,
        pincode: addresses.pincode,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
        gstNumber: addresses.gstNumber,
        createdAt: addresses.createdAt,
        updatedAt: addresses.updatedAt,
      },
      rto: sql /*sql*/ `
      CASE 
        WHEN ${pickupAddresses.isRTOSame} = false THEN (
          SELECT row_to_json(a)
          FROM addresses a
          WHERE a.id = ${pickupAddresses.rtoAddressId}
        )
        ELSE NULL
      END
    `.as('rto'),
    })
    .from(pickupAddresses)
    .innerJoin(addresses, eq(pickupAddresses.addressId, addresses.id))
    .where(whereClause)
    .orderBy(sortByClause)
    .limit(limit)
    .offset(offset)

  return { data: data as unknown as HydratedPickupAddress[], totalCount }
}
