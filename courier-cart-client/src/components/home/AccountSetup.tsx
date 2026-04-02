import { alpha, Box, Grid, LinearProgress, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'
const TEXT_PRIMARY = '#172B4D'
const TEXT_SECONDARY = '#42526E'

const AccountSetup = () => {
  const { checklist, progress, completedCount, totalCount, isReady, isLoading, assignedPlanName, assignedPlanId } =
    useMerchantReadiness()
  const navigate = useNavigate()
  const assignedPlanLabel = isLoading
    ? 'Checking assigned plan...'
    : assignedPlanName || assignedPlanId || 'Not assigned'

  return (
    <Stack gap={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap={1.2}
      >
        <Box>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: TEXT_PRIMARY }}>
            Merchant Readiness
          </Typography>
          <Typography sx={{ fontSize: '0.84rem', color: TEXT_SECONDARY, mt: 0.45, fontWeight: 500 }}>
            Complete all setup checks before order creation is enabled.
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: DE_BLUE, mt: 0.55, fontWeight: 800 }}>
            Assigned Plan: {assignedPlanLabel}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1.2,
            py: 0.5,
            borderRadius: 0.5,
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            bgcolor: isReady ? alpha('#36B37E', 0.1) : alpha(DE_AMBER, 0.1),
            color: isReady ? '#00875A' : '#BF2600',
            border: `1px solid ${isReady ? alpha('#36B37E', 0.2) : alpha(DE_AMBER, 0.2)}`,
          }}
        >
          {completedCount}/{totalCount} complete
        </Box>
      </Stack>

      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
          bgcolor: alpha(DE_BLUE, 0.02),
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 1,
            bgcolor: alpha(DE_BLUE, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 1,
              bgcolor: DE_BLUE,
            },
          }}
        />
        <Typography sx={{ mt: 0.75, fontSize: '11px', color: TEXT_SECONDARY, fontWeight: 700 }}>
          {progress}% complete
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {checklist.map((step, idx) => (
          <Grid size={{ xs: 12, sm: 6 }} key={idx}>
            <Box
              onClick={() => !step.done && navigate(step.path)}
              sx={{
                p: 1.8,
                borderRadius: 1,
                border: `1px solid ${step.done ? alpha('#36B37E', 0.15) : alpha(DE_BLUE, 0.08)}`,
                bgcolor: step.done ? alpha('#36B37E', 0.03) : '#ffffff',
                cursor: step.done ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: step.done ? alpha('#36B37E', 0.3) : DE_BLUE,
                  boxShadow: step.done ? 'none' : `0 4px 12px ${alpha(DE_BLUE, 0.08)}`,
                },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: step.done ? '#36B37E' : alpha(DE_BLUE, 0.1),
                    color: step.done ? '#ffffff' : DE_BLUE,
                  }}
                >
                  {step.done ? '✓' : idx + 1}
                </Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: TEXT_PRIMARY }}>
                  {step.title}
                </Typography>
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default AccountSetup
