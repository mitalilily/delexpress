import { alpha } from '@mui/material/styles'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { FiClock, FiLink, FiTool } from 'react-icons/fi'
import CustomInput from '../UI/inputs/CustomInput'
import type { UserInfoData } from '../../types/user.types'
import type { FormErrors } from '../../pages/onboarding/UserOnboarding'

interface IStepThree {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    subKey?: keyof UserInfoData,
  ) => void
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
}

const PLUM = '#8A1F43'
const MINT = '#56C0A5'
const TEXT_PRIMARY = '#161219'
const TEXT_SECONDARY = '#6A616A'

export default function StepThree({ formData, errors, onChange, setErrors }: IStepThree) {
  return (
    <Stack spacing={{ xs: 2.2, md: 2.8 }}>
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: TEXT_PRIMARY,
            mb: 0.8,
            fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.7rem' },
          }}
        >
          Integrations & Storefront
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY, fontSize: { xs: '0.86rem', sm: '0.96rem' }, lineHeight: 1.7, maxWidth: 680 }}>
          Add your website now. Direct platform integrations can be enabled later from settings.
        </Typography>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 3,
          border: `1px solid ${alpha(MINT, 0.25)}`,
          background: `linear-gradient(180deg, ${alpha(MINT, 0.14)} 0%, ${alpha(
            MINT,
            0.04,
          )} 100%)`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={1.1}>
          <FiTool size={16} color="#2F8E77" />
          <Typography sx={{ fontWeight: 700, color: '#2F8E77', fontSize: '0.95rem' }}>
            Shopify and channel integrations are currently unavailable
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: '#3E6A60', lineHeight: 1.7 }}>
          You can finish onboarding now. Once integrations are enabled, connect Shopify,
          WooCommerce, Amazon, or other channels from the Integrations page.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={1.4}>
          <Chip
            icon={<FiClock size={13} />}
            label="Available soon"
            size="small"
            sx={{ backgroundColor: '#fff', border: `1px solid ${alpha('#2F8E77', 0.2)}`, color: '#2F8E77' }}
          />
          <Chip
            icon={<FiLink size={13} />}
            label="Connect later from Settings"
            size="small"
            sx={{ backgroundColor: '#fff', border: `1px solid ${alpha('#2F8E77', 0.2)}`, color: '#2F8E77' }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 3,
          border: `1px solid ${alpha(PLUM, 0.12)}`,
          background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.94)} 0%, ${alpha('#FFF8F3', 0.88)} 100%)`,
        }}
      >
        <CustomInput
          onChange={(e) => onChange(e, 'basicInfo')}
          onBlur={(e) => {
            const value = e.target.value?.trim()
            const isValidURL =
              !value ||
              /^(https?:\/\/)?([\w\d-]+\.)+[\w]{2,}(\/[\w\d#?&=.-]*)*\/?$/.test(value)

            setErrors((prev) => ({
              ...prev,
              basicInfo: {
                ...prev.basicInfo,
                personalWebsite: isValidURL
                  ? ''
                  : 'Invalid URL. Example: https://www.yourstore.com',
              },
            }))
          }}
          name="personalWebsite"
          value={formData?.basicInfo?.personalWebsite}
          label="Business Website (Optional)"
          placeholder="https://www.yourstore.com"
          error={!!errors.basicInfo?.personalWebsite}
          helperText={errors.basicInfo?.personalWebsite}
          fullWidth
          prefix={<FiLink color={PLUM} />}
        />
      </Box>
    </Stack>
  )
}
