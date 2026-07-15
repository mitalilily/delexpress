import { bigint, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const ekartWaybillSequences = pgTable('ekart_waybill_sequences', {
  bucket: varchar('bucket', { length: 50 }).primaryKey(),
  prefix: varchar('prefix', { length: 30 }).notNull().default(''),
  sequencePad: integer('sequence_pad').notNull().default(10),
  lastSequence: bigint('last_sequence', { mode: 'number' }).notNull().default(0),
  usedCount: bigint('used_count', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
