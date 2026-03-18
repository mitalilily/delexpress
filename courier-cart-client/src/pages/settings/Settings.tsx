import {
  alpha,
  Box,
  ButtonBase,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { FaBuilding, FaFileInvoice, FaTruck, FaUsers } from 'react-icons/fa'
import { FaLink } from 'react-icons/fa6'
import { IoDocumentTextOutline } from 'react-icons/io5'
import { MdOutlineRequestQuote, MdPriorityHigh, MdSecurity } from 'react-icons/md'
import { PiPassword } from 'react-icons/pi'
import { RiBankFill } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import CustomSelectSearchable from '../../components/UI/inputs/CustomSelectSearchable'

type SettingItem = {
  title: string
  description: string
  key: string
  icon: React.ReactNode
}

type Section = {
  title: string
  badge: string
  items: SettingItem[]
}

const BRAND_PRIMARY = '#0D3B8E'
const BRAND_ACCENT = '#FF7A00'
const INK = '#102A54'
const MUTED = '#496189'

const sections: Section[] = [
  {
    title: 'Profile Management',
    badge: 'Identity',
    items: [
      {
        title: 'Company Profile',
        description: 'Create your profile for personalized shipping',
        key: '/profile/company',
        icon: <FaBuilding />,
      },
      {
        title: 'Change Password',
        description: 'Stay secure, update password',
        key: '/profile/user_profile/settings/password',
        icon: <PiPassword />,
      },
      {
        title: 'KYC Details',
        description: 'Your KYC information kept safe for your reference',
        key: '/profile/kyc_details',
        icon: <MdSecurity />,
      },
      {
        title: 'Bank Details',
        description: 'Check your bank account information here',
        key: '/profile/bank_details',
        icon: <RiBankFill />,
      },
      {
        title: 'User Management',
        description: 'Add users or teams and grant them access with ease',
        key: '/settings/users_management',
        icon: <FaUsers />,
      },
    ],
  },
  {
    title: 'Shipment Settings',
    badge: 'Operations',
    items: [
      {
        title: 'Manage Pickup Addresses',
        description: 'Add multiple pickup locations and manage them easily',
        key: '/settings/manage_pickups',
        icon: <FaTruck />,
      },
      {
        title: 'Invoice Preferences',
        description: 'Set printer type, logo, signature & more',
        key: '/settings/invoice_preferences',
        icon: <FaFileInvoice />,
      },
      {
        title: 'Billing Preferences',
        description: 'Set invoice frequency and automation settings',
        key: '/settings/billing_preferences',
        icon: <MdOutlineRequestQuote />,
      },
      {
        title: 'Label Configuration',
        description: 'Configure your label fields with a live preview',
        key: '/settings/label_config',
        icon: <IoDocumentTextOutline />,
      },
    ],
  },
  {
    title: 'Setup & Manage',
    badge: 'Integrations',
    items: [
      {
        title: 'Manage Channels',
        description: 'Enable, disable or edit existing channels',
        key: '/channels/connected',
        icon: <FaLink />,
      },
      {
        title: 'Courier Priority',
        description: 'Prioritise speed, cost, performance or custom needs',
        key: '/settings/courier_priority',
        icon: <MdPriorityHigh />,
      },
      {
        title: 'API Integration',
        description: 'Manage API keys and webhook subscriptions',
        key: '/settings/api-integration',
        icon: <FaLink />,
      },
    ],
  },
]

const SettingCard = ({ item }: { item: SettingItem }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <ButtonBase sx={{ width: '100%', height: '100%', borderRadius: 2.5 }}>
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 2.2,
          borderRadius: 2.5,
          bgcolor: '#fff',
          border: `1px solid ${alpha(BRAND_PRIMARY, 0.14)}`,
          boxShadow: `0 8px 18px ${alpha(BRAND_PRIMARY, 0.07)}`,
          height: '100%',
          width: '100%',
          minHeight: isMobile ? 134 : 154,
          transition: 'all .22s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 24px ${alpha(BRAND_PRIMARY, 0.12)}`,
            borderColor: alpha(BRAND_ACCENT, 0.45),
          },
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.4} mb={1.2}>
          <Box
            sx={{
              borderRadius: 1.8,
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40,
              display: 'grid',
              placeItems: 'center',
              fontSize: isMobile ? 18 : 19,
              color: BRAND_PRIMARY,
              bgcolor: alpha(BRAND_PRIMARY, 0.12),
              border: `1px solid ${alpha(BRAND_PRIMARY, 0.2)}`,
            }}
          >
            {item.icon}
          </Box>
          <Typography fontWeight={700} fontSize={isMobile ? '14px' : '15px'} color={INK}>
            {item.title}
          </Typography>
        </Stack>

        <Typography variant="body2" color={MUTED} fontSize={isMobile ? '13px' : '13.5px'} lineHeight={1.45}>
          {item.description}
        </Typography>
      </Paper>
    </ButtonBase>
  )
}

const SettingsPage = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const flattenedItems = sections.flatMap((section) =>
    section.items.map((item) => ({
      key: item.key,
      label: item.title,
      description: item.description,
      icon: item.icon,
      section: section.title,
    })),
  )

  const handleSelect = (key: string) => {
    navigate(key)
  }

  return (
    <Box sx={{ minHeight: '100%', py: { xs: 2.2, md: 2.8 } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            mb: 3,
            p: { xs: 2.2, md: 2.7 },
            borderRadius: 3,
            border: `1px solid ${alpha(BRAND_PRIMARY, 0.16)}`,
            background: `linear-gradient(140deg, ${alpha(BRAND_PRIMARY, 0.93)} 0%, ${alpha(
              '#244f9e',
              0.94,
            )} 58%, ${alpha(BRAND_ACCENT, 0.9)} 100%)`,
            boxShadow: `0 14px 30px ${alpha(BRAND_PRIMARY, 0.2)}`,
            color: '#fff',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            gap={1.4}
          >
            <Box>
              <Typography sx={{ fontSize: { xs: '1.35rem', md: '1.85rem' }, fontWeight: 800, mb: 0.5 }}>
                Settings Workspace
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: alpha('#fff', 0.86) }}>
                Manage profile, operations, billing, and integrations from one control center.
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '100%', md: 340 } }}>
              <CustomSelectSearchable
                label="Search Settings"
                items={flattenedItems}
                onSelect={handleSelect}
                placeholder="Jump to setting..."
              />
            </Box>
          </Stack>
        </Box>

        <Stack spacing={3}>
          {sections.map((section) => (
            <Box
              key={section.title}
              sx={{
                p: { xs: 1.5, md: 2.1 },
                borderRadius: 2.8,
                bgcolor: alpha('#fff', 0.95),
                border: `1px solid ${alpha(BRAND_PRIMARY, 0.12)}`,
                boxShadow: `0 8px 18px ${alpha(BRAND_PRIMARY, 0.06)}`,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800} color={INK}>
                  {section.title}
                </Typography>
                <Chip
                  label={section.badge}
                  sx={{
                    bgcolor: alpha(BRAND_ACCENT, 0.13),
                    color: '#8a3e00',
                    border: `1px solid ${alpha(BRAND_ACCENT, 0.3)}`,
                    fontWeight: 700,
                    fontSize: '11px',
                    height: 26,
                  }}
                />
              </Stack>

              <Grid container spacing={2}>
                {section.items.map((item) => (
                  <Grid onClick={() => navigate(item.key)} size={{ xs: 12, md: 4, lg: 3 }} key={item.title}>
                    <SettingCard item={item} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  )
}

export default SettingsPage
