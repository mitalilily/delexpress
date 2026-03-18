import {
  alpha,
  Box,
  Button,
  Card,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React from 'react'
import StatusChip from '../chip/StatusChip'

const DE_BLUE = '#0052CC'

interface CTACardProps {
  icon: React.ReactNode
  title: string
  isDone?: boolean
  description: string
  buttonText: string
  onClick: () => void
  backgroundColor?: string
  glassColor?: string
  height?: string
  showButton?: boolean
  showBadge?: boolean
  loading?: boolean
}

const CTACard: React.FC<CTACardProps> = ({
  icon,
  title,
  description,
  buttonText,
  isDone,
  onClick,
  showButton = true,
  showBadge = true,
  loading = false,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 1,
        background: '#FFFFFF',
        border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        boxShadow: `0 4px 12px ${alpha(DE_BLUE, 0.06)}`,
        width: '100%',
        minHeight: isMobile ? 180 : 200,
        position: 'relative',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(DE_BLUE, 0.12)}`,
          border: `1px solid ${alpha(DE_BLUE, 0.2)}`,
        },
      }}
    >
      <Stack direction={'column'} width="100%" height="100%" justifyContent="space-between">
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Box
            sx={{
              bgcolor: alpha(DE_BLUE, 0.08),
              borderRadius: 1,
              p: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 44, sm: 48 },
              height: { xs: 44, sm: 48 },
              color: DE_BLUE,
            }}
          >
            {loading ? <Skeleton variant="circular" width={24} height={24} /> : icon}
          </Box>

          <Stack flex={1} spacing={0.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              {loading ? (
                <Skeleton width={isMobile ? 120 : 140} height={20} />
              ) : (
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: DE_BLUE,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  }}
                >
                  {title}
                </Typography>
              )}
              {showBadge && (
                <StatusChip status={isDone ? 'success' : 'pending'} label={isDone ? 'Done' : 'Pending'} />
              )}
            </Stack>
            {loading ? (
              <Skeleton width="100%" height={16} />
            ) : (
              <Typography variant="body2" sx={{ color: '#42526E', lineHeight: 1.4, fontWeight: 500 }}>
                {description}
              </Typography>
            )}
          </Stack>
        </Stack>

        {/* Footer */}
        {showButton && (
          <Button
            variant="contained"
            fullWidth
            onClick={onClick}
            sx={{
              bgcolor: DE_BLUE,
              color: '#ffffff',
              borderRadius: 1,
              py: 1.1,
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.875rem',
              boxShadow: `0 6px 16px ${alpha(DE_BLUE, 0.2)}`,
              '&:hover': {
                bgcolor: '#0043A4',
                transform: 'translateY(-1px)',
              },
            }}
          >
            {buttonText}
          </Button>
        )}
      </Stack>
    </Card>
  )
}

export default CTACard
