// AddPickupAddressForm.tsx
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material'
import type { AxiosError } from 'axios'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FaMapMarkedAlt } from 'react-icons/fa'
import { MdExpandMore } from 'react-icons/md'
import {
  useCreatePickupAddress,
  useUpdatePickupAddress,
} from '../../hooks/Pickup/usePickupAddresses'
import type { PickupFormValues } from '../../types/generic.types'
import { glassStyles } from '../UI/accordion/FormSectionAccordion'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomCheckbox from '../UI/inputs/CustomCheckbox'
import { toast } from '../UI/Toast'
import PickupAddressSection from './PickupAddressSection'

const AddPickupAddressForm = ({
  setDrawer,
  initialData,
}: {
  setDrawer: (v: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any
}) => {
  const createPickupAddressMutation = useCreatePickupAddress()
  const updatePickupAddressMutation = useUpdatePickupAddress()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!initialData?.pickupId

  const { control, handleSubmit, setValue, watch, reset } = useForm<PickupFormValues>({
    mode: 'onBlur',
    defaultValues: {
      pickup: initialData?.pickup ?? {},
      rtoAddress: initialData?.rto ?? {},
      useDifferentRTO: initialData ? !initialData?.isRTOSame : false,
    },
  })

  const useDifferentRTO = watch('useDifferentRTO')

  const savedSyncWarnings = [
    initialData?.delhiverySyncError ? `Delhivery: ${initialData.delhiverySyncError}` : null,
    initialData?.ekartSyncError ? `Ekart: ${initialData.ekartSyncError}` : null,
  ].filter(Boolean) as string[]

  const getProviderSyncSummary = (providerSync: {
    delhivery?: { synced: boolean; error: string | null }
    ekart?: { synced: boolean; error: string | null }
  } | null | undefined) => {
    const entries = [
      providerSync?.delhivery ? { name: 'Delhivery', ...providerSync.delhivery } : null,
      providerSync?.ekart ? { name: 'Ekart', ...providerSync.ekart } : null,
    ].filter(Boolean) as Array<{ name: string; synced: boolean; error: string | null }>

    const attempted = entries.filter((entry) => entry.synced || entry.error)
    const syncedCount = attempted.filter((entry) => entry.synced).length
    const failed = attempted.filter((entry) => !entry.synced && entry.error)

    return {
      attemptedCount: attempted.length,
      syncedCount,
      failed,
      allFailed: attempted.length > 0 && syncedCount === 0,
    }
  }

  const onSubmit = async (formData: PickupFormValues) => {
    try {
      setServerError(null)
      const payload = {
        ...initialData,
        pickup: formData.pickup,
        rtoAddress: formData.useDifferentRTO ? formData.rtoAddress : undefined,
      }

      if (isEdit && initialData?.pickup?.id) {
        const response = await updatePickupAddressMutation.mutateAsync({
          id: initialData.pickupId,
          payload,
        })
        const warnings = Array.isArray((response as any)?.warnings) ? (response as any).warnings : []
        toast.open({
          message:
            warnings.length > 0
              ? warnings[0]
              : 'Pickup address updated successfully',
          severity: warnings.length > 0 ? 'warning' : 'success',
        })
        setDrawer(false)
        reset()
      } else {
        const response = await createPickupAddressMutation.mutateAsync(payload)
        const warnings = Array.isArray(response?.warnings) ? response.warnings : []
        const providerSummary = getProviderSyncSummary(response?.providerSync)

        if (providerSummary.allFailed) {
          const combinedMessage =
            providerSummary.failed.map((entry) => `${entry.name}: ${entry.error}`).join(' ') ||
            'Pickup address was saved locally, but courier warehouse sync failed.'
          setServerError(combinedMessage)
          toast.open({
            message: combinedMessage,
            severity: 'error',
          })
          return
        }

        toast.open({
          message:
            warnings.length > 0 ? warnings[0] : 'Pickup address saved successfully',
          severity: warnings.length > 0 ? 'warning' : 'success',
        })
        setDrawer(false)
        reset()
      }
    } catch (err) {
      console.error(err)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosErr = err as AxiosError<any>
      const code = axiosErr.response?.data?.code
      const message = axiosErr.response?.data?.message

      if (code === 'DELHIVERY_WAREHOUSE_NAME_EXISTS') {
        setServerError(
          message ||
            'A warehouse with this nickname already exists in our system. Please choose a different warehouse nickname.',
        )
      } else if (typeof message === 'string' && message.trim()) {
        setServerError(message)
      } else {
        const providerDescription = axiosErr.response?.data?.providerResponse?.description
        setServerError(
          providerDescription || 'Failed to save pickup address. Please try again.',
        )
      }
    }
  }

  const required = (field: string) => ({ required: `${field} is required` })

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} sx={{ color: '#fff', p: 2 }} gap={2}>
      {serverError && (
        <Box mb={1}>
          <Alert
            severity="error"
            onClose={() => {
              setServerError(null)
            }}
          >
            {serverError}
          </Alert>
        </Box>
      )}
      {!serverError && savedSyncWarnings.length > 0 && (
        <Box mb={1}>
          <Alert severity="warning">
            {savedSyncWarnings.map((warning, index) => (
              <Typography key={`${warning}-${index}`} variant="body2">
                {warning}
              </Typography>
            ))}
          </Alert>
        </Box>
      )}
      {/* Pickup Address Section */}
      <Accordion defaultExpanded disableGutters sx={glassStyles}>
        <AccordionSummary expandIcon={<MdExpandMore color="#fff" />}>
          <Typography fontWeight={600} display="flex" alignItems="center">
            <FaMapMarkedAlt style={{ marginRight: 8 }} />
            Pickup Address
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* PASS setValue DIRECTLY — do NOT prefix here */}
          <PickupAddressSection
            setValue={setValue}
            control={control}
            isEdit={isEdit}
            required={required}
            prefix="pickup"
          />
        </AccordionDetails>
      </Accordion>

      {/* RTO toggle + section */}
      <Box mt={2} sx={glassStyles} p={2}>
        <FormControlLabel
          control={
            <Controller
              name="useDifferentRTO"
              control={control}
              render={({ field }) => (
                <CustomCheckbox color="primary" checked={field.value} onChange={field.onChange} />
              )}
            />
          }
          label="Use a different RTO address"
        />

        {useDifferentRTO && (
          <Box mt={2}>
            <Accordion defaultExpanded disableGutters sx={glassStyles}>
              <AccordionSummary expandIcon={<MdExpandMore color="#fff" />}>
                <Typography fontWeight={600} display="flex" alignItems="center">
                  <FaMapMarkedAlt style={{ marginRight: 8 }} />
                  RTO Address
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PickupAddressSection
                  setValue={setValue}
                  control={control}
                  isEdit={initialData?.pickupId}
                  required={required}
                  prefix="rtoAddress"
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Box>

      <Box display={'flex'} justifyContent={'flex-end'} mt={2}>
        <Stack alignItems="flex-end" spacing={1} width="100%">
          {serverError && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {serverError}
            </Alert>
          )}
          <CustomIconLoadingButton
            type="submit"
            text={isEdit ? 'Update Address' : 'Save Address'}
            loading={
              isEdit ? updatePickupAddressMutation?.isPending : createPickupAddressMutation?.isPending
            }
          />
        </Stack>
      </Box>
    </Stack>
  )
}

export default AddPickupAddressForm
