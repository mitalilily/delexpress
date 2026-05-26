import axiosInstance from './axiosInstance'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchLocations = async (params: any) => {
  const res = await axiosInstance.get(`/serviceability/locations`, { params })
  return res.data
}

export type PincodeLocation = {
  pincode: string
  city: string
  state: string
  country?: string
  source?: string
}

const normalizePincode = (value: string) => value.replace(/\D/g, '').slice(0, 6)

const toTitleCase = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const normalizeLocation = (location: Partial<PincodeLocation> | null): PincodeLocation | null => {
  const pincode = normalizePincode(String(location?.pincode || ''))
  const city = String(location?.city || '').trim()
  const state = String(location?.state || '').trim()

  if (pincode.length !== 6 || !city || !state) return null

  return {
    pincode,
    city,
    state,
    country: location?.country || 'India',
    source: location?.source,
  }
}

const fetchJson = async (url: string, signal?: AbortSignal) => {
  const response = await fetch(url, { signal })
  if (!response.ok) return null
  return response.json()
}

const lookupFromIndiaPincodeDataset = async (
  pincode: string,
  signal?: AbortSignal,
): Promise<PincodeLocation | null> => {
  const data = await fetchJson(
    `https://aniket-thapa.github.io/india-pincode-api/pincodes/${pincode}.json`,
    signal,
  )
  return normalizeLocation({
    pincode,
    city: toTitleCase(data?.district || data?.offices?.[0]?.divisionName || ''),
    state: toTitleCase(data?.state || ''),
    country: 'India',
    source: 'india_pincode_dataset',
  })
}

const lookupFromPostalPincode = async (
  pincode: string,
  signal?: AbortSignal,
): Promise<PincodeLocation | null> => {
  const data = await fetchJson(`https://api.postalpincode.in/pincode/${pincode}`, signal)
  const postOffice = data?.[0]?.PostOffice?.[0]
  const status = data?.[0]?.Status

  if (status !== 'Success' || !postOffice) return null

  return normalizeLocation({
    pincode,
    city: toTitleCase(postOffice.District || postOffice.Name || ''),
    state: toTitleCase(postOffice.State || ''),
    country: toTitleCase(postOffice.Country || 'India') || 'India',
    source: 'postal_api',
  })
}

const lookupFromZippopotam = async (
  pincode: string,
  signal?: AbortSignal,
): Promise<PincodeLocation | null> => {
  const data = await fetchJson(`https://api.zippopotam.us/IN/${pincode}`, signal)
  const place = Array.isArray(data?.places) ? data.places[0] : null

  return normalizeLocation({
    pincode,
    city: toTitleCase(place?.['place name'] || ''),
    state: toTitleCase(place?.state || ''),
    country: 'India',
    source: 'zippopotam',
  })
}

const lookupFromPublicProviders = async (
  pincode: string,
  signal?: AbortSignal,
): Promise<PincodeLocation | null> => {
  const providers = [lookupFromIndiaPincodeDataset, lookupFromPostalPincode, lookupFromZippopotam]

  for (const provider of providers) {
    try {
      const location = await provider(pincode, signal)
      if (location) return location
    } catch (error: any) {
      if (error?.name === 'AbortError') throw error
    }
  }

  return null
}

export const lookupPincodeLocation = async (
  pincode: string,
  signal?: AbortSignal,
): Promise<PincodeLocation> => {
  const normalizedPincode = normalizePincode(pincode)
  if (normalizedPincode.length !== 6) {
    throw new Error('Pincode must be exactly 6 digits')
  }

  let backendError: unknown

  try {
    const { data } = await axiosInstance.get('/serviceability/locations/lookup', {
      params: { pincode: normalizedPincode },
      signal,
    })
    const backendLocation = normalizeLocation(data?.data)
    if (backendLocation) return backendLocation
  } catch (error: any) {
    if (error?.name === 'CanceledError' || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
      throw error
    }
    backendError = error
  }

  const fallbackLocation = await lookupFromPublicProviders(normalizedPincode, signal)
  if (fallbackLocation) return fallbackLocation

  const message =
    (backendError as any)?.response?.data?.message ||
    (backendError as Error)?.message ||
    'Invalid pincode or no location found'
  throw new Error(message)
}
