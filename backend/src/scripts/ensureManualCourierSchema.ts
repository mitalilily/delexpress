import { sql } from 'drizzle-orm'
import { db } from '../models/client'

export async function ensureManualCourierSchema() {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS manual_couriers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      courier_id integer NOT NULL,
      name varchar(120) NOT NULL,
      service_provider varchar(50) NOT NULL DEFAULT 'manual',
      service_types jsonb NOT NULL DEFAULT '["b2c"]'::jsonb,
      pincodes text[] NOT NULL DEFAULT '{}',
      max_weight_kg numeric(10,3),
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      UNIQUE (courier_id, service_provider),
      UNIQUE (name, service_provider)
    );
    CREATE TABLE IF NOT EXISTS manual_courier_status_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL,
      order_type varchar(3) NOT NULL,
      manual_courier_id uuid REFERENCES manual_couriers(id),
      awb_number varchar(100),
      status varchar(60) NOT NULL,
      remarks varchar(500),
      created_by uuid,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS manual_courier_awb_sequences (
      manual_courier_id uuid PRIMARY KEY REFERENCES manual_couriers(id),
      next_value bigint NOT NULL DEFAULT 1,
      updated_at timestamp NOT NULL DEFAULT now()
    );
    ALTER TABLE b2c_orders ADD COLUMN IF NOT EXISTS manual_courier_id uuid;
    ALTER TABLE b2c_orders ADD COLUMN IF NOT EXISTS manual_awb_number varchar(100);
    ALTER TABLE b2b_orders ADD COLUMN IF NOT EXISTS manual_courier_id uuid;
    ALTER TABLE b2b_orders ADD COLUMN IF NOT EXISTS manual_awb_number varchar(100);
    CREATE INDEX IF NOT EXISTS manual_couriers_active_idx ON manual_couriers (is_active);
    CREATE INDEX IF NOT EXISTS manual_courier_events_order_idx ON manual_courier_status_events (order_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS b2c_orders_manual_courier_idx ON b2c_orders (manual_courier_id);
    CREATE INDEX IF NOT EXISTS b2b_orders_manual_courier_idx ON b2b_orders (manual_courier_id);
  `))
}

if (require.main === module) {
  ensureManualCourierSchema()
    .then(async () => {
      console.log('Manual courier schema is ready')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed to prepare manual courier schema', error)
      process.exit(1)
    })
}
