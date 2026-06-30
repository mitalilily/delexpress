import type { PoolClient } from 'pg'
import { pool } from '../models/client'

const CREATE_COD_REMITTANCE_TYPE_SQL = `
DO $$
BEGIN
  CREATE TYPE cod_remittance_type AS ENUM ('cod', 'cancellation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
`

const ADD_REMITTANCE_TYPE_COLUMN_SQL = `
ALTER TABLE cod_remittances
ADD COLUMN IF NOT EXISTS remittance_type cod_remittance_type NOT NULL DEFAULT 'cod';
`

const BACKFILL_REMITTANCE_TYPE_SQL = `
UPDATE cod_remittances
SET remittance_type = 'cod'
WHERE remittance_type IS NULL;
`

export async function ensureCodRemittanceTypeSchema(existingClient?: PoolClient) {
  const client = existingClient ?? (await pool.connect())

  try {
    const result = await client.query<{
      exists: boolean
    }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'cod_remittances'
            AND column_name = 'remittance_type'
        ) AS exists
      `,
    )

    if (result.rows[0]?.exists) {
      await client.query(BACKFILL_REMITTANCE_TYPE_SQL)
      return
    }

    console.warn(
      '[startup] cod_remittances.remittance_type is missing. Applying the COD remittance type migration before serving requests.',
    )

    await client.query('BEGIN')
    await client.query(CREATE_COD_REMITTANCE_TYPE_SQL)
    await client.query(ADD_REMITTANCE_TYPE_COLUMN_SQL)
    await client.query(BACKFILL_REMITTANCE_TYPE_SQL)
    await client.query('COMMIT')

    console.log('[startup] COD remittance type migration applied successfully.')
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Ignore rollback failures so the original startup error is preserved.
    }

    throw error
  } finally {
    if (!existingClient) {
      client.release()
    }
  }
}
