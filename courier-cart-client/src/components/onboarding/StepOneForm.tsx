import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React, { useEffect, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import { FiUser } from 'react-icons/fi'
import { MdBusiness, MdEmail, MdLocationPin, MdPhone } from 'react-icons/md'
import { lookupPincodeLocation } from '../../api/locations'
import { useAuth } from '../../context/auth/AuthContext'
import type { FormErrors } from '../../pages/onboarding/UserOnboarding'
import type { UserInfoData } from '../../types/user.types'
import { createSyntheticEvent } from '../../utils/functions'
import CustomInput from '../UI/inputs/CustomInput'

interface StepOneProps {
  formData: UserInfoData
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    subKey?: keyof UserInfoData,
  ) => void
  setFormData: Dispatch<SetStateAction<UserInfoData>>
  onNext: () => void
  errors: FormErrors
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
}

const PLUM = '#7696AC'
const MINT = '#56C0A5'
const TEXT_PRIMARY = '#161219'
const TEXT_SECONDARY = '#6A616A'

export default function StepOneForm({ formData, onChange, errors, setFormData, setErrors }: StepOneProps) {
  const { user: userData } = useAuth()
  const [loadingPincode, setLoadingPincode] = useState(false)
  const [location, setLocation] = useState<{ city: string; state: string }>({ city: '', state: '' })
  const emailVerified = Boolean(
    userData?.companyInfo?.contactEmail && userData?.companyInfo?.POCEmailVerified,
  )
  const phoneVerified = Boolean(
    userData?.companyInfo?.contactNumber && userData?.companyInfo?.POCPhoneVerified,
  )

  useEffect(() => {
    const pincode = String(formData?.basicInfo?.pincode || '')
      .replace(/\D/g, '')
      .slice(0, 6)

    if (!pincode || pincode.length !== 6) {
      setErrors((prev) => ({
        ...prev,
        basicInfo: { ...prev.basicInfo, pincode: '' },
      }))
      setLocation({ city: '', state: '' })
      setFormData((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          city: '',
          state: '',
        },
      }))
      return
    }

    const controller = new AbortController()

    async function fetchLocation() {
      setLoadingPincode(true)
      try {
        const loc = await lookupPincodeLocation(pincode, controller.signal)
        if (controller.signal.aborted) return

        const city = loc?.city || ''
        const state = loc?.state || ''

        setErrors((prev) => ({
          ...prev,
          basicInfo: { ...prev.basicInfo, pincode: '' },
        }))
        setLocation({ city, state })
        setFormData((prev) => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            city,
            state,
          },
        }))
      } catch (error: any) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
        setErrors((prev) => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            pincode: error?.response?.data?.message || 'Invalid pincode or no location found.',
          },
        }))
        setLocation({ city: '', state: '' })
        setFormData((prev) => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            city: '',
            state: '',
          },
        }))
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPincode(false)
        }
      }
    }

    fetchLocation()
    return () => controller.abort()
  }, [formData?.basicInfo?.pincode, setErrors, setFormData])

  const fieldCardSx = {
    p: { xs: 1.15, md: 1.35 },
    borderRadius: 2.5,
    border: `1px solid ${alpha(PLUM, 0.1)}`,
    background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.92)} 0%, ${alpha('#FFF8F3', 0.86)} 100%)`,
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.6 }}>
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: TEXT_PRIMARY, mb: 0.7, fontSize: { xs: '1.32rem', md: '1.7rem' } }}
        >
          Contact & Company Details
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY, lineHeight: 1.7, maxWidth: 680 }}>
          Add primary contact information and your business location to start shipping setup.
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={fieldCardSx}>
            <CustomInput
              label="First Name"
              name="firstName"
              value={formData?.basicInfo?.firstName}
              onChange={(e) => onChange(e, 'basicInfo')}
              required
              error={!!errors.basicInfo.firstName}
              helperText={errors.basicInfo.firstName}
              prefix={<FiUser color={PLUM} />}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={fieldCardSx}>
            <CustomInput
              label="Last Name"
              name="lastName"
              value={formData?.basicInfo.lastName}
              onChange={(e) => onChange(e, 'basicInfo')}
              required
              error={!!errors.basicInfo.lastName}
              helperText={errors.basicInfo.lastName}
              prefix={<FiUser color={PLUM} />}
            />
          </Box>
        </Grid>
      </Grid>

      <Box sx={fieldCardSx}>
        <CustomInput
          label="Business Name"
          name="companyName"
          value={formData?.basicInfo.companyName}
          onChange={(e) => onChange(e, 'basicInfo')}
          required
          error={!!errors.basicInfo.companyName}
          helperText={errors.basicInfo.companyName}
          prefix={<MdBusiness color={PLUM} />}
        />
      </Box>

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={fieldCardSx}>
            <CustomInput
              label="Email"
              name="email"
              type="email"
              value={formData?.basicInfo.email}
              onChange={(e) => onChange(e, 'basicInfo')}
              disabled={emailVerified}
              required
              error={!!errors.basicInfo.email}
              helperText={errors.basicInfo.email}
              prefix={<MdEmail color={PLUM} />}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={fieldCardSx}>
            <CustomInput
              label="Phone"
              name="phone"
              type="tel"
              value={formData?.basicInfo?.phone}
              onChange={(e) => onChange(createSyntheticEvent('phone', e.target.value), 'basicInfo')}
              disabled={phoneVerified}
              required
              error={!!errors.basicInfo.phone}
              helperText={errors.basicInfo.phone}
              prefix={<MdPhone color={PLUM} />}
            />
          </Box>
        </Grid>
      </Grid>

      <Box sx={fieldCardSx}>
        <CustomInput
          label="Pincode"
          name="pincode"
          value={formData?.basicInfo?.pincode}
          onChange={(e) =>
            onChange(
              createSyntheticEvent('pincode', e.target.value.replace(/\D/g, '').slice(0, 6)),
              'basicInfo',
            )
          }
          error={!!errors.basicInfo.pincode}
          helperText={errors.basicInfo.pincode}
          prefix={<MdLocationPin color={PLUM} />}
        />
      </Box>

      {loadingPincode && (
        <Chip
          label="Validating pincode..."
          sx={{
            width: 'fit-content',
            backgroundColor: alpha(PLUM, 0.08),
            color: PLUM,
            fontWeight: 700,
          }}
        />
      )}

      {location?.city && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            backgroundColor: alpha(MINT, 0.12),
            border: `1px solid ${alpha(MINT, 0.24)}`,
          }}
        >
          <Typography variant="body2" sx={{ color: '#2F8E77', fontWeight: 700 }}>
            Detected location: {location.city}, {location.state}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}
