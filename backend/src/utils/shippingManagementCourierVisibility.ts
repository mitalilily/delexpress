import { isSupportedDelhiveryCourierId } from './delhiveryCourier'

const normalizeProvider = (value?: string | null) => String(value || '').trim().toLowerCase()

export const isShippingManagementCourierVisible = (row: any) => {
  const provider = normalizeProvider(row?.serviceProvider ?? row?.service_provider)
  if (provider !== 'delhivery') return true

  return isSupportedDelhiveryCourierId(row?.id ?? row?.courier_id)
}

export const filterShippingManagementCouriers = <T extends Record<string, any>>(rows: T[] = []) =>
  rows.filter(isShippingManagementCourierVisible)
