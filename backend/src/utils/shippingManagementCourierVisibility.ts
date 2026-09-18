import { isSupportedDelhiveryCourierId } from './delhiveryCourier'

const normalizeProvider = (value?: string | null) => String(value || '').trim().toLowerCase()
const normalizeDisplayName = (value?: string | null) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

const normalizeMode = (value?: string | null) => String(value || '').trim().toLowerCase()

const isCourierEnabled = (row: any) => row?.isEnabled ?? row?.is_enabled ?? false

const toTime = (value: unknown) => {
  if (!value) return 0
  const time = new Date(value as any).getTime()
  return Number.isFinite(time) ? time : 0
}

const getCourierSortScore = (row: any) => ({
  updatedAt: toTime(row?.updatedAt ?? row?.updated_at),
  createdAt: toTime(row?.createdAt ?? row?.created_at),
  id: Number(row?.id ?? row?.courier_id ?? 0) || 0,
})

const shouldPreferCourierRow = (candidate: any, existing: any) => {
  const candidateScore = getCourierSortScore(candidate)
  const existingScore = getCourierSortScore(existing)

  if (candidateScore.updatedAt !== existingScore.updatedAt) {
    return candidateScore.updatedAt > existingScore.updatedAt
  }

  if (candidateScore.createdAt !== existingScore.createdAt) {
    return candidateScore.createdAt > existingScore.createdAt
  }

  return candidateScore.id > existingScore.id
}

export const isShippingManagementCourierVisible = (row: any) => {
  const provider = normalizeProvider(row?.serviceProvider ?? row?.service_provider)
  if (!isCourierEnabled(row)) return false

  if (provider !== 'delhivery') return true

  return isSupportedDelhiveryCourierId(row?.id ?? row?.courier_id)
}

export const filterShippingManagementCouriers = <T extends Record<string, any>>(rows: T[] = []) =>
  Array.from(
    rows.filter(isShippingManagementCourierVisible).reduce((visibleRows, row) => {
      const key = [
        normalizeProvider(row?.serviceProvider ?? row?.service_provider),
        normalizeDisplayName(row?.name ?? row?.courier_name),
        normalizeMode(row?.mode),
      ].join('__')

      const existing = visibleRows.get(key)
      if (!existing || shouldPreferCourierRow(row, existing)) {
        visibleRows.set(key, row)
      }

      return visibleRows
    }, new Map<string, T>()),
  ).map(([, row]) => row)
