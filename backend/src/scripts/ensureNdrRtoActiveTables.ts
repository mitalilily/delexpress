import type { PoolClient } from 'pg'
import { pool } from '../models/client'

type ActiveIssueTableHealth = {
  ndr_order_index_exists: boolean
  ndr_awb_index_exists: boolean
  rto_order_index_exists: boolean
  rto_awb_index_exists: boolean
  ndr_has_duplicate_orders: boolean
  ndr_has_duplicate_awbs: boolean
  ndr_has_blank_awbs: boolean
  ndr_has_reattempt_action_rows: boolean
  ndr_has_action_rows: boolean
  rto_has_duplicate_orders: boolean
  rto_has_duplicate_awbs: boolean
  rto_has_blank_awbs: boolean
}

const ACTIVE_ISSUE_TABLE_HEALTH_SQL = `
  SELECT
    EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'ndr_events'
        AND indexname = 'ndr_events_order_id_unique'
    ) AS ndr_order_index_exists,
    EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'ndr_events'
        AND indexname = 'ndr_events_awb_number_unique'
    ) AS ndr_awb_index_exists,
    EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'rto_events'
        AND indexname = 'rto_events_order_id_unique'
    ) AS rto_order_index_exists,
    EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'rto_events'
        AND indexname = 'rto_events_awb_number_unique'
    ) AS rto_awb_index_exists,
    EXISTS (
      SELECT 1
      FROM (
        SELECT order_id
        FROM ndr_events
        GROUP BY order_id
        HAVING COUNT(*) > 1
      ) duplicate_ndr_orders
    ) AS ndr_has_duplicate_orders,
    EXISTS (
      SELECT 1
      FROM (
        SELECT awb_number
        FROM ndr_events
        WHERE awb_number IS NOT NULL
        GROUP BY awb_number
        HAVING COUNT(*) > 1
      ) duplicate_ndr_awbs
    ) AS ndr_has_duplicate_awbs,
    EXISTS (
      SELECT 1
      FROM ndr_events
      WHERE awb_number IS NOT NULL
        AND BTRIM(awb_number) = ''
    ) AS ndr_has_blank_awbs,
    EXISTS (
      SELECT 1
      FROM ndr_events
      WHERE COALESCE(LOWER(BTRIM(status)), '') = 'ndr_action'
        AND (
          COALESCE(LOWER(BTRIM(reason)), '') = 'merchant_reattempt_requested'
          OR COALESCE(LOWER(BTRIM(remarks)), '') = 'reattempt'
          OR COALESCE(LOWER(BTRIM(payload ->> 'action')), '') IN ('re-attempt', 're_attempt', 'reattempt')
        )
    ) AS ndr_has_reattempt_action_rows,
    EXISTS (
      SELECT 1
      FROM ndr_events
      WHERE COALESCE(LOWER(BTRIM(status)), '') = 'ndr_action'
    ) AS ndr_has_action_rows,
    EXISTS (
      SELECT 1
      FROM (
        SELECT order_id
        FROM rto_events
        GROUP BY order_id
        HAVING COUNT(*) > 1
      ) duplicate_rto_orders
    ) AS rto_has_duplicate_orders,
    EXISTS (
      SELECT 1
      FROM (
        SELECT awb_number
        FROM rto_events
        WHERE awb_number IS NOT NULL
        GROUP BY awb_number
        HAVING COUNT(*) > 1
      ) duplicate_rto_awbs
    ) AS rto_has_duplicate_awbs,
    EXISTS (
      SELECT 1
      FROM rto_events
      WHERE awb_number IS NOT NULL
        AND BTRIM(awb_number) = ''
    ) AS rto_has_blank_awbs
`

const REBUILD_NDR_ACTIVE_ROWS_SQL = `
  LOCK TABLE ndr_events IN ACCESS EXCLUSIVE MODE;

  UPDATE ndr_events
  SET awb_number = NULL
  WHERE awb_number IS NOT NULL
    AND BTRIM(awb_number) = '';

  CREATE TEMP TABLE tmp_ndr_events_canonical ON COMMIT DROP AS
  WITH ranked_all AS (
    SELECT
      e.*,
      COALESCE(e.updated_at, e.created_at) AS last_event_time,
      ROW_NUMBER() OVER (
        PARTITION BY e.order_id
        ORDER BY COALESCE(e.updated_at, e.created_at) DESC, e.created_at DESC, e.id DESC
      ) AS overall_rank
    FROM ndr_events e
  ),
  active_rows AS (
    SELECT
      r.*,
      ROW_NUMBER() OVER (
        PARTITION BY r.order_id
        ORDER BY r.last_event_time DESC, r.created_at DESC, r.id DESC
      ) AS active_rank,
      MIN(r.created_at) OVER (PARTITION BY r.order_id) AS first_created_at,
      MAX(r.last_event_time) OVER (PARTITION BY r.order_id) AS final_updated_at,
      MAX(NULLIF(BTRIM(r.awb_number), '')) OVER (PARTITION BY r.order_id) AS fallback_awb_number
    FROM ranked_all r
    WHERE COALESCE(LOWER(BTRIM(r.status)), '') <> 'ndr_action'
  ),
  latest_reattempt_orders AS (
    SELECT latest.order_id
    FROM ranked_all latest
    WHERE latest.overall_rank = 1
      AND COALESCE(LOWER(BTRIM(latest.status)), '') = 'ndr_action'
      AND (
        COALESCE(LOWER(BTRIM(latest.reason)), '') = 'merchant_reattempt_requested'
        OR COALESCE(LOWER(BTRIM(latest.remarks)), '') = 'reattempt'
        OR COALESCE(LOWER(BTRIM(latest.payload ->> 'action')), '') IN ('re-attempt', 're_attempt', 'reattempt')
      )
  )
  SELECT
    a.id,
    a.order_id,
    a.user_id,
    COALESCE(NULLIF(BTRIM(a.awb_number), ''), a.fallback_awb_number) AS awb_number,
    a.status,
    NULLIF(BTRIM(a.reason), '') AS reason,
    NULLIF(BTRIM(a.remarks), '') AS remarks,
    NULLIF(BTRIM(a.attempt_no), '') AS attempt_no,
    a.payload,
    a.first_created_at AS created_at,
    a.final_updated_at AS updated_at
  FROM active_rows a
  WHERE a.active_rank = 1
    AND NOT EXISTS (
      SELECT 1
      FROM latest_reattempt_orders r
      WHERE r.order_id = a.order_id
    );

  TRUNCATE TABLE ndr_events;

  INSERT INTO ndr_events (
    id,
    order_id,
    user_id,
    awb_number,
    status,
    reason,
    remarks,
    attempt_no,
    payload,
    created_at,
    updated_at
  )
  SELECT
    id,
    order_id,
    user_id,
    awb_number,
    status,
    reason,
    remarks,
    attempt_no,
    payload,
    created_at,
    updated_at
  FROM tmp_ndr_events_canonical;

  CREATE UNIQUE INDEX IF NOT EXISTS ndr_events_order_id_unique ON ndr_events(order_id);
  CREATE UNIQUE INDEX IF NOT EXISTS ndr_events_awb_number_unique ON ndr_events(awb_number);
`

const REBUILD_RTO_ACTIVE_ROWS_SQL = `
  LOCK TABLE rto_events IN ACCESS EXCLUSIVE MODE;

  UPDATE rto_events
  SET awb_number = NULL
  WHERE awb_number IS NOT NULL
    AND BTRIM(awb_number) = '';

  CREATE TEMP TABLE tmp_rto_events_canonical ON COMMIT DROP AS
  WITH ranked_rows AS (
    SELECT
      e.*,
      COALESCE(e.updated_at, e.created_at) AS last_event_time,
      ROW_NUMBER() OVER (
        PARTITION BY e.order_id
        ORDER BY COALESCE(e.updated_at, e.created_at) DESC, e.created_at DESC, e.id DESC
      ) AS row_rank,
      MIN(e.created_at) OVER (PARTITION BY e.order_id) AS first_created_at,
      MAX(COALESCE(e.updated_at, e.created_at)) OVER (PARTITION BY e.order_id) AS final_updated_at,
      MAX(NULLIF(BTRIM(e.awb_number), '')) OVER (PARTITION BY e.order_id) AS fallback_awb_number,
      MAX(e.rto_charges) OVER (PARTITION BY e.order_id) AS fallback_rto_charges
    FROM rto_events e
  )
  SELECT
    r.id,
    r.order_id,
    r.user_id,
    COALESCE(NULLIF(BTRIM(r.awb_number), ''), r.fallback_awb_number) AS awb_number,
    r.status,
    NULLIF(BTRIM(r.reason), '') AS reason,
    NULLIF(BTRIM(r.remarks), '') AS remarks,
    COALESCE(r.rto_charges, r.fallback_rto_charges) AS rto_charges,
    r.payload,
    r.first_created_at AS created_at,
    r.final_updated_at AS updated_at
  FROM ranked_rows r
  WHERE r.row_rank = 1;

  TRUNCATE TABLE rto_events;

  INSERT INTO rto_events (
    id,
    order_id,
    user_id,
    awb_number,
    status,
    reason,
    remarks,
    rto_charges,
    payload,
    created_at,
    updated_at
  )
  SELECT
    id,
    order_id,
    user_id,
    awb_number,
    status,
    reason,
    remarks,
    rto_charges,
    payload,
    created_at,
    updated_at
  FROM tmp_rto_events_canonical;

  CREATE UNIQUE INDEX IF NOT EXISTS rto_events_order_id_unique ON rto_events(order_id);
  CREATE UNIQUE INDEX IF NOT EXISTS rto_events_awb_number_unique ON rto_events(awb_number);
`

const needsActiveIssueTableRepair = (state?: ActiveIssueTableHealth) =>
  Boolean(
    state &&
      (
        !state.ndr_order_index_exists ||
        !state.ndr_awb_index_exists ||
        !state.rto_order_index_exists ||
        !state.rto_awb_index_exists ||
        state.ndr_has_duplicate_orders ||
        state.ndr_has_duplicate_awbs ||
        state.ndr_has_blank_awbs ||
        state.ndr_has_reattempt_action_rows ||
        state.ndr_has_action_rows ||
        state.rto_has_duplicate_orders ||
        state.rto_has_duplicate_awbs ||
        state.rto_has_blank_awbs
      ),
  )

export async function ensureNdrRtoActiveTables(existingClient?: PoolClient) {
  const client = existingClient ?? (await pool.connect())

  try {
    const healthResult = await client.query<ActiveIssueTableHealth>(ACTIVE_ISSUE_TABLE_HEALTH_SQL)
    const health = healthResult.rows[0]

    if (!needsActiveIssueTableRepair(health)) {
      return
    }

    console.warn(
      '[startup] Active NDR/RTO table repair is required. Rebuilding current shipment issue rows before serving requests.',
      health,
    )

    await client.query('BEGIN')
    await client.query(REBUILD_NDR_ACTIVE_ROWS_SQL)
    await client.query(REBUILD_RTO_ACTIVE_ROWS_SQL)
    await client.query('COMMIT')

    console.log('[startup] Active NDR/RTO table repair completed successfully.')
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Preserve the original startup failure.
    }

    throw error
  } finally {
    if (!existingClient) {
      client.release()
    }
  }
}
