import { sql } from 'drizzle-orm'
import { db } from '../client'
import { ekartWaybillSequences } from '../schema/ekartWaybillSequences'

type EkartWaybillBucket =
  | 'prepaid_upto_5kg'
  | 'cod_upto_5kg'
  | 'prepaid_above_5kg'
  | 'cod_above_5kg'

const WAYBILL_PREFIX_BY_BUCKET: Record<EkartWaybillBucket, string> = {
  prepaid_upto_5kg: 'ZCEP',
  cod_upto_5kg: 'ZCEC',
  prepaid_above_5kg: 'ZCFP',
  cod_above_5kg: 'ZCFC',
}

const SEQUENCE_PAD = 10
let ensureTablePromise: Promise<void> | null = null

async function ensureEkartWaybillSequencesTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = db
      .execute(sql`
        CREATE TABLE IF NOT EXISTS ekart_waybill_sequences (
          bucket varchar(50) PRIMARY KEY,
          last_sequence bigint NOT NULL DEFAULT 0,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null
        throw error
      })
  }

  await ensureTablePromise
}

export function resolveEkartWaybillBucket(paymentType: string | undefined, weightKg: number) {
  const normalizedPaymentType = String(paymentType || 'prepaid').trim().toLowerCase()
  const isCod = normalizedPaymentType === 'cod'
  const isAboveFiveKg = Number.isFinite(weightKg) && weightKg > 5

  if (isCod) {
    return isAboveFiveKg ? 'cod_above_5kg' : 'cod_upto_5kg'
  }

  return isAboveFiveKg ? 'prepaid_above_5kg' : 'prepaid_upto_5kg'
}

export async function reserveEkartWaybill(bucket: EkartWaybillBucket) {
  await ensureEkartWaybillSequencesTable()

  const [result] = await db
    .insert(ekartWaybillSequences)
    .values({
      bucket,
      lastSequence: 1,
    })
    .onConflictDoUpdate({
      target: ekartWaybillSequences.bucket,
      set: {
        lastSequence: sql`${ekartWaybillSequences.lastSequence} + 1`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ lastSequence: ekartWaybillSequences.lastSequence })

  const sequence = Number(result?.lastSequence ?? 1)
  return `${WAYBILL_PREFIX_BY_BUCKET[bucket]}${String(sequence).padStart(SEQUENCE_PAD, '0')}`
}
