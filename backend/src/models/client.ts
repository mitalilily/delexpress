import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as path from 'path' // ✅ use this instead of `import path from 'path'`
import { Pool } from 'pg'
import type { PoolClient } from 'pg'
import * as schema from '../schema/schema'
import { ensureCodRemittanceTypeSchema } from '../scripts/ensureCodRemittanceTypeSchema'
import { ensureNdrRtoActiveTables } from '../scripts/ensureNdrRtoActiveTables'

// Load environment file based on NODE_ENV
const env = process.env.NODE_ENV || 'development'
console.log('ENVIRONMENT', env)
const envFilePath = path.resolve(__dirname, `../../.env.${env}`)

console.log(`🔍 Loading env file: ${envFilePath}`)
dotenv.config({ path: envFilePath })

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is missing')
}

const databaseUrl = process.env.DATABASE_URL as string
const shouldUseSsl =
  process.env.PGSSLMODE === 'require' ||
  env === 'production' ||
  /render\.com|railway\.app|supabase\.co/i.test(databaseUrl)

const DEFAULT_LOCK_TIMEOUT_MS = Number(process.env.PG_LOCK_TIMEOUT_MS || 10_000)
const DEFAULT_IDLE_IN_TX_TIMEOUT_MS = Number(
  process.env.PG_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS || 60_000,
)
const DEFAULT_STATEMENT_TIMEOUT_MS = Number(process.env.PG_STATEMENT_TIMEOUT_MS || 0)

const toTimeoutLiteral = (ms: number) => `${Math.max(0, Math.floor(ms))}ms`

async function applySessionGuards(client: PoolClient) {
  // Fail fast instead of letting one blocked statement hold the request open for minutes.
  await client.query(`SET lock_timeout = '${toTimeoutLiteral(DEFAULT_LOCK_TIMEOUT_MS)}'`)
  // Kill sessions that sit inside a transaction without making progress.
  await client.query(
    `SET idle_in_transaction_session_timeout = '${toTimeoutLiteral(DEFAULT_IDLE_IN_TX_TIMEOUT_MS)}'`,
  )

  if (DEFAULT_STATEMENT_TIMEOUT_MS > 0) {
    await client.query(`SET statement_timeout = '${toTimeoutLiteral(DEFAULT_STATEMENT_TIMEOUT_MS)}'`)
  }

  await client.query(`SET application_name = 'expressopro-backend'`)
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
})

// console.log('DEBUG: pool created?', !!pool, 'pool.constructor.name=', pool?.constructor?.name)

export const db = drizzle(pool, {
  schema: schema,
})

pool.on('connect', (client) => {
  void applySessionGuards(client).catch((err) => {
    console.error('❌ Failed to apply Postgres session guardrails:', {
      message: err?.message,
      stack: err?.stack,
    })
  })
})

// ✅ New function you can call explicitly in scripts
export function initPool() {
  console.log('ℹ️ initPool called')
  return { pool, db }
}

// Surface unexpected pool-level errors
pool.on('error', (err) => {
  console.error('❌ PG Pool error:', {
    message: err?.message,
    stack: err?.stack,
  })
})

/**
 * Test database connection on startup
 * Returns true if connection succeeds, false otherwise
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    try {
      await applySessionGuards(client)
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version')
      const { current_time, pg_version } = result.rows[0]
      console.log('✅ Database connection succeeded')
      await ensureCodRemittanceTypeSchema(client)
      await ensureNdrRtoActiveTables(client)
      
      // Parse PostgreSQL version (format: "PostgreSQL 15.3 on x86_64...")
      const versionMatch = pg_version.match(/PostgreSQL\s+([\d.]+)/)
      const version = versionMatch ? versionMatch[1] : 'unknown'
      console.log(`   PostgreSQL version: ${version}`)
      console.log(`   Server time: ${current_time}`)
      
      return true
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error('❌ Database connection failed:')
    console.error(`   Error: ${err.message}`)
    if (err.code) {
      console.error(`   Code: ${err.code}`)
    }
    if (err.host) {
      console.error(`   Host: ${err.host}`)
    }
    if (err.port) {
      console.error(`   Port: ${err.port}`)
    }
    if (process.env.NODE_ENV === 'development' && err.stack) {
      console.error(`   Stack: ${err.stack}`)
    }
    return false
  }
}
