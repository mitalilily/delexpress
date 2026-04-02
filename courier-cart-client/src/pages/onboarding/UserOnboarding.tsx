import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCheckCircle } from 'react-icons/fi'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import StepOneForm from '../../components/onboarding/StepOneForm'
import StepThree from '../../components/onboarding/StepThree'
import StepTwoForm from '../../components/onboarding/StepTwoForm'
import SwitchAccountButton from '../../components/onboarding/SwitchAccountButton'
import CustomIconLoadingButton from '../../components/UI/button/CustomLoadingButton'
import FullScreenLoader from '../../components/UI/loader/FullScreenLoader'
import { toast } from '../../components/UI/Toast'
import { useAuth } from '../../context/auth/AuthContext'
import { useCompleteUserOnboarding } from '../../hooks/useCompleteUserOnboarding'
import type { UserInfoData } from '../../types/user.types'
import { hasValidationErrors, validateOnboardingFields } from '../../utils/functions'
import { initialFormData } from '../../utils/utility'

const PLUM = '#8A1F43'
const PLUM_DARK = '#5E1630'
const MINT = '#56C0A5'
const TEXT_PRIMARY = '#161219'

export type FormErrors = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof UserInfoData]: any
}

const steps = [
  { key: 1, title: 'Profile Details', helper: 'Contact and company details' },
  { key: 2, title: 'Business Setup', helper: 'Category and monthly shipments' },
  { key: 3, title: 'Integrations', helper: 'Storefront and future channel setup' },
]

const getFirstErrorMessage = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'object' && value !== null) {
    for (const nested of Object.values(value)) {
      const message = getFirstErrorMessage(nested)
      if (message) return message
    }
  }
  return ''
}

export default function UserOnboarding() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { user: userData, loading: fetchingUserData } = useAuth()
  const { mutateAsync: completeOnboarding, isPending } = useCompleteUserOnboarding()
  const hasInitializedStep = useRef(false)

  const [step, setStep] = useState<number>(1)
  const [formData, setFormData] = useState<UserInfoData>({ ...initialFormData })
  const [formErrors, setFormErrors] = useState<FormErrors>({ ...initialFormData })

  const progressPercent = useMemo(() => Math.round((step / steps.length) * 100), [step])

  useEffect(() => {
    if (fetchingUserData || !userData?.id) return

    if (userData.onboardingComplete) {
      navigate('/home')
      return
    }

    if (hasInitializedStep.current) return

    const resumeStep = (userData.onboardingStep ?? 0) + 1
    const clamped = Math.min(Math.max(resumeStep, 1), steps.length)
    setStep(clamped)
    hasInitializedStep.current = true
  }, [fetchingUserData, userData, navigate])

  useEffect(() => {
    if (!userData || !Object.keys(userData).length) return

    setFormData({
      basicInfo: {
        firstName: userData?.companyInfo?.contactPerson?.split(' ')?.[0] ?? '',
        lastName: userData?.companyInfo?.contactPerson?.split(' ')?.slice(1).join(' ') ?? '',
        email: userData?.companyInfo?.contactEmail ?? '',
        phone: userData?.companyInfo?.contactNumber ?? '',
        companyName: userData?.companyInfo?.businessName ?? '',
        pincode: userData?.companyInfo?.pincode ?? '',
        state: userData?.companyInfo?.state ?? '',
        city: userData?.companyInfo?.city ?? '',
        personalWebsite: userData?.companyInfo?.website ?? '',
      },
      businessLegal: {
        brandName: userData?.companyInfo?.brandName ?? '',
        businessCategory: userData?.businessType ?? [],
        monthlyShipments: userData?.monthlyOrderCount ?? '0-100',
      },
      platformIntegration: { ...(userData?.salesChannels ?? {}) },
    })
  }, [userData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    subKey?: keyof UserInfoData,
  ) => {
    const { name, value } = e.target

    const updatedForm = subKey
      ? {
          ...formData,
          [subKey]: {
            ...formData[subKey],
            [name]: value,
          },
        }
      : {
          ...formData,
          [name]: value,
        }

    setFormData(updatedForm)

    const newErrors = validateOnboardingFields(updatedForm, step)
    setFormErrors((prev) => {
      if (subKey) {
        return {
          ...prev,
          [subKey]: {
            ...prev[subKey],
            [name]: newErrors[subKey]?.[name] || '',
          },
        }
      }
      return {
        ...prev,
        [name]: newErrors[name] || '',
      }
    })
  }

  const handleNext = async () => {
    const errors = validateOnboardingFields(formData, step)
    setFormErrors(errors)

    if (hasValidationErrors(errors)) {
      const firstError = getFirstErrorMessage(errors)
      if (firstError) {
        toast.open({
          message: firstError,
          severity: 'warning',
          position: { vertical: 'top', horizontal: 'center' },
        })
      }
      return
    }

    let response: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response = await completeOnboarding({ step, data: formData })
    } catch {
      return
    }

    if (response && !response.error) {
      if (step < steps.length) {
        setStep(step + 1)
      } else {
        queryClient.invalidateQueries({ queryKey: ['userProfile'] })
        navigate('/home')
      }
    }
  }

  if (fetchingUserData) return <FullScreenLoader />

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 0% 0%, ${alpha(PLUM, 0.08)} 0%, transparent 34%),
          radial-gradient(circle at 100% 0%, ${alpha(MINT, 0.12)} 0%, transparent 28%),
          linear-gradient(180deg, #FFF9F4 0%, #F7F2ED 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: { xs: 1.5, md: 3 },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          width: '100%',
          maxWidth: 1120,
          mb: 2,
          px: { xs: 0.5, md: 1 },
        }}
      >
        <Box
          component="img"
          src="/logo/delexpress-logo.svg"
          alt="Delexpress"
          sx={{ width: { xs: 150, md: 190 }, height: 'auto', display: 'block' }}
        />
        <SwitchAccountButton />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 1120,
          borderRadius: { xs: 3, md: 4 },
          border: `1px solid ${alpha(PLUM, 0.12)}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          backgroundColor: alpha('#FFFFFF', 0.88),
          boxShadow: `0 22px 54px ${alpha(TEXT_PRIMARY, 0.08)}`,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Sidebar Progress */}
        <Box
          sx={{
            width: { xs: '100%', md: 360 },
            color: '#fff',
            background: `
              radial-gradient(circle at top left, ${alpha(MINT, 0.12)} 0%, transparent 28%),
              radial-gradient(circle at bottom right, ${alpha('#F7C48A', 0.14)} 0%, transparent 30%),
              linear-gradient(180deg, #171217 0%, #24161D 100%)
            `,
            borderRight: { md: `1px solid ${alpha('#FFFFFF', 0.08)}` },
            borderBottom: { xs: `1px solid ${alpha('#FFFFFF', 0.08)}`, md: 'none' },
            p: { xs: 2.2, md: 3 },
          }}
        >
          <Box
            sx={{
              p: { xs: 2, md: 2.4 },
              borderRadius: 3,
              border: `1px solid ${alpha('#FFFFFF', 0.08)}`,
              backgroundColor: alpha('#FFFFFF', 0.04),
              boxShadow: `inset 0 1px 0 ${alpha('#FFFFFF', 0.06)}`,
              mb: 3,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: alpha('#F6D7C8', 0.92),
                mb: 1.1,
              }}
            >
              Merchant Onboarding
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.35rem', md: '1.7rem' },
                lineHeight: 1.05,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#FFFDF9',
              }}
            >
              Set up your shipping workspace in a few guided steps.
            </Typography>
            <Typography
              sx={{
                mt: 1.4,
                fontSize: '0.92rem',
                lineHeight: 1.7,
                color: alpha('#FFFFFF', 0.7),
              }}
            >
              We’ll capture your business details, shipping profile, and storefront basics so the
              dashboard feels ready from day one.
            </Typography>
          </Box>

          <Stack spacing={2.2}>
            {steps.map((s) => {
              const active = step === s.key
              const completed = step > s.key

              return (
                <Stack
                  key={s.key}
                  direction="row"
                  spacing={1.8}
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    border: `1px solid ${
                      active ? alpha('#FFFFFF', 0.12) : alpha('#FFFFFF', 0.06)
                    }`,
                    backgroundColor: active ? alpha('#FFFFFF', 0.08) : 'transparent',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 1.75,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed ? MINT : active ? '#FFF6F0' : 'transparent',
                      border: completed
                        ? 'none'
                        : `1.5px solid ${active ? alpha('#FFF6F0', 0.84) : alpha('#FFFFFF', 0.18)}`,
                      color: completed ? '#FFFFFF' : active ? PLUM : alpha('#FFFFFF', 0.45),
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {completed ? <FiCheckCircle size={18} /> : s.key}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: active ? '#FFF6F0' : completed ? MINT : alpha('#FFFFFF', 0.52),
                      }}
                    >
                      {s.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: alpha('#FFFFFF', 0.42),
                        textTransform: 'uppercase',
                        letterSpacing: 0.7,
                      }}
                    >
                      {s.helper}
                    </Typography>
                  </Box>
                </Stack>
              )
            })}
          </Stack>

          <Box sx={{ mt: 6 }}>
            <Typography variant="caption" sx={{ color: alpha('#FFFFFF', 0.48), fontWeight: 800 }}>
              COMPLETION
            </Typography>
            <Box
              sx={{
                height: 7,
                bgcolor: alpha('#FFFFFF', 0.08),
                borderRadius: 3,
                mt: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${MINT} 0%, #F0C19D 100%)`,
                  transition: 'width 0.5s ease',
                }}
              />
            </Box>
            <Typography
              sx={{
                mt: 1,
                display: 'block',
                fontWeight: 800,
                color: '#FFF6F0',
                fontSize: '0.84rem',
              }}
            >
              {progressPercent}% Finished
            </Typography>
          </Box>
        </Box>

        {/* Form Content */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2.2, md: 3.4 },
            background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.96)} 0%, ${alpha(
              '#FFF8F3',
              0.94,
            )} 100%)`,
          }}
        >
          <Box
            sx={{
              p: { xs: 2, md: 2.6 },
              borderRadius: 3,
              border: `1px solid ${alpha(PLUM, 0.1)}`,
              backgroundColor: alpha('#FFFFFF', 0.84),
              boxShadow: `0 10px 28px ${alpha(TEXT_PRIMARY, 0.05)}`,
            }}
          >
          {step === 1 && (
            <StepOneForm
              formData={formData}
              errors={formErrors}
              onChange={handleChange}
              setFormData={setFormData}
              setErrors={setFormErrors}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && <StepTwoForm formData={formData} errors={formErrors} onChange={handleChange} />}
          {step === 3 && (
            <StepThree formData={formData} errors={formErrors} onChange={handleChange} setErrors={setFormErrors} />
          )}

          <Stack
            direction="row"
            spacing={2}
            sx={{
              mt: 4,
              pt: 2.5,
              borderTop: `1px solid ${alpha(PLUM, 0.08)}`,
            }}
          >
            {step > 1 && (
              <Button
                onClick={() => setStep((p) => p - 1)}
                startIcon={<MdArrowBack />}
                sx={{
                  color: PLUM,
                  fontWeight: 800,
                  textTransform: 'none',
                  px: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(PLUM, 0.12)}`,
                  '&:hover': { bgcolor: alpha(PLUM, 0.05) },
                }}
              >
                Previous
              </Button>
            )}

            <CustomIconLoadingButton
              fullWidth
              loading={isPending}
              onClick={handleNext}
              text={step < steps.length ? 'Continue' : 'Complete Setup'}
              loadingText={step < steps.length ? 'Saving...' : 'Finishing...'}
              icon={step < steps.length ? <MdArrowForward /> : <FiCheckCircle />}
              textColor="#FFF8F3"
              styles={{
                flex: 1,
                bgcolor: PLUM,
                borderRadius: 2,
                fontWeight: 800,
                fontSize: '1rem',
                py: 1.25,
                minHeight: 52,
                boxShadow: `0 14px 30px ${alpha(PLUM, 0.24)}`,
                '&:hover': { bgcolor: PLUM_DARK },
                '& .MuiTypography-root': {
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  letterSpacing: '0.01em',
                },
              }}
            />
          </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
