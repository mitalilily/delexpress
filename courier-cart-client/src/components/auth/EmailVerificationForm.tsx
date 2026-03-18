import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { FiEdit2, FiMail } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useVerifyEmailOtp } from '../../hooks/useRequestPasswordLogin'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomInput from '../UI/inputs/CustomInput'
import { toast } from '../UI/Toast'

const DE_BLUE = '#8A1F43'

const primaryButtonStyles = {
  width: '100%',
  borderRadius: 1,
  bgcolor: DE_BLUE,
  boxShadow: `0 8px 24px ${alpha(DE_BLUE, 0.3)}`,
  '&:hover': { bgcolor: '#0043A4' },
}

const secondaryButtonStyles = {
  width: '100%',
  border: `1px solid ${alpha(DE_BLUE, 0.2)}`,
  color: DE_BLUE,
  backgroundColor: alpha(DE_BLUE, 0.04),
  borderRadius: 1,
}

interface IEmailVerificationProps {
  email: string
  onEditEmail: () => void
  password: string
  resendMail: () => void
}

export default function EmailVerificationForm({
  email,
  password,
  onEditEmail,
  resendMail,
}: IEmailVerificationProps) {
  const { setTokens, setUserId } = useAuth()
  const navigate = useNavigate()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(30)

  const { mutate: verifyEmailOtp, isPending } = useVerifyEmailOtp()

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSubmit = () => {
    setTouched(true)

    if (!code) {
      setError('Verification code is required.')
      return
    }

    verifyEmailOtp(
      { email, otp: code, password },
      {
        onSuccess: ({ token, refreshToken, user }) => {
          setTokens(token, refreshToken)
          setUserId(user?.id)
          sessionStorage.setItem('activeEmail', email)
          setError('')
          toast.open({
            message: 'Email verified successfully',
            severity: 'success',
          })
          navigate('/onboarding-questions', { replace: true })
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          setError(err?.response?.data?.message || 'Invalid code. Please try again.')
        },
      },
    )
  }

  const handleResend = () => {
    resendMail()
    setResendCooldown(30)
  }

  return (
    <Stack spacing={2.2} width="100%">
      <Box
        sx={{
          p: 1.6,
          borderRadius: 1,
          backgroundColor: alpha(DE_BLUE, 0.04),
          border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        }}
      >
        <Typography variant="body2" sx={{ color: '#42526E', lineHeight: 1.6, fontWeight: 500 }}>
          Verification code generated for <strong>{email}</strong>. Open the browser console to copy it.
          <Box component="span" sx={{ ml: 0.7, display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: DE_BLUE }} onClick={onEditEmail}>
            <FiEdit2 size={13} style={{ marginRight: 4 }} />
            Edit
          </Box>
        </Typography>
      </Box>

      <CustomInput
        label="Verification Code"
        value={code}
        onChange={(e) => {
          setCode(e.target.value)
          setError('')
        }}
        required
        error={touched && !!error}
        helperText={touched && error}
        prefix={<FiMail color={DE_BLUE} size={16} />}
      />

      <Stack spacing={1.5}>
        <CustomIconLoadingButton
          onClick={handleSubmit}
          styles={primaryButtonStyles}
          textColor="#ffffff"
          disabled={!code || isPending}
          text="Verify email"
          loading={isPending}
          loadingText="Verifying..."
        />

        <Box sx={{ textAlign: 'center' }}>
          <CustomIconLoadingButton
            onClick={handleResend}
            styles={secondaryButtonStyles}
            disabled={resendCooldown > 0}
            text={resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          />
        </Box>
      </Stack>
    </Stack>
  )
}
