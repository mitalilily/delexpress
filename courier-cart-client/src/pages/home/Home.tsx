import { alpha, Box, Grid, Stack, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { TbBolt, TbShip, TbTruck, TbWorld } from 'react-icons/tb'
import AccountSetup from '../../components/home/AccountSetup'
import CourierDistribution from '../../components/home/CourierDistribution'
import GettingStarted from '../../components/home/GettingStarted'
import TopDestinations from '../../components/home/TopDestinations'
import UpcomingPickupsHome from '../../components/home/UpcomingPickupsHome'
import FeatureSection from '../../components/home/FeatureSection'
import CarrierLogos from '../../components/home/CarrierLogos'
import SectionHeading from '../../components/UI/SectionHeading'
import { useRealtimeHomeDashboard } from '../../hooks/home/useRealtimeHomeDashboard'

const DE_AMBER = '#56C0A5'
const TEXT_PRIMARY = '#161219'
const TEXT_SECONDARY = '#6A616A'
const PLUM = '#8A1F43'
const PLUM_DARK = '#5E1630'

const cardShell = {
  borderRadius: 1,
  p: { xs: 2, md: 2.75 },
  bgcolor: '#ffffff',
  border: `1px solid ${alpha(PLUM, 0.08)}`,
  boxShadow: `0 4px 12px ${alpha(TEXT_PRIMARY, 0.04)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: `0 20px 40px ${alpha(TEXT_PRIMARY, 0.08)}`,
    borderColor: alpha(PLUM, 0.15),
    transform: 'translateY(-4px)',
  }
}

const Home = () => {
  const {
    incomingPickupsState,
    courierDistributionState,
    topDestinationsState,
  } = useRealtimeHomeDashboard()

  return (
    <Stack spacing={{ xs: 2.5, md: 4 }} sx={{ pb: 5 }}>
      {/* ─────────── Advanced Hero Section ─────────── */}
      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 1.5 }}>
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <Box
            sx={{
              p: { xs: 3.2, md: 6 },
              minHeight: { md: '380px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              background: `
                radial-gradient(circle at 12% 10%, ${alpha(PLUM, 0.12)} 0%, transparent 30%),
                radial-gradient(circle at 88% 12%, ${alpha(DE_AMBER, 0.16)} 0%, transparent 26%),
                linear-gradient(135deg, #fffdf9 0%, #f8ebf0 58%, #eef8f4 100%)
              `,
              position: 'relative',
              color: TEXT_PRIMARY,
              border: `1px solid ${alpha(PLUM, 0.12)}`,
              boxShadow: `0 18px 42px ${alpha(TEXT_PRIMARY, 0.08)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.2, sm: 1.5 }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              sx={{
                position: 'absolute',
                top: { xs: 18, md: 24 },
                left: { xs: 18, md: 24 },
                zIndex: 2,
                maxWidth: { xs: 'calc(100% - 36px)', md: 420 },
              }}
            >
              <Box
                component="img"
                src="/logo/delexpress-logo.svg"
                alt="DelExpress"
                sx={{ width: { xs: 132, md: 152 }, height: 'auto', display: 'block' }}
              />
              <Typography
                sx={{
                  fontSize: { xs: '0.72rem', md: '0.76rem' },
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: PLUM,
                  lineHeight: 1.5,
                }}
              >
                Smarter dispatch. Clear tracking. Better delivery margins.
              </Typography>
            </Stack>

            {/* Background Decorations */}
            <Box
              component={motion.div}
              animate={{ 
                rotate: 360,
                x: [0, 50, 0],
                y: [0, 30, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              sx={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(PLUM, 0.08)} 0%, transparent 70%)`,
              }}
            />
            
            <Stack
              spacing={3}
              sx={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '700px',
                pt: { xs: 10.5, md: 9.5 },
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ bgcolor: alpha(PLUM, 0.1), p: 0.6, borderRadius: 0.75, color: PLUM }}>
                    <TbBolt size={20} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '12px', letterSpacing: 2, textTransform: 'uppercase', color: PLUM }}>
                    DelExpress control layer
                  </Typography>
                </Stack>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Typography variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3.3rem' }, fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.03em' }}>
                  Ship smarter.
                  <br />
                  <span style={{ color: PLUM }}>Run every order from one calm dashboard.</span>
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Typography sx={{ fontSize: '1rem', color: TEXT_SECONDARY, maxWidth: '560px', lineHeight: 1.65 }}>
                  Compare courier options, manage pickups, track shipments, and keep daily shipping
                  operations under one light, focused workspace.
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="contained" 
                    size="large"
                    sx={{ 
                      bgcolor: PLUM, 
                      color: '#fffdf9', 
                      fontWeight: 700,
                      px: 3.2,
                      borderRadius: 1,
                      '&:hover': { bgcolor: PLUM_DARK, transform: 'translateY(-2px)' },
                      transition: 'all 0.2s'
                    }}
                  >
                    Start Shipping
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    sx={{ 
                      borderColor: alpha(PLUM, 0.22), 
                      color: TEXT_PRIMARY, 
                      fontWeight: 700,
                      px: 3.2,
                      borderRadius: 1,
                      bgcolor: alpha('#ffffff', 0.54),
                      '&:hover': { borderColor: PLUM, bgcolor: alpha('#ffffff', 0.82) }
                    }}
                  >
                    View Rates
                  </Button>
                </Stack>
              </motion.div>
            </Stack>

            {/* Floating Icons */}
            <Box sx={{ position: 'absolute', right: '10%', top: '20%', display: { xs: 'none', lg: 'block' } }}>
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Stack spacing={4}>
                  <Box sx={{ bgcolor: alpha('#ffffff', 0.1), p: 3, borderRadius: 2, backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <TbTruck size={40} color={PLUM} />
                  </Box>
                  <Box sx={{ bgcolor: alpha('#ffffff', 0.55), p: 3, borderRadius: 2, backdropFilter: 'blur(12px)', border: `1px solid ${alpha(PLUM, 0.14)}`, ml: 8 }}>
                    <TbWorld size={40} color={TEXT_PRIMARY} />
                  </Box>
                  <Box sx={{ bgcolor: alpha('#ffffff', 0.55), p: 3, borderRadius: 2, backdropFilter: 'blur(12px)', border: `1px solid ${alpha(PLUM, 0.14)}` }}>
                    <TbShip size={40} color={DE_AMBER} />
                  </Box>
                </Stack>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* ─────────── Operations Overview ─────────── */}
      <Box>
        <SectionHeading 
          title="Operations Command Center" 
          subtitle="Real-time monitoring and management of your global supply chain."
          icon={<TbBolt size={22} />}
        />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Box sx={cardShell}>
                <GettingStarted />
              </Box>
            </motion.div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Box sx={cardShell}>
                <AccountSetup />
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Box>

      {/* ─────────── Analytics ─────────── */}
      <Box>
        <SectionHeading 
          title="Logistics Intelligence" 
          subtitle="Deep insights into courier performance and delivery hotspots."
          icon={<TbBolt size={22} />}
          color={DE_AMBER}
        />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={cardShell}>
              <TopDestinations
                data={topDestinationsState.data}
                isLoading={topDestinationsState.isLoading}
                error={topDestinationsState.error}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={cardShell}>
              <CourierDistribution
                data={courierDistributionState.data}
                isLoading={courierDistributionState.isLoading}
                error={courierDistributionState.error}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ─────────── Features & Integration ─────────── */}
      <FeatureSection />
      <CarrierLogos />

      {/* ─────────── Active Tasks ─────────── */}
      <Box>
        <SectionHeading 
          title="Pending Actions" 
          subtitle="Critical operations requiring your immediate attention."
          icon={<TbBolt size={22} />}
        />
        <Box sx={cardShell}>
          <UpcomingPickupsHome
            data={incomingPickupsState.data}
            isLoading={incomingPickupsState.isLoading}
            error={incomingPickupsState.error}
          />
        </Box>
      </Box>
    </Stack>
  )
}

export default Home
