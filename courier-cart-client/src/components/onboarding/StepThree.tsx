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

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

export default function StepThree({ formData, errors, onChange, setErrors }: IStepThree) {
  return (
    <Stack spacing={{ xs: 2.2, md: 2.8 }}>
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: DE_BLUE,
            mb: 0.8,
            fontSize: { xs: '1.2rem', sm: '1.45rem', md: '1.65rem' },
          }}
        >
          Integrations & Storefront
        </Typography>
        <Typography variant="body2" sx={{ color: '#5f7498', fontSize: { xs: '0.82rem', sm: '0.9rem' } }}>
          Add your website now. Direct platform integrations can be enabled later from settings.
        </Typography>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 1,
          border: `1px solid ${alpha(DE_AMBER, 0.25)}`,
          background: `linear-gradient(180deg, ${alpha(DE_AMBER, 0.12)} 0%, ${alpha(
            DE_AMBER,
            0.04,
          )} 100%)`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={1.1}>
          <FiTool size={16} color={DE_AMBER} />
          <Typography sx={{ fontWeight: 700, color: '#9b4d00', fontSize: '0.95rem' }}>
            Shopify and channel integrations are currently unavailable
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: '#7e5a34', lineHeight: 1.6 }}>
          You can finish onboarding now. Once integrations are enabled, connect Shopify,
          WooCommerce, Amazon, or other channels from the Integrations page.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={1.4}>
          <Chip
            icon={<FiClock size={13} />}
            label="Available soon"
            size="small"
            sx={{ backgroundColor: '#fff', border: `1px solid ${alpha('#9b4d00', 0.2)}`, color: '#9b4d00' }}
          />
          <Chip
            icon={<FiLink size={13} />}
            label="Connect later from Settings"
            size="small"
            sx={{ backgroundColor: '#fff', border: `1px solid ${alpha('#9b4d00', 0.2)}`, color: '#9b4d00' }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 1,
          border: `1px solid ${alpha(DE_BLUE, 0.14)}`,
          backgroundColor: alpha(DE_BLUE, 0.02),
        }}
      >
        <CustomInput
          onChange={(e) => onChange(e, 'businessLegal')}
          onBlur={(e) => {
            const value = e.target.value?.trim()
            const isValidURL =
              !value ||
              /^(https?:\/\/)?([\w\d-]+\.)+[\w]{2,}(\/[\w\d#?&=.-]*)*\/?$/.test(value)

            setErrors((prev) => ({
              ...prev,
              businessLegal: {
                ...prev.businessLegal,
                websiteUrl: isValidURL ? '' : 'Invalid URL. Example: https://www.yourstore.com',
              },
            }))
          }}
          name="websiteUrl"
          value={formData?.businessLegal?.websiteUrl}
          label="Business Website (Optional)"
          placeholder="https://www.yourstore.com"
          error={!!errors.businessLegal?.websiteUrl}
          helperText={errors.businessLegal?.websiteUrl}
          fullWidth
          prefix={<FiLink color={DE_BLUE} />}
        />
      </Box>
    </Stack>
  )
}
