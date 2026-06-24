const RAW_API_BASE_URL = import.meta.env.VITE_API_URL
const DEFAULT_API_BASE_URL = 'https://api.expressopro.in/api'

function getApiBaseUrl() {
  const fallback = DEFAULT_API_BASE_URL.replace(/\/+$/, '')

  try {
    if (!RAW_API_BASE_URL) return fallback

    const candidate = new URL(RAW_API_BASE_URL, window.location.origin)
    const currentHost = window.location.hostname
    const isNetlifyPreview = currentHost.endsWith('netlify.app')
    const pointsBackToFrontend = candidate.hostname === currentHost

    if (isNetlifyPreview && pointsBackToFrontend) {
      return fallback
    }

    const normalized = candidate.href.replace(/\/+$/, '')
    if (normalized.endsWith('/api') || normalized.includes('/api/')) return normalized
    return `${normalized}/api`
  } catch {
    return fallback
  }
}

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function fetchTracking(params, signal) {
  const url = new URL(`${getApiBaseUrl()}/orders/track`)

  Object.entries(params || {}).forEach(([key, value]) => {
    const normalized = String(value || '').trim()
    if (normalized) {
      url.searchParams.set(key, normalized)
    }
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  })

  const data = await parseJsonSafe(response)

  if (!response.ok || !data?.success || !data?.data) {
    throw new Error(data?.message || 'Unable to fetch tracking details right now.')
  }

  return data.data
}
