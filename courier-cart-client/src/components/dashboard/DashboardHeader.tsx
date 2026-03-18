import { alpha, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { MdDashboardCustomize, MdRefresh } from 'react-icons/md'

interface DashboardHeaderProps {
  isRefetching: boolean
  onRefresh: () => void
  onCustomize?: () => void
}

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

export default function DashboardHeader({ isRefetching, onRefresh, onCustomize }: DashboardHeaderProps) {
  return (
    <Box
      sx={{
        mb: 2.8,
        p: { xs: 2, md: 2.6 },
        borderRadius: 1,
        border: `1px solid ${alpha(DE_BLUE, 0.16)}`,
        background: `linear-gradient(140deg, ${DE_BLUE} 0%, #0747A6 60%, ${DE_AMBER} 100%)`,
        color: '#fff',
        boxShadow: `0 14px 30px ${alpha(DE_BLUE, 0.2)}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={1.4}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: '1.3rem', md: '1.65rem' },
              fontWeight: 900,
              mb: 0.5,
              letterSpacing: -0.5,
            }}
          >
            Logistics Command Center
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: alpha('#fff', 0.86), fontWeight: 500 }}>
            Real-time fulfillment metrics and operational insights.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          {onCustomize && (
            <Button
              onClick={onCustomize}
              variant="outlined"
              startIcon={<MdDashboardCustomize size={18} />}
              sx={{
                borderColor: alpha('#fff', 0.42),
                color: '#fff',
                textTransform: 'none',
                fontWeight: 800,
                borderRadius: 1,
                px: 2,
                '&:hover': { borderColor: '#fff', bgcolor: alpha('#fff', 0.12) },
              }}
            >
              Customize
            </Button>
          )}

          <Button
            onClick={onRefresh}
            disabled={isRefetching}
            variant="contained"
            startIcon={
              isRefetching ? (
                <CircularProgress size={14} thickness={4} sx={{ color: DE_BLUE }} />
              ) : (
                <MdRefresh size={18} />
              )
            }
            sx={{
              bgcolor: '#fff',
              color: DE_BLUE,
              textTransform: 'none',
              fontWeight: 900,
              borderRadius: 1,
              px: 2.5,
              '&:hover': { bgcolor: alpha('#fff', 0.95), transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
            }}
          >
            {isRefetching ? 'Updating...' : 'Refresh Feed'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
