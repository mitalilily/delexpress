import { eq, sql } from 'drizzle-orm'
import { db } from '../models/client'
import { b2c_orders } from '../models/schema/b2cOrders'
import { debitManifestSuccessChargeIfNeeded } from '../models/services/shiprocket.service'

const APPLY = process.argv.includes('--apply')
const TARGET_DATABASE = String(process.env.EXPRESSOPRO_TARGET_DATABASE || 'delexpress').trim()

type CandidateRow = {
  id: string
  order_number: string
  user_id: string
  email: string | null
  order_status: string | null
  stored_cod_charges: string | number | null
  existing_original_debit: string | number | null
  existing_cod_component: string | number | null
}

type WalletDebitSummary = {
  total_original_debit: string | number | null
  total_manifest_refund: string | number | null
}

const getRows = <T>(result: unknown): T[] => {
  if (Array.isArray(result)) return result as T[]
  const rows = (result as any)?.rows
  return Array.isArray(rows) ? rows : []
}

const toAmount = (value: unknown) => {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

const getManifestFailureRefundReason = (orderNumber: string | null | undefined) =>
  `Refund for manifest failed order #${String(orderNumber || '').trim() || 'unknown'}`

async function ensureTargetDatabase() {
  const result = await db.execute(sql`select current_database() as database_name`)
  const databaseName = String(getRows<{ database_name: string }>(result)[0]?.database_name || '').trim()

  if (databaseName !== TARGET_DATABASE) {
    throw new Error(
      `Refusing to run outside Delexpress database. Expected ${TARGET_DATABASE}, received ${databaseName || 'unknown'}.`,
    )
  }

  return databaseName
}

async function fetchCandidates() {
  const result = await db.execute(sql`
    select
      o.id,
      o.order_number,
      o.user_id,
      u.email,
      o.order_status,
      o.cod_charges as stored_cod_charges,
      coalesce(
        sum(
          case
            when wt.type = 'debit'
              and wt.reason in ('B2C Prepaid Order Payment', 'B2C COD Service Charges')
            then wt.amount
            else 0
          end
        ),
        0
      ) as existing_original_debit,
      coalesce(
        sum(
          case
            when wt.type = 'debit'
              and wt.reason = 'B2C COD Service Charges'
            then coalesce((wt.meta->>'cod_charges')::numeric, 0)
            else 0
          end
        ),
        0
      ) as existing_cod_component
    from b2c_orders o
    left join users u on u.id = o.user_id
    left join wallets w on w."userId" = o.user_id
    left join wallet_transactions wt on wt.wallet_id = w.id and wt.ref = cast(o.id as text)
    where
      lower(coalesce(o.order_type, '')) = 'cod'
      and lower(coalesce(o.integration_type, '')) = 'delhivery'
      and o.label is not null
      and lower(coalesce(o.order_status, '')) not in ('cancelled', 'manifest_failed')
    group by o.id, o.order_number, o.user_id, u.email, o.order_status, o.cod_charges, o.created_at
    having
      coalesce(o.cod_charges, 0) <= 0
      or coalesce(
        sum(
          case
            when wt.type = 'debit'
              and wt.reason in ('B2C Prepaid Order Payment', 'B2C COD Service Charges')
            then wt.amount
            else 0
          end
        ),
        0
      ) = 0
      or coalesce(
        sum(
          case
            when wt.type = 'debit'
              and wt.reason = 'B2C COD Service Charges'
            then coalesce((wt.meta->>'cod_charges')::numeric, 0)
            else 0
          end
        ),
        0
      ) <= 0
    order by o.created_at asc
  `)

  return getRows<CandidateRow>(result)
}

async function getWalletDebitSummary(tx: any, orderId: string, userId: string, orderNumber: string) {
  const result = await tx.execute(sql`
    select
      coalesce(
        sum(
          case
            when wt.type = 'debit'
              and wt.reason in ('B2C Prepaid Order Payment', 'B2C COD Service Charges')
            then wt.amount
            else 0
          end
        ),
        0
      ) as total_original_debit,
      coalesce(
        sum(
          case
            when wt.type = 'credit'
              and wt.reason = ${getManifestFailureRefundReason(orderNumber)}
            then wt.amount
            else 0
          end
        ),
        0
      ) as total_manifest_refund
    from wallet_transactions wt
    join wallets w on w.id = wt.wallet_id
    where w."userId" = ${userId} and wt.ref = ${orderId}
  `)

  const row = getRows<WalletDebitSummary>(result)[0]
  const totalOriginalDebit = toAmount(row?.total_original_debit)
  const totalManifestRefund = toAmount(row?.total_manifest_refund)

  return {
    totalOriginalDebit,
    totalManifestRefund,
    netCharged: totalOriginalDebit - totalManifestRefund,
  }
}

async function processCandidate(candidate: CandidateRow) {
  try {
    return await db.transaction(async (tx) => {
      const [order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.id, candidate.id)).limit(1)
      if (!order) {
        return {
          orderNumber: candidate.order_number,
          email: candidate.email,
          changed: false,
          reason: 'order_not_found',
        }
      }

      const before = await getWalletDebitSummary(tx, order.id, order.user_id, order.order_number)
      await debitManifestSuccessChargeIfNeeded({ tx, order })
      const [refreshedOrder] = await tx
        .select()
        .from(b2c_orders)
        .where(eq(b2c_orders.id, candidate.id))
        .limit(1)
      const after = await getWalletDebitSummary(tx, order.id, order.user_id, order.order_number)

      return {
        orderNumber: order.order_number,
        email: candidate.email,
        changed: after.netCharged - before.netCharged > 0.009,
        addedDebit: Number((after.netCharged - before.netCharged).toFixed(2)),
        storedCodBefore: toAmount(candidate.stored_cod_charges),
        storedCodAfter: toAmount(refreshedOrder?.cod_charges),
        netChargedBefore: Number(before.netCharged.toFixed(2)),
        netChargedAfter: Number(after.netCharged.toFixed(2)),
      }
    })
  } catch (error: any) {
    return {
      orderNumber: candidate.order_number,
      email: candidate.email,
      changed: false,
      error: error?.message || String(error),
      storedCodBefore: toAmount(candidate.stored_cod_charges),
      existingOriginalDebit: toAmount(candidate.existing_original_debit),
      existingCodComponent: toAmount(candidate.existing_cod_component),
    }
  }
}

async function main() {
  const databaseName = await ensureTargetDatabase()
  const candidates = await fetchCandidates()

  console.log(
    JSON.stringify(
      {
        apply: APPLY,
        database: databaseName,
        candidateCount: candidates.length,
        candidates: candidates.map((candidate) => ({
          orderNumber: candidate.order_number,
          email: candidate.email,
          status: candidate.order_status,
          storedCodCharges: toAmount(candidate.stored_cod_charges),
          existingOriginalDebit: toAmount(candidate.existing_original_debit),
          existingCodComponent: toAmount(candidate.existing_cod_component),
        })),
      },
      null,
      2,
    ),
  )

  if (!APPLY) {
    console.log('Dry run only. Re-run with --apply to create the missing Expressopro COD wallet debits.')
    return
  }

  const results = []
  for (const candidate of candidates) {
    const result = await processCandidate(candidate)
    results.push(result)
    console.log(JSON.stringify(result))
  }

  const changed = results.filter((result: any) => result.changed)
  const failed = results.filter((result: any) => result.error)
  const totalAddedDebit = changed.reduce((sum: number, result: any) => sum + toAmount(result.addedDebit), 0)

  console.log(
    JSON.stringify(
      {
        database: databaseName,
        processed: results.length,
        changed: changed.length,
        failed: failed.length,
        totalAddedDebit: Number(totalAddedDebit.toFixed(2)),
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
