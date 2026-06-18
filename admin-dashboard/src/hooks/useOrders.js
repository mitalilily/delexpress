import { useMutation, useQuery } from '@tanstack/react-query'
import {
  addManualNdrToOrder,
  cancelAdminOrder,
  fetchAllOrders,
  regenerateAdminOrderDocuments,
  shipNowAdminOrder,
  updateAdminOrderStatus,
} from 'services/order.service'

export const useOrders = (page, limit, filters) => {
  return useQuery({
    queryKey: ['orders', page, limit, filters],
    queryFn: () => fetchAllOrders(page, limit, filters),
    keepPreviousData: true,
  })
}

export const useCancelOrderMutation = () => {
  return useMutation({
    mutationFn: (orderId) => cancelAdminOrder(orderId),
  })
}

export const useRegenerateOrderDocumentsMutation = () => {
  return useMutation({
    mutationFn: ({ orderId, regenerateLabel = true, regenerateInvoice = true }) =>
      regenerateAdminOrderDocuments(orderId, { regenerateLabel, regenerateInvoice }),
  })
}

export const useShipNowOrderMutation = () => {
  return useMutation({
    mutationFn: ({
      orderId,
      pickup_date,
      pickup_time,
      expected_package_count,
      pickup_address_id,
    }) =>
      shipNowAdminOrder(orderId, {
        pickup_date,
        pickup_time,
        expected_package_count,
        pickup_address_id,
      }),
  })
}

export const useAddManualNdrMutation = () => {
  return useMutation({
    mutationFn: ({ orderId, status = 'ndr', reason, remarks, attemptNo }) =>
      addManualNdrToOrder(orderId, { status, reason, remarks, attemptNo }),
  })
}

export const useUpdateOrderStatusMutation = () => {
  return useMutation({
    mutationFn: ({ orderId, status, reason, remarks, attemptNo }) =>
      updateAdminOrderStatus(orderId, { status, reason, remarks, attemptNo }),
  })
}
