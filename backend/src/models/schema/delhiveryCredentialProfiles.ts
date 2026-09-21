import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

/**
 * Delhivery credentials are versioned because a token cannot be replaced while
 * older AWBs still need polling or post-booking actions.
 */
export const delhiveryCredentialProfiles = pgTable('delhivery_credential_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 100 }).notNull(),
  apiBase: varchar('api_base', { length: 255 }).notNull().default('https://track.delhivery.com'),
  clientName: varchar('client_name', { length: 255 }).notNull().default(''),
  apiKey: varchar('api_key', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  retiredAt: timestamp('retired_at', { withTimezone: true }),
})
