import { decimal, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

// COD Remittance Status - Razorpay payout integrated
export const codRemittanceStatusEnum = pgEnum('cod_remittance_status', [
  'pending', // COD collected, awaiting Razorpay payout
  'credited', // Amount paid out to merchant
])

export const codRemittanceTypeEnum = pgEnum('cod_remittance_type', [
  'cod',
  'cancellation',
])

/**
 * COD Remittances Table - SIMPLIFIED VERSION
 * Tracks individual COD order remittances from courier to merchant
 */
export const codRemittances = pgTable('cod_remittances', {
  id: uuid('id').primaryKey().defaultRandom(),

  // User reference
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  // Order references
  orderId: uuid('order_id').notNull(),
  orderType: varchar('order_type', { length: 10 }).notNull(), // 'b2c' | 'b2b'
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  awbNumber: varchar('awb_number', { length: 100 }),
  remittanceType: codRemittanceTypeEnum('remittance_type').default('cod').notNull(),

  // Courier info
  courierPartner: varchar('courier_partner', { length: 50 }),

  // Financial details
  codAmount: decimal('cod_amount', { precision: 12, scale: 2 }).notNull(), // Total COD collected
  codCharges: decimal('cod_charges', { precision: 12, scale: 2 }).default('0').notNull(),
  shippingCharges: decimal('shipping_charges', { precision: 12, scale: 2 }).default('0').notNull(),
  deductions: decimal('deductions', { precision: 12, scale: 2 }).default('0').notNull(),
  remittableAmount: decimal('remittable_amount', { precision: 12, scale: 2 }).notNull(),

  // Remittance tracking
  status: codRemittanceStatusEnum('status').default('pending').notNull(),
  collectedAt: timestamp('collected_at'),
  creditedAt: timestamp('credited_at'), // When payout was initiated

  // Legacy wallet transaction reference; COD payouts no longer create panel wallet credits.
  walletTransactionId: uuid('wallet_transaction_id'),
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
