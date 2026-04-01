import { Box, Checkbox, FormControlLabel, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { MdBusiness, MdTrendingUp } from 'react-icons/md'
import type { UserInfoData } from '../../types/user.types'
import type { FormErrors } from '../../pages/onboarding/UserOnboarding'
import { createSyntheticEvent } from '../../utils/functions'
import CustomInput from '../UI/inputs/CustomInput'
import CustomSelect from '../UI/inputs/CustomSelect'

interface StepTwoFormProps {
  formData: UserInfoData
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    subKey: keyof UserInfoData,
  ) => void
  errors: FormErrors
}

const PLUM = '#8A1F43'
const MINT = '#56C0A5'
const TEXT_PRIMARY = '#161219'
const TEXT_SECONDARY = '#6A616A'

const BUSINESS_OPTIONS = [
  {
    key: 'b2b',
    title: 'B2B',
    subtitle: 'I sell to other businesses',
  },
  {
    key: 'b2c',
    title: 'Marketplace B2C',
    subtitle: 'I sell on Amazon, Flipkart, etc.',
  },
  {
    key: 'd2c',
    title: 'D2C',
    subtitle: 'I sell via website, social, or store',
  },
]

export default function StepTwoForm({ formData, onChange, errors }: StepTwoFormProps) {
  const [sameAsCompany, setSameAsCompany] = useState(false)

  const selectedCategories = useMemo(
    () =>
      Array.isArray(formData?.businessLegal?.businessCategory)
        ? formData.businessLegal.businessCategory
        : [],
    [formData?.businessLegal?.businessCategory],
  )

  useEffect(() => {
    if (!sameAsCompany) return

    const companyName = formData.basicInfo?.companyName || ''
    onChange(createSyntheticEvent('brandName', companyName), 'businessLegal')
  }, [sameAsCompany, formData.basicInfo?.companyName, onChange])

  const toggleCategory = (value: string) => {
    const next = selectedCategories.includes(value)
      ? selectedCategories.filter((item) => item !== value)
      : [...selectedCategories, value]

    onChange(createSyntheticEvent('businessCategory', next), 'businessLegal')
  }

  return (
    <Stack spacing={{ xs: 2.2, md: 2.8 }}>
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: TEXT_PRIMARY, mb: 0.7, fontSize: { xs: '1.3rem', md: '1.7rem' } }}
        >
          Business Setup
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY, lineHeight: 1.7, maxWidth: 680 }}>
        Choose your business model and shipping volume so we can configure your account defaults.
        </Typography>
      </Box>

      <Box
        sx={{
          p: { xs: 1.6, md: 2 },
          borderRadius: 3,
          border: `1px solid ${alpha(PLUM, 0.1)}`,
          background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.94)} 0%, ${alpha('#FFF8F3', 0.88)} 100%)`,
        }}
      >
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: PLUM, mb: 1.2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Select one or more business types
        </Typography>

        <Grid container spacing={1.3}>
          {BUSINESS_OPTIONS.map((option) => {
            const active = selectedCategories.includes(option.key)

            return (
              <Grid key={option.key} size={{ xs: 12, md: 4 }}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCategory(option.key)}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') toggleCategory(option.key)
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    border: `1px solid ${active ? alpha(PLUM, 0.28) : alpha(PLUM, 0.1)}`,
                    background: active
                      ? `linear-gradient(180deg, ${alpha('#FFF4F1', 0.98)} 0%, ${alpha('#FCEBE3', 0.92)} 100%)`
                      : '#fff',
                    cursor: 'pointer',
                    transition: 'all .2s ease',
                    boxShadow: active ? `0 10px 24px ${alpha(PLUM, 0.08)}` : 'none',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      color: active ? PLUM : TEXT_PRIMARY,
                    }}
                  >
                    {option.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: TEXT_SECONDARY, mt: 0.25, lineHeight: 1.55 }}>
                    {option.subtitle}
                  </Typography>
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      <Box
        sx={{
          p: { xs: 1.6, md: 2 },
          borderRadius: 3,
          border: `1px solid ${alpha(PLUM, 0.1)}`,
          background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.94)} 0%, ${alpha('#FFF8F3', 0.88)} 100%)`,
        }}
      >
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: PLUM, mb: 1.6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Monthly Volume & Brand Identity
        </Typography>

        <Grid container spacing={2.2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect
              label="Expected Shipments / Month"
              name="monthlyShipments"
              value={formData?.businessLegal?.monthlyShipments}
              onChange={(e) => onChange(e, 'businessLegal')}
              required
              error={!!errors.businessLegal.monthlyShipments}
              helperText={errors.businessLegal.monthlyShipments}
              prefix={<MdTrendingUp color={PLUM} />}
            >
              <option value="">Select volume range</option>
              <option value="0-100">0 - 100</option>
              <option value="101-500">101 - 500</option>
              <option value="501-2000">501 - 2,000</option>
              <option value="2000+">2,000+</option>
            </CustomSelect>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1}>
              <CustomInput
                label="Brand Name"
                name="brandName"
                value={formData?.businessLegal?.brandName}
                onChange={(e) => onChange(e, 'businessLegal')}
                required
                error={!!errors.businessLegal.brandName}
                helperText={errors.businessLegal.brandName}
                prefix={<MdBusiness color={PLUM} />}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={sameAsCompany}
                    onChange={(e) => setSameAsCompany(e.target.checked)}
                    sx={{ color: alpha(PLUM, 0.35), '&.Mui-checked': { color: PLUM } }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontWeight: 600 }}>
                    Same as company name
                  </Typography>
                }
              />
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: alpha(MINT, 0.1),
          border: `1px solid ${alpha(MINT, 0.22)}`,
        }}
      >
        <Typography variant="caption" sx={{ color: '#2F8E77', fontWeight: 700, display: 'block', lineHeight: 1.7 }}>
          Configuring your account based on your business type helps us provide the most relevant
          carrier recommendations.
        </Typography>
      </Box>
    </Stack>
  )
}
