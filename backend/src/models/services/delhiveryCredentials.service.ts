import { and, eq, isNull, notInArray, or, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db } from '../client'
import { courier_credentials } from '../schema/courierCredentials'
import { delhiveryCredentialProfiles } from '../schema/delhiveryCredentialProfiles'
import { b2b_orders } from '../schema/b2bOrders'
import { b2c_orders } from '../schema/b2cOrders'

const DEFAULT_DELHIVERY_API_BASE = 'https://track.delhivery.com'

export interface DelhiveryCredentials {
  apiBase: string
  clientName: string
  apiKey: string
}

export interface DelhiveryCredentialProfile extends DelhiveryCredentials {
  id: string
  label: string
  isActive: boolean
}

let profileTableReady: Promise<void> | null = null

export const ensureDelhiveryCredentialProfileStorage = async () => {
  if (!profileTableReady) {
    profileTableReady = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS delhivery_credential_profiles (
          id uuid PRIMARY KEY,
          label varchar(100) NOT NULL,
          api_base varchar(255) NOT NULL DEFAULT 'https://track.delhivery.com',
          client_name varchar(255) NOT NULL DEFAULT '',
          api_key varchar(255) NOT NULL,
          is_active boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now(),
          retired_at timestamptz
        )
      `)
      await db.execute(sql`ALTER TABLE b2c_orders ADD COLUMN IF NOT EXISTS delhivery_credential_profile_id uuid`)
      await db.execute(sql`ALTER TABLE b2b_orders ADD COLUMN IF NOT EXISTS delhivery_credential_profile_id uuid`)
      await db.execute(sql`ALTER TABLE pickup_addresses ADD COLUMN IF NOT EXISTS "delhiveryNewAccountSynced" boolean NOT NULL DEFAULT false`)
      await db.execute(sql`ALTER TABLE pickup_addresses ADD COLUMN IF NOT EXISTS "delhiveryNewAccountSyncError" text`)
      await db.execute(sql`ALTER TABLE pickup_addresses ADD COLUMN IF NOT EXISTS "delhiveryNewAccountWarehouseName" varchar(255)`)
    })().catch((error) => {
      profileTableReady = null
      throw error
    })
  }
  await profileTableReady
}

export const getDelhiveryCredentialProfile = async (
  profileId?: string | null,
): Promise<DelhiveryCredentialProfile | null> => {
  await ensureDelhiveryCredentialProfileStorage()
  const [profile] = await db
    .select()
    .from(delhiveryCredentialProfiles)
    .where(profileId ? eq(delhiveryCredentialProfiles.id, profileId) : eq(delhiveryCredentialProfiles.isActive, true))
    .limit(1)

  return profile
    ? {
        id: profile.id,
        label: profile.label,
        apiBase: profile.apiBase,
        clientName: profile.clientName,
        apiKey: profile.apiKey,
        isActive: profile.isActive,
      }
    : null
}

export const cutoverDelhiveryCredential = async (next: {
  apiBase: string
  clientName: string
  apiKey: string
}) => {
  await ensureDelhiveryCredentialProfileStorage()
  const [current] = await db
    .select()
    .from(courier_credentials)
    .where(eq(courier_credentials.provider, 'delhivery'))
    .limit(1)

  if (!current?.apiKey) {
    throw new Error('The existing Delhivery credential is missing; refusing an unprotected cutover.')
  }

  if (current.apiKey === next.apiKey) {
    await db
      .update(courier_credentials)
      .set({ apiBase: next.apiBase, clientName: next.clientName, updatedAt: new Date() })
      .where(eq(courier_credentials.provider, 'delhivery'))
    const active = await getDelhiveryCredentialProfile()
    return { oldProfileId: active?.id || null, newProfileId: active?.id || null, changed: false }
  }

  const oldProfile = await db.transaction(async (tx) => {
    const terminalStatuses = ['delivered', 'cancelled', 'rto_delivered']
    const [existingOld] = await tx
      .select()
      .from(delhiveryCredentialProfiles)
      .where(eq(delhiveryCredentialProfiles.apiKey, current.apiKey))
      .limit(1)

    const [archived] = existingOld
      ? await tx
          .update(delhiveryCredentialProfiles)
          .set({ isActive: false, retiredAt: new Date() })
          .where(eq(delhiveryCredentialProfiles.id, existingOld.id))
          .returning()
      : await tx
          .insert(delhiveryCredentialProfiles)
          .values({
            id: randomUUID(),
            label: 'Delhivery legacy account',
            apiBase: current.apiBase || 'https://track.delhivery.com',
            clientName: current.clientName || '',
            apiKey: current.apiKey,
            isActive: false,
            retiredAt: new Date(),
          })
          .returning()

    await tx
      .update(delhiveryCredentialProfiles)
      .set({ isActive: false, retiredAt: new Date() })
      .where(eq(delhiveryCredentialProfiles.isActive, true))

    const [created] = await tx
      .insert(delhiveryCredentialProfiles)
      .values({
        id: randomUUID(),
        label: 'Delhivery active account',
        apiBase: next.apiBase,
        clientName: next.clientName,
        apiKey: next.apiKey,
        isActive: true,
      })
      .returning()

    await tx
      .update(courier_credentials)
      .set({ apiBase: next.apiBase, clientName: next.clientName, apiKey: next.apiKey, updatedAt: new Date() })
      .where(eq(courier_credentials.provider, 'delhivery'))

    await tx
      .update(b2c_orders)
      .set({ delhivery_credential_profile_id: archived.id })
      .where(
        and(
          eq(b2c_orders.integration_type, 'delhivery'),
          isNull(b2c_orders.delhivery_credential_profile_id),
          or(isNull(b2c_orders.order_status), notInArray(b2c_orders.order_status, terminalStatuses)),
        ),
      )
    await tx
      .update(b2b_orders)
      .set({ delhivery_credential_profile_id: archived.id })
      .where(
        and(
          isNull(b2b_orders.delhivery_credential_profile_id),
          or(isNull(b2b_orders.order_status), notInArray(b2b_orders.order_status, terminalStatuses)),
          sql`lower(${b2b_orders.courier_partner}) like '%delhivery%'`,
        ),
      )

    return { archived, created }
  })

  return {
    oldProfileId: oldProfile.archived.id,
    newProfileId: oldProfile.created.id,
    changed: true,
  }
}

export const getDelhiveryCredentials = async (): Promise<DelhiveryCredentials> => {
  await ensureDelhiveryCredentialProfileStorage()
  const activeProfile = await getDelhiveryCredentialProfile()
  if (activeProfile) return activeProfile
  const [credentials] = await db
    .select({
      apiBase: courier_credentials.apiBase,
      clientName: courier_credentials.clientName,
      apiKey: courier_credentials.apiKey,
    })
    .from(courier_credentials)
    .where(eq(courier_credentials.provider, 'delhivery'))
    .limit(1)

  return {
    apiBase: credentials?.apiBase || DEFAULT_DELHIVERY_API_BASE,
    clientName: credentials?.clientName || '',
    apiKey: credentials?.apiKey || '',
  }
}
