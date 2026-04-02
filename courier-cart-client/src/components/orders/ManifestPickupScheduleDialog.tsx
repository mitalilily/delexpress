import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import CustomInput from '../UI/inputs/CustomInput'

type ManifestPickupScheduleDialogProps = {
  open: boolean
  title: string
  description?: string
  pickupDate: string
  pickupTime: string
  minDate?: string
  onPickupDateChange: (value: string) => void
  onPickupTimeChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export default function ManifestPickupScheduleDialog({
  open,
  title,
  description,
  pickupDate,
  pickupTime,
  minDate,
  onPickupDateChange,
  onPickupTimeChange,
  onCancel,
  onConfirm,
}: ManifestPickupScheduleDialogProps) {
  const now = new Date()
  const selectedDateTime =
    pickupDate && pickupTime ? new Date(`${pickupDate}T${pickupTime}:00`) : null
  const minimumAllowed = new Date(now.getTime() + 15 * 60 * 1000)

  let validationMessage = ''
  if (!pickupDate || !pickupTime) {
    validationMessage = 'Pickup date and time are required.'
  } else if (!selectedDateTime || Number.isNaN(selectedDateTime.getTime())) {
    validationMessage = 'Enter a valid pickup date and time.'
  } else if (selectedDateTime.getTime() < minimumAllowed.getTime()) {
    validationMessage =
      'Pickup date/time cannot be in the past. Please choose at least 15 minutes from now.'
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            {description ||
              'Confirm a valid future pickup slot before generating the Delhivery manifest.'}
          </Typography>
          <CustomInput
            label="Pickup Date"
            type="date"
            value={pickupDate}
            onChange={(e) => onPickupDateChange((e.target as HTMLInputElement).value)}
            inputProps={minDate ? { min: minDate } : undefined}
            error={Boolean(validationMessage) && Boolean(pickupDate)}
          />
          <CustomInput
            label="Pickup Time"
            type="time"
            value={pickupTime}
            onChange={(e) => onPickupTimeChange((e.target as HTMLInputElement).value)}
            error={Boolean(validationMessage) && Boolean(pickupTime)}
          />
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
