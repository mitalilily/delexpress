import type { ResolvedB2CRateCard, ResolvedRateCardSlab } from '../b2cRateCard.service'

const stableNumericIdFromString = (value: string) => {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) % 2147483646 + 1
}

export const SHADOWFAX_PROVIDER = 'shadowfax'
export const SHADOWFAX_NAME = 'Shadowfax'
export const SHADOWFAX_MODE = 'surface'
export const SHADOWFAX_COURIER_ID = stableNumericIdFromString(SHADOWFAX_PROVIDER)

export const SHADOWFAX_FALLBACK_COD_CHARGES = 10
export const SHADOWFAX_FALLBACK_COD_PERCENT = 2
export const SHADOWFAX_FALLBACK_BASE_RATE = 10
export const SHADOWFAX_FALLBACK_EXTRA_RATE = 10
export const SHADOWFAX_FALLBACK_EXTRA_WEIGHT_UNIT = 1
export const SHADOWFAX_FALLBACK_WEIGHT_TO = 5

export const SHADOWFAX_FALLBACK_SLABS: ResolvedRateCardSlab[] = [
  {
    weight_from: 0,
    weight_to: SHADOWFAX_FALLBACK_WEIGHT_TO,
    rate: SHADOWFAX_FALLBACK_BASE_RATE,
    extra_rate: SHADOWFAX_FALLBACK_EXTRA_RATE,
    extra_weight_unit: SHADOWFAX_FALLBACK_EXTRA_WEIGHT_UNIT,
  },
]

export type ShadowfaxFallbackCourierRow = {
  id: number
  name: string
  serviceProvider: string
  isEnabled: boolean
  createdAt: Date | null
  businessType?: ('b2b' | 'b2c')[] | null
}

export const buildShadowfaxCourierRow = (): ShadowfaxFallbackCourierRow => ({
  id: SHADOWFAX_COURIER_ID,
  name: SHADOWFAX_NAME,
  serviceProvider: SHADOWFAX_PROVIDER,
  isEnabled: true,
  createdAt: new Date(),
  businessType: ['b2c', 'b2b'],
})

export const buildShadowfaxResolvedRateCards = (params: {
  planId: string
  zoneId: string
  courierId?: number
  type?: 'forward' | 'rto'
  mode?: string | null
}): ResolvedB2CRateCard[] => {
  const courierId = params.courierId ?? SHADOWFAX_COURIER_ID
  const requestedType = params.type ? [params.type] : ['forward', 'rto']
  const normalizedMode = String(params.mode || SHADOWFAX_MODE).trim().toLowerCase()

  if (normalizedMode && normalizedMode !== SHADOWFAX_MODE) {
    return []
  }

  return requestedType.map((type) => ({
    shippingRateId: `${SHADOWFAX_PROVIDER}:${params.planId}:${params.zoneId}:${courierId}:${type}`,
    courier_id: courierId,
    service_provider: SHADOWFAX_PROVIDER,
    zone_id: params.zoneId,
    type,
    mode: SHADOWFAX_MODE,
    cod_charges: SHADOWFAX_FALLBACK_COD_CHARGES,
    cod_percent: SHADOWFAX_FALLBACK_COD_PERCENT,
    other_charges: 0,
    min_weight: 0,
    base_rate: SHADOWFAX_FALLBACK_BASE_RATE,
    slabs: SHADOWFAX_FALLBACK_SLABS,
  }))
}
