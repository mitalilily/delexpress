export const normalizePickupTime = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) return ''

  if (/^\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized
  }

  if (/^\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`
  }

  return normalized
}
