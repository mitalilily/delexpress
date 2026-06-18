import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import type { HydratedPickup } from '../../types/generic.types'
import CustomInput from '../UI/inputs/CustomInput'
import CustomSelect from '../UI/inputs/CustomSelect'

type ShipNowDialogProps = {
  open: boolean
  title: string
  courierLabel: string
  description?: string
  requiresPickupSchedule: boolean
  pickupDate: string
  pickupTime: string
  packageCount: string
  pickupAddressId: string
  pickupAddresses: HydratedPickup[]
  onPickupDateChange: (value: string) => void
  onPickupTimeChange: (value: string) => void
  onPackageCountChange: (value: string) => void
  onPickupAddressIdChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export default function ShipNowDialog({
  open,
  title,
  courierLabel,
  description,
  requiresPickupSchedule,
  pickupDate,
  pickupTime,
  packageCount,
  pickupAddressId,
  pickupAddresses,
  onPickupDateChange,
  onPickupTimeChange,
  onPackageCountChange,
  onPickupAddressIdChange,
  onCancel,
  onConfirm,
}: ShipNowDialogProps) {
  const now = new Date()
  const selectedDateTime =
    pickupDate && pickupTime ? new Date(`${pickupDate}T${pickupTime}:00`) : null
  const minimumAllowed = new Date(now.getTime() + 15 * 60 * 1000)
  const numericCount = Number(packageCount)

  const validationMessage = (() => {
    if (!requiresPickupSchedule) {
      if (!packageCount || !Number.isFinite(numericCount) || numericCount < 1) {
        return 'Please enter a valid package count.'
      }
      return ''
    }

    if (!pickupDate || !pickupTime) {
      return 'Pickup date and time are required.'
    }

    if (!selectedDateTime || Number.isNaN(selectedDateTime.getTime())) {
      return 'Enter a valid pickup date and time.'
    }

    if (selectedDateTime.getTime() < minimumAllowed.getTime()) {
      return 'Pickup date/time must be at least 15 minutes from now.'
    }

    if (!packageCount || !Number.isFinite(numericCount) || numericCount < 1) {
      return 'Please enter a valid package count.'
    }

    return ''
  })()

  const pickupItems = [
    {
      key: '',
      label: 'Use order pickup location',
      description: 'Fallback to the pickup location already stored on the order.',
    },
    ...pickupAddresses.map((pickup) => ({
      key: pickup.id,
      label: pickup.pickup?.addressNickname || pickup.pickup?.contactName || pickup.id,
      description: [
        pickup.pickup?.addressLine1,
        pickup.pickup?.city,
        pickup.pickup?.state,
        pickup.pickup?.pincode,
      ]
        .filter(Boolean)
        .join(', '),
    })),
  ]

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            {description ||
              (requiresPickupSchedule
                ? 'Confirm the pickup schedule before triggering the request.'
                : 'Confirm the action before regenerating documents.')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {requiresPickupSchedule
              ? `${courierLabel} pickup will be requested first. After the pickup request succeeds, label and invoice will be generated.`
              : `${courierLabel} does not use the pickup request flow here, so Ship Now will only regenerate the label.`}
          </Typography>

          {requiresPickupSchedule ? (
            <CustomSelect
              label="Pickup Address"
              value={pickupAddressId}
              items={pickupItems}
              onSelect={(value) => onPickupAddressIdChange(String(value))}
              placeholder="Use order pickup location"
            />
          ) : null}

          <CustomInput
            label="Number of Items"
            type="number"
            value={packageCount}
            onChange={(e) => onPackageCountChange((e.target as HTMLInputElement).value)}
            inputProps={{ min: 1, step: 1 }}
            error={Boolean(validationMessage) && (!packageCount || Number(packageCount) < 1)}
          />

          {requiresPickupSchedule ? (
            <>
              <CustomInput
                label="Pickup Date"
                type="date"
                value={pickupDate}
                onChange={(e) => onPickupDateChange((e.target as HTMLInputElement).value)}
                inputProps={{ min: now.toISOString().split('T')[0] }}
                error={Boolean(validationMessage) && Boolean(pickupDate)}
              />
              <CustomInput
                label="Pickup Time"
                type="time"
                value={pickupTime}
                onChange={(e) => onPickupTimeChange((e.target as HTMLInputElement).value)}
                error={Boolean(validationMessage) && Boolean(pickupTime)}
              />
            </>
          ) : null}

          {validationMessage ? (
            <Typography variant="caption" color="error">
              {validationMessage}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm} disabled={Boolean(validationMessage)}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}
