import { sql } from 'drizzle-orm'
import { db } from '../client'
import { ekartWaybillSequences } from '../schema/ekartWaybillSequences'

export type EkartWaybillBucket =
  | 'prepaid_upto_5kg'
  | 'cod_upto_5kg'
  | 'prepaid_above_5kg'
  | 'cod_above_5kg'

type EkartWaybillSeriesConfig = {
  label: string
  defaultSeries: string
}

export type EkartWaybillSeriesStatus = {
  bucket: EkartWaybillBucket
  label: string
  series: string
  prefix: string
  sequencePad: number
  lastSequence: number
  usedCount: number
  nextAwb: string
}

export type EkartWaybillSeriesInput = Partial<Record<EkartWaybillBucket, string>>

const WAYBILL_BUCKETS: EkartWaybillBucket[] = [
  'prepaid_upto_5kg',
  'cod_upto_5kg',
  'prepaid_above_5kg',
  'cod_above_5kg',
]

const WAYBILL_SERIES_BY_BUCKET: Record<EkartWaybillBucket, EkartWaybillSeriesConfig> = {
  prepaid_upto_5kg: {
    label: 'Prepaid shipment up to 5kg',
    defaultSeries: 'ZCEP0000000001',
  },
  cod_upto_5kg: {
    label: 'COD shipment up to 5kg',
    defaultSeries: 'ZCEC0000000001',
  },
  prepaid_above_5kg: {
    label: 'Prepaid shipment above 5kg',
    defaultSeries: 'ZCFP0000000001',
  },
  cod_above_5kg: {
    label: 'COD shipment above 5kg',
    defaultSeries: 'ZCFC0000000001',
  },
}

const SEQUENCE_PAD = 10
const FIRST_USABLE_SEQUENCE = 200
const INITIAL_LAST_SEQUENCE = FIRST_USABLE_SEQUENCE - 1
let ensureTablePromise: Promise<void> | null = null

function parseSeriesInput(value: string | undefined, fallbackSeries: string) {
  const raw = String(value || fallbackSeries)
    .trim()
    .toUpperCase()
  const match = raw.match(/^(.+?)(\d+)$/)

  if (!match) {
    return {
      prefix: raw,
      sequencePad: SEQUENCE_PAD,
      series: `${raw}${String(1).padStart(SEQUENCE_PAD, '0')}`,
    }
  }

  const [, prefix, numericPart] = match
  const sequencePad = numericPart.length || SEQUENCE_PAD
  return {
    prefix,
    sequencePad,
    series: `${prefix}${String(1).padStart(sequencePad, '0')}`,
  }
}

function formatWaybill(prefix: string, sequencePad: number, sequence: number) {
  return `${prefix}${String(sequence).padStart(sequencePad, '0')}`
}

async function ensureEkartWaybillSequencesTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = db
      .execute(sql`
        CREATE TABLE IF NOT EXISTS ekart_waybill_sequences (
          bucket varchar(50) PRIMARY KEY,
          prefix varchar(30) NOT NULL DEFAULT '',
          sequence_pad integer NOT NULL DEFAULT 10,
          last_sequence bigint NOT NULL DEFAULT 0,
          used_count bigint NOT NULL DEFAULT 0,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      .then(() =>
        db.execute(sql`
          ALTER TABLE ekart_waybill_sequences
          ADD COLUMN IF NOT EXISTS prefix varchar(30) NOT NULL DEFAULT ''
        `),
      )
      .then(() =>
        db.execute(sql`
          ALTER TABLE ekart_waybill_sequences
          ADD COLUMN IF NOT EXISTS sequence_pad integer NOT NULL DEFAULT 10
        `),
      )
      .then(() =>
        db.execute(sql`
          ALTER TABLE ekart_waybill_sequences
          ADD COLUMN IF NOT EXISTS used_count bigint NOT NULL DEFAULT 0
        `),
      )
      .then(() =>
        db.execute(sql`
          UPDATE ekart_waybill_sequences
          SET used_count = last_sequence
          WHERE used_count = 0 AND last_sequence > 0 AND last_sequence < ${INITIAL_LAST_SEQUENCE}
        `),
      )
      .then(async () => {
        for (const bucket of WAYBILL_BUCKETS) {
          const parsed = parseSeriesInput(undefined, WAYBILL_SERIES_BY_BUCKET[bucket].defaultSeries)
          await db
            .insert(ekartWaybillSequences)
            .values({
              bucket,
              prefix: parsed.prefix,
              sequencePad: parsed.sequencePad,
              lastSequence: INITIAL_LAST_SEQUENCE,
              usedCount: 0,
            })
            .onConflictDoUpdate({
              target: ekartWaybillSequences.bucket,
              set: {
                prefix: sql`CASE WHEN ${ekartWaybillSequences.prefix} = '' THEN ${parsed.prefix} ELSE ${ekartWaybillSequences.prefix} END`,
                sequencePad: sql`CASE WHEN ${ekartWaybillSequences.sequencePad} <= 0 THEN ${parsed.sequencePad} ELSE ${ekartWaybillSequences.sequencePad} END`,
                lastSequence: sql`GREATEST(${ekartWaybillSequences.lastSequence}, ${INITIAL_LAST_SEQUENCE})`,
                updatedAt: sql`now()`,
              },
            })
        }
      })
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

  const parsedDefault = parseSeriesInput(undefined, WAYBILL_SERIES_BY_BUCKET[bucket].defaultSeries)

  const [result] = await db
    .insert(ekartWaybillSequences)
    .values({
      bucket,
      prefix: parsedDefault.prefix,
      sequencePad: parsedDefault.sequencePad,
      lastSequence: FIRST_USABLE_SEQUENCE,
      usedCount: 1,
    })
    .onConflictDoUpdate({
      target: ekartWaybillSequences.bucket,
      set: {
        lastSequence: sql`GREATEST(${ekartWaybillSequences.lastSequence} + 1, ${FIRST_USABLE_SEQUENCE})`,
        usedCount: sql`${ekartWaybillSequences.usedCount} + 1`,
        updatedAt: sql`now()`,
      },
    })
    .returning({
      prefix: ekartWaybillSequences.prefix,
      sequencePad: ekartWaybillSequences.sequencePad,
      lastSequence: ekartWaybillSequences.lastSequence,
    })

  const sequence = Number(result?.lastSequence ?? FIRST_USABLE_SEQUENCE)
  return formatWaybill(
    result?.prefix || parsedDefault.prefix,
    Number(result?.sequencePad || parsedDefault.sequencePad),
    sequence,
  )
}

export async function getEkartWaybillSeriesStatus(): Promise<EkartWaybillSeriesStatus[]> {
  await ensureEkartWaybillSequencesTable()

  const rows = await db.select().from(ekartWaybillSequences)
  const byBucket = new Map(rows.map((row) => [row.bucket, row]))

  return WAYBILL_BUCKETS.map((bucket) => {
    const fallback = parseSeriesInput(undefined, WAYBILL_SERIES_BY_BUCKET[bucket].defaultSeries)
    const row = byBucket.get(bucket)
    const prefix = row?.prefix || fallback.prefix
    const sequencePad = Number(row?.sequencePad || fallback.sequencePad)
    const lastSequence = Number(row?.lastSequence ?? INITIAL_LAST_SEQUENCE)
    const usedCount = Number(row?.usedCount ?? 0)

    return {
      bucket,
      label: WAYBILL_SERIES_BY_BUCKET[bucket].label,
      series: formatWaybill(prefix, sequencePad, 1),
      prefix,
      sequencePad,
      lastSequence,
      usedCount,
      nextAwb: formatWaybill(prefix, sequencePad, Math.max(lastSequence + 1, FIRST_USABLE_SEQUENCE)),
    }
  })
}

export async function updateEkartWaybillSeries(input: EkartWaybillSeriesInput) {
  await ensureEkartWaybillSequencesTable()

  for (const bucket of WAYBILL_BUCKETS) {
    const nextValue = input[bucket]
    if (typeof nextValue !== 'string') continue

    const parsed = parseSeriesInput(nextValue, WAYBILL_SERIES_BY_BUCKET[bucket].defaultSeries)
    if (!parsed.prefix) continue

    await db
      .insert(ekartWaybillSequences)
      .values({
        bucket,
        prefix: parsed.prefix,
        sequencePad: parsed.sequencePad,
        lastSequence: INITIAL_LAST_SEQUENCE,
        usedCount: 0,
      })
      .onConflictDoUpdate({
        target: ekartWaybillSequences.bucket,
        set: {
          prefix: parsed.prefix,
          sequencePad: parsed.sequencePad,
          lastSequence: sql`
            CASE
              WHEN ${ekartWaybillSequences.prefix} <> ${parsed.prefix}
                OR ${ekartWaybillSequences.sequencePad} <> ${parsed.sequencePad}
              THEN ${INITIAL_LAST_SEQUENCE}
              ELSE GREATEST(${ekartWaybillSequences.lastSequence}, ${INITIAL_LAST_SEQUENCE})
            END
          `,
          usedCount: sql`
            CASE
              WHEN ${ekartWaybillSequences.prefix} <> ${parsed.prefix}
                OR ${ekartWaybillSequences.sequencePad} <> ${parsed.sequencePad}
              THEN 0
              ELSE ${ekartWaybillSequences.usedCount}
            END
          `,
          updatedAt: sql`now()`,
        },
      })
  }
}
