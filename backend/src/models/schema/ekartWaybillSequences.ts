import { bigint, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const ekartWaybillSequences = pgTable('ekart_waybill_sequences', {
  bucket: varchar('bucket', { length: 50 }).primaryKey(),
  lastSequence: bigint('last_sequence', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
