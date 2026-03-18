import { Box, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { TbChartArcs, TbMap2, TbShieldCheck, TbTruckDelivery } from 'react-icons/tb'
import PhoneForm from './PhoneForm'

const PLUM = '#8A1F43'
const TEXT = '#161219'
const MUTED = '#6A616A'
const IVORY = '#F7F2ED'
const IVORY_SOFT = '#FFF9F4'
const MINT = '#56C0A5'
const TYPEFACE = '"Bahnschrift", "Segoe UI", "Helvetica Neue", Arial, sans-serif'

const chips = ['Rate comparison', 'Shipment tracking', 'Courier automation']
const highlights = [
  { value: '6+', label: 'courier partners', icon: <TbTruckDelivery size={16} /> },
  { value: '24/7', label: 'tracking visibility', icon: <TbMap2 size={16} /> },
  { value: '1', label: 'unified dashboard', icon: <TbChartArcs size={16} /> },
]

export default function LoginForm() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(920px 320px at 0% 0%, ${alpha(PLUM, 0.08)} 0%, transparent 62%),
          radial-gradient(760px 260px at 100% 0%, ${alpha(MINT, 0.08)} 0%, transparent 58%),
          linear-gradient(180deg, ${IVORY_SOFT} 0%, ${IVORY} 100%)
        `,
        px: { xs: 1.5, sm: 2.5, md: 3 },
        py: { xs: 2, sm: 3 },
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Grid
        container
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        sx={{
          width: '100%',
          maxWidth: 1180,
          mx: 'auto',
          borderRadius: { xs: 3, md: 4 },
          overflow: 'hidden',
          backgroundColor: alpha('#FFFFFF', 0.88),
          border: `1px solid ${alpha(PLUM, 0.12)}`,
          boxShadow: `0 18px 48px ${alpha(TEXT, 0.1)}`,
          backdropFilter: 'blur(14px)',
          minHeight: { xs: 'auto', md: 660 },
        }}
      >
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            background: `
              radial-gradient(340px 180px at 0% 0%, ${alpha(PLUM, 0.06)} 0%, transparent 74%),
              radial-gradient(260px 160px at 100% 10%, ${alpha(MINT, 0.07)} 0%, transparent 70%),
              linear-gradient(180deg, ${alpha('#FFFFFF', 0.82)} 0%, ${alpha('#F8EDF1', 0.92)} 100%)
            `,
            color: TEXT,
            p: { xs: 2.5, md: 4 },
            position: 'relative',
            borderRight: { xs: 'none', md: `1px solid ${alpha(PLUM, 0.1)}` },
          }}
        >
          <Stack spacing={3} sx={{ position: 'relative', zIndex: 1, justifyContent: 'center' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {chips.map((chip) => (
                <Box
                  key={chip}
                  sx={{
                    px: 1.5,
                    py: 0.7,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(PLUM, 0.14)}`,
                    backgroundColor: alpha('#FFFFFF', 0.72),
                  }}
                >
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, letterSpacing: 0.15 }}>
                    {chip}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Box
              component="img"
              src="/logo/delexpress-logo.svg"
              alt="DelExpress"
              sx={{ width: { xs: 220, sm: 290 }, height: 'auto' }}
            />

            <Stack spacing={1} alignItems="flex-start" sx={{ maxWidth: 340 }}>
              <Box
                component={motion.div}
                initial={{ rotate: -14, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                whileHover={{ rotate: 12 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1.75,
                  bgcolor: alpha(PLUM, 0.08),
                  color: PLUM,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TbShieldCheck size={20} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: PLUM,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  lineHeight: 1.45,
                  maxWidth: 280,
                }}
              >
                Dispatch faster with one cleaner shipping control center
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontFamily: TYPEFACE,
                fontSize: { xs: '2.1rem', md: '3.35rem' },
                lineHeight: 0.99,
                fontWeight: 700,
                maxWidth: 500,
                color: TEXT,
                letterSpacing: '-0.025em',
              }}
            >
              Ship smarter.
              <Box component="span" sx={{ color: PLUM, display: 'block' }}>
                Save more on every order.
              </Box>
            </Typography>

            <Typography sx={{ color: MUTED, fontSize: '0.95rem', maxWidth: 485, lineHeight: 1.65 }}>
              Compare courier partners, automate shipping, and track every order from a single
              dashboard. Built for growing ecommerce sellers who want faster deliveries and lower
              shipping costs.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {highlights.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: 2.5,
                    border: `1px solid ${alpha(PLUM, 0.1)}`,
                    backgroundColor: alpha('#FFFFFF', 0.82),
                    px: 1.8,
                    py: 1.5,
                    boxShadow: `0 8px 18px ${alpha(TEXT, 0.045)}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ color: PLUM, display: 'flex' }}>{item.icon}</Box>
                    <Typography
                      sx={{
                        fontFamily: TYPEFACE,
                        fontSize: '1.45rem',
                        fontWeight: 700,
                        color: PLUM,
                        lineHeight: 1,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Stack>
                  <Typography sx={{ mt: 0.7, color: MUTED, fontSize: '0.82rem', lineHeight: 1.55 }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Grid>

        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2.4, sm: 3.2, md: 4 },
            background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.94)} 0%, ${alpha(IVORY_SOFT, 0.9)} 100%)`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
            <Stack spacing={1.2} mb={2.8}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  component={motion.div}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.8 }}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    bgcolor: alpha(PLUM, 0.08),
                    color: PLUM,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TbTruckDelivery size={18} />
                </Box>
                <Typography sx={{ fontSize: '0.74rem', letterSpacing: 2, fontWeight: 700, color: PLUM }}>
                  DELEXPRESS ACCESS
                </Typography>
              </Stack>

              <Typography
                variant="h4"
                sx={{
                  fontFamily: TYPEFACE,
                  fontWeight: 700,
                  color: TEXT,
                  lineHeight: 1.08,
                  fontSize: { xs: '1.78rem', sm: '2.08rem' },
                  letterSpacing: '-0.02em',
                }}
              >
                Start shipping from one calm dashboard
              </Typography>

              <Typography variant="body2" sx={{ color: MUTED, lineHeight: 1.7, maxWidth: 460 }}>
                Continue with OTP or password to compare rates, create shipments, and track every
                order from a single operations workspace.
              </Typography>
            </Stack>

            <Box
              sx={{
                borderRadius: 3,
                p: { xs: 1.6, sm: 2.2 },
                border: `1px solid ${alpha(PLUM, 0.12)}`,
                background: `
                  radial-gradient(280px 120px at 0% 0%, ${alpha(PLUM, 0.04)} 0%, transparent 74%),
                  linear-gradient(180deg, ${alpha('#FFFFFF', 0.98)} 0%, ${alpha(IVORY_SOFT, 0.95)} 100%)
                `,
                boxShadow: `0 12px 28px ${alpha(TEXT, 0.065)}`,
              }}
            >
              <PhoneForm />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
