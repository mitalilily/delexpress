import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveDispute,
  approveWeightDiscrepancy,
  createCsvWeightDiscrepancies,
  createManualWeightDiscrepancy,
  getAllWeightDiscrepancies,
  getAllWeightDisputes,
  getWeightReconciliationStats,
  rejectDispute,
} from '../services/weightReconciliation.service'

/**
 * Hook to fetch weight reconciliation stats
 */
export const useWeightReconciliationStats = (params) => {
  return useQuery({
    queryKey: ['weightReconciliationStats', params],
    queryFn: () => getWeightReconciliationStats(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch all weight discrepancies (all users)
 */
export const useAllWeightDiscrepancies = (params) => {
  return useQuery({
    queryKey: ['allWeightDiscrepancies', params],
    queryFn: () => getAllWeightDiscrepancies(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to fetch all weight disputes (all users)
 */
export const useAllWeightDisputes = (params) => {
  return useQuery({
    queryKey: ['allWeightDisputes', params],
    queryFn: () => getAllWeightDisputes(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export const useCreateManualWeightDiscrepancy = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: createManualWeightDiscrepancy,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allWeightDiscrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weightReconciliationStats'] })
      toast({
        title: data?.duplicate ? 'Duplicate Found' : 'Discrepancy Created',
        description: data?.duplicate
          ? 'A matching pending discrepancy already exists'
          : 'The seller has been notified. Debit will happen after admin approval.',
        status: data?.duplicate ? 'info' : 'success',
        duration: 4000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create discrepancy',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useCreateCsvWeightDiscrepancies = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: createCsvWeightDiscrepancies,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allWeightDiscrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weightReconciliationStats'] })
      toast({
        title: 'CSV Processed',
        description: `${data?.created || 0} created, ${data?.duplicates || 0} duplicates, ${
          data?.failed || 0
        } failed`,
        status: data?.failed ? 'warning' : 'success',
        duration: 7000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to import CSV',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useApproveWeightDiscrepancy = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ discrepancyId, data }) => approveWeightDiscrepancy(discrepancyId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allWeightDiscrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weightReconciliationStats'] })
      toast({
        title: 'Discrepancy Approved',
        description: data?.walletTransactionCreated
          ? 'Wallet debit has been applied'
          : 'Approved without creating a new debit',
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to approve discrepancy',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

/**
 * Hook to approve a dispute
 */
export const useApproveDispute = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ disputeId, data }) => approveDispute(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWeightDisputes'] })
      queryClient.invalidateQueries({ queryKey: ['allWeightDiscrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weightReconciliationStats'] })
      toast({
        title: 'Dispute Approved',
        description: 'The dispute has been approved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to approve dispute',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

/**
 * Hook to reject a dispute
 */
export const useRejectDispute = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ disputeId, data }) => rejectDispute(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWeightDisputes'] })
      queryClient.invalidateQueries({ queryKey: ['allWeightDiscrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weightReconciliationStats'] })
      toast({
        title: 'Dispute Rejected',
        description: 'The dispute has been rejected successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to reject dispute',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}
