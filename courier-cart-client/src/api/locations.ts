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

export const lookupPincodeLocation = async (
  pincode: string,
  signal?: AbortSignal,
): Promise<PincodeLocation> => {
  const { data } = await axiosInstance.get('/serviceability/locations/lookup', {
    params: { pincode },
    signal,
  })
  return data?.data
}
