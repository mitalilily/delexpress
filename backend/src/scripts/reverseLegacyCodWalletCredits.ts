import { sql } from 'drizzle-orm'
import { db } from '../models/client'

const APPLY = String(process.env.APPLY_LEGACY_COD_WALLET_REVERSAL || '').toLowerCase() === 'true'

type LegacyCodWalletCredit = {
  remittance_id: string
  order_id: string
  order_number: string
  user_id: string
  wallet_transaction_id: string
  wallet_id: string
  amount: string
  currency: string | null
  wallet_balance: string
  credited_at: Date | string | null
  notes: string | null
}

const getRows = <T>(result: unknown): T[] => {
  if (Array.isArray(result)) return result as T[]
  const rows = (result as any)?.rows
  return Array.isArray(rows) ? rows : []
}

const fetchLegacyCredits = async (tx: any = db) => {
  const result = await tx.execute(sql`
    select
      cr.id as remittance_id,
      cr.order_id,
      cr.order_number,
      cr.user_id,
      cr.wallet_transaction_id,
      wt.wallet_id,
      wt.amount,
      wt.currency,
      w.balance as wallet_balance,
      cr.credited_at,
      cr.notes
    from cod_remittances cr
    join wallet_transactions wt on wt.id = cr.wallet_transaction_id
    join wallets w on w.id = wt.wallet_id
    where
      cr.wallet_transaction_id is not null
      and wt.type = 'credit'
      and (
        lower(coalesce(wt.reason, '')) like '%cod settlement%'
        or lower(coalesce(wt.reason, '')) like '%cod remittance%'
        or wt.meta ? 'remittanceId'
        or wt.meta ? 'codRemittanceId'
        or wt.meta ? 'cod_remittance_id'
      )
    order by wt.created_at
  `)

  return getRows<LegacyCodWalletCredit>(result)
}

const reverseLegacyCredit = async (row: LegacyCodWalletCredit) => {
  const amount = Number(row.amount)
  const walletBalance = Number(row.wallet_balance)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid legacy wallet credit amount for ${row.remittance_id}: ${row.amount}`)
  }
  if (!Number.isFinite(walletBalance) || walletBalance < amount) {
    throw new Error(
      `Wallet ${row.wallet_id} balance ${row.wallet_balance} is lower than legacy COD credit ${row.amount}`,
    )
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${row.remittance_id}))`)

    const reversalCheck = await tx.execute(sql`
      select id
      from wallet_transactions
      where
        type = 'debit'
        and meta->>'legacyCodWalletTransactionId' = ${row.wallet_transaction_id}
      limit 1
    `)
    if (getRows(reversalCheck).length) {
      console.log(`Skipping ${row.order_number}: reversal already exists`)
      return
    }

    await tx.execute(sql`
      update wallets
      set
        balance = (balance::numeric - ${amount})::numeric(14, 2),
        "updatedAt" = now()
      where id = ${row.wallet_id}
    `)

    await tx.execute(sql`
      insert into wallet_transactions (
        wallet_id,
        amount,
        currency,
        type,
        ref,
        reason,
        meta,
        created_at
      )
      values (
        ${row.wallet_id},
        ${amount},
        ${row.currency || 'INR'},
        'debit',
        ${row.order_id},
        ${`Legacy COD wallet settlement reversal - ${row.order_number}`},
        jsonb_build_object(
          'remittanceId', ${row.remittance_id},
          'legacyCodWalletTransactionId', ${row.wallet_transaction_id},
          'reason', 'COD remittance must be paid through Razorpay payout, not panel wallet'
        ),
        now()
      )
    `)

    await tx.execute(sql`
      update cod_remittances
      set
        status = 'pending',
        credited_at = null,
        wallet_transaction_id = null,
        notes = concat(
          coalesce(notes, ''),
          case when coalesce(notes, '') = '' then '' else E'\n' end,
          ${`Legacy panel wallet credit ${row.wallet_transaction_id} reversed. Awaiting Razorpay payout.`}
        ),
        updated_at = now()
      where id = ${row.remittance_id}
    `)
  })
}

async function main() {
  const legacyCredits = await fetchLegacyCredits()
  console.log(
    JSON.stringify(
      {
        apply: APPLY,
        legacyCredits: legacyCredits.map((row) => ({
          remittanceId: row.remittance_id,
          orderNumber: row.order_number,
          userId: row.user_id,
          walletTransactionId: row.wallet_transaction_id,
          walletId: row.wallet_id,
          amount: row.amount,
          walletBalance: row.wallet_balance,
        })),
      },
      null,
      2,
    ),
  )

  if (!APPLY) {
    console.log('Dry run only. Set APPLY_LEGACY_COD_WALLET_REVERSAL=true to reverse these credits.')
    return
  }

  for (const row of legacyCredits) {
    await reverseLegacyCredit(row)
    console.log(`Reversed legacy COD wallet credit for ${row.order_number}`)
  }

  const remaining = await fetchLegacyCredits()
  console.log(`Remaining legacy COD wallet credits: ${remaining.length}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
