import {
  Box,
  Chip,
  FormControlLabel,
  Link,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useState } from 'react'
import { FiMail, FiShield } from 'react-icons/fi'
import { useRequestOtp } from '../../hooks/useOTP'
import { TERMS_AND_CONDITIONS } from '../../utils/constants'
import { TEXT } from '../../theme/theme'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomCheckbox from '../UI/inputs/CustomCheckbox'
import CustomInput from '../UI/inputs/CustomInput'
import CustomModal from '../UI/modal/CustomModal'
import { toast } from '../UI/Toast'
import OtpForm from './OtpForm'
import PasswordLoginForm from './PasswordLoginForm'

const DE_BLUE = '#8A1F43'

const getAuthErrorMessage = (err: unknown, fallback: string) => {
  const errObj = err as {
    response?: { data?: Record<string, unknown> }
    code?: string
    message?: string
  }

  const data = errObj.response?.data
  const fromData =
    (typeof data?.error === 'string' && data.error) ||
    (typeof data?.message === 'string' && data.message) ||
    (typeof data?.msg === 'string' && data.msg) ||
    ''

  const message = fromData || errObj.message || fallback

  const isNetwork = errObj.code === 'ERR_NETWORK' || !errObj.response
  if (!isNetwork) return message

  const base = import.meta.env.VITE_API_URL || 'https://api.expressopro.in/api'
  return `Cannot reach API (${base}). Start backend or set VITE_API_URL.`
}

const primaryButtonStyles = {
  width: '100%',
  borderRadius: 1,
  bgcolor: DE_BLUE,
  boxShadow: `0 8px 24px ${alpha(DE_BLUE, 0.3)}`,
  '&:hover': { bgcolor: '#6F1735' },
}

const secondaryButtonStyles = {
  width: '100%',
  border: `1px solid ${alpha(DE_BLUE, 0.2)}`,
  backgroundColor: alpha(DE_BLUE, 0.04),
  color: DE_BLUE,
  borderRadius: 1,
}

export default function PhoneForm() {
  const activeEmail = sessionStorage.getItem('activeEmail')
  const [step, setStep] = useState<number>(0)
  const [preferredLoginMethod, setPreferredLoginMethod] = useState<'phone' | 'password'>('phone')
  const [email, setEmail] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const [openTerms, setOpenTerms] = useState(false)

  const { mutate: sendOtpRequest, isPending } = useRequestOtp()

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setEmail(value)
  }, [])

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValidEmail = email.length > 0 && emailRegex.test(email)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!termsChecked) {
        toast.open({
          message: 'Please accept the Terms and Conditions to continue.',
          severity: 'warning',
          position: { vertical: 'top', horizontal: 'center' },
        })
        return
      }

      setPreferredLoginMethod('phone')
      sessionStorage.setItem('preferredMethod', 'phone')

      sendOtpRequest(email.toLowerCase().trim(), {
        onSuccess: () => {
          setStep(1)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          const msg = getAuthErrorMessage(err, 'OTP request failed')
          toast.open({
            message: msg,
            severity: 'error',
            position: { vertical: 'top', horizontal: 'center' },
          })
        },
      })
    },
    [email, termsChecked, sendOtpRequest],
  )

  useEffect(() => {
    if (activeEmail) setEmail(activeEmail)
  }, [activeEmail])

  const termsLabel = (
    <Typography fontSize="13px" display="flex" alignItems="center" gap="3px" color="#6A616A">
      I agree to{' '}
      <Link
        component="button"
        underline="hover"
        onClick={() => setOpenTerms(true)}
        sx={{ cursor: 'pointer', color: DE_BLUE, fontWeight: 700 }}
      >
        Terms and Conditions
      </Link>
    </Typography>
  )

  const renderOtpEntry = () =>
    step === 0 ? (
      <Box component="form" onSubmit={handleSubmit} width="100%">
        <CustomInput
          type="email"
          label="Work Email"
          value={email}
          name="email"
          id="email"
          onChange={handleEmailChange}
          required
          error={email.length > 0 && !isValidEmail}
          helperText={email.length > 0 && !isValidEmail ? 'Enter a valid email address.' : ''}
          autoFocus
          prefix={<FiMail color={DE_BLUE} size={15} />}
        />

        <FormControlLabel
          sx={{ mt: 1.2, mb: 2.3, alignItems: 'flex-start' }}
          control={
            <CustomCheckbox
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography mt={0.5} variant="body2">
              {termsLabel}
            </Typography>
          }
        />

        <CustomIconLoadingButton
          type="submit"
          styles={primaryButtonStyles}
          textColor="#ffffff"
          disabled={!email || !termsChecked || isPending || !isValidEmail}
          text="Send verification code"
          loading={isPending}
          loadingText="Sending..."
        />
      </Box>
    ) : (
      <OtpForm
        email={email}
        onEditEmail={() => {
          setStep(0)
        }}
      />
    )

  return (
    <Stack spacing={2.2} alignItems="stretch">
      <Stack spacing={1.2}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: DE_BLUE }}>
          Secure Authentication
        </Typography>
        <Typography variant="body2" sx={{ color: '#6A616A', lineHeight: 1.6, fontWeight: 500 }}>
          Access your logistics dashboard using your registered work email. We will send a
          verification code to your email when needed.
        </Typography>

        <Chip
          icon={<FiShield size={14} />}
          label="Enterprise-grade security"
          size="small"
          sx={{
            alignSelf: 'flex-start',
            mt: 0.2,
            backgroundColor: alpha('#36B37E', 0.1),
            color: '#00875A',
            fontWeight: 700,
            borderRadius: 1,
            '& .MuiChip-icon': { color: '#00875A' },
          }}
        />
      </Stack>

      <ToggleButtonGroup
        value={preferredLoginMethod}
        exclusive
        onChange={(_, value) => {
          if (!value) return
          setPreferredLoginMethod(value)
          setStep(0)
        }}
        fullWidth
        sx={{
          p: 0.5,
          borderRadius: 1,
          backgroundColor: alpha(DE_BLUE, 0.04),
          border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontWeight: 800,
            border: 'none',
            borderRadius: 0.5,
            color: alpha(TEXT, 0.6),
            '&.Mui-selected': {
              backgroundColor: '#FFFFFF',
              color: DE_BLUE,
              boxShadow: '0 4px 12px rgba(138, 31, 67, 0.12)',
              '&:hover': {
                backgroundColor: '#FFFFFF',
              },
            },
          },
        }}
      >
        <ToggleButton value="phone">One-Time Passcode</ToggleButton>
        <ToggleButton value="password">Email + Password</ToggleButton>
      </ToggleButtonGroup>

      {preferredLoginMethod === 'phone' ? (
        renderOtpEntry()
      ) : (
        <PasswordLoginForm step={step} setOpenTerms={setOpenTerms} setStep={setStep} />
      )}

      <CustomIconLoadingButton
        styles={secondaryButtonStyles}
        onClick={() => setOpenTerms(true)}
        variant="text"
        text="View terms and policies"
      />

      <CustomModal
        open={openTerms}
        onClose={() => setOpenTerms(false)}
        title="Terms and Conditions"
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-line',
            maxHeight: '60vh',
            overflowY: 'auto',
            pr: 1,
          }}
        >
          {TERMS_AND_CONDITIONS}
        </Typography>
      </CustomModal>
    </Stack>
  )
}
