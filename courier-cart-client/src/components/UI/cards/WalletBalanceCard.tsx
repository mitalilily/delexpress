import { alpha, Box, Button, Chip, Stack, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import React, { useState } from 'react'
import { BsWallet2 } from 'react-icons/bs'
import AddMoneyDialog from '../../AddMoneyDialog'
import StatusChip from '../chip/StatusChip'

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

interface WalletBalanceCardProps {
  balance: number
  buttonText?: string
  description?: string
  additionalOffers?: number
  showCashback?: boolean
  cashbackText?: string
}

const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  balance,
  buttonText = 'Recharge',
  description = '',
  additionalOffers = 0,
  showCashback = false,
  cashbackText = '25% Cashback on min recharge of ₹200',
}) => {
  const isRecharged = balance > 0
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // e.g., <600px

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Box
        sx={{
          bgcolor: '#ffffff',
          borderRadius: 1,
          p: { xs: 2.5, md: 3 },
          border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
          boxShadow: `0 4px 16px ${alpha(DE_BLUE, 0.08)}`,
          position: 'relative',
          overflow: 'visible',
          background: `linear-gradient(135deg, #FFFFFF 0%, ${alpha(DE_BLUE, 0.02)} 100%)`,
        }}
      >
        {/* Status Badge */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="flex-start"
          justifyContent="space-between"
          mb={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
            <Box
              sx={{
                bgcolor: alpha(DE_BLUE, 0.08),
                borderRadius: 1,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BsWallet2 size={24} color={DE_BLUE} />
            </Box>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: DE_BLUE,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                  }}
                >
                  Wallet Balance
                </Typography>
                {isRecharged ? (
                  <StatusChip status="success" label="Active" />
                ) : (
                  <StatusChip status="pending" label="Empty" />
                )}
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: '#42526E',
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                  fontWeight: 500,
                }}
              >
                Available funds for shipping
              </Typography>
            </Stack>
          </Stack>

          {/* Floating Offers Chip */}
          {additionalOffers > 0 && (
            <Chip
              label={`${additionalOffers} Offers`}
              size="small"
              sx={{
                bgcolor: alpha(DE_AMBER, 0.1),
                color: DE_AMBER,
                fontWeight: 800,
                borderRadius: 1,
                fontSize: '0.7rem',
                border: `1px solid ${alpha(DE_AMBER, 0.2)}`,
              }}
            />
          )}
        </Stack>

        <Stack spacing={2.5}>
          <Box>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              sx={{
                fontWeight: 900,
                color: '#172B4D',
                letterSpacing: -1,
              }}
            >
              ₹{balance.toLocaleString('en-IN')}
            </Typography>
            {description && (
              <Typography variant="body2" sx={{ color: '#6B778C', mt: 0.5 }}>
                {description}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={() => setDialogOpen(true)}
            sx={{
              bgcolor: DE_BLUE,
              color: '#ffffff',
              borderRadius: 1,
              py: 1.2,
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: `0 8px 20px ${alpha(DE_BLUE, 0.3)}`,
              '&:hover': {
                bgcolor: '#0043A4',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s',
            }}
          >
            {buttonText}
          </Button>

          {showCashback && (
            <Box
              sx={{
                bgcolor: alpha(DE_AMBER, 0.06),
                p: 1.2,
                borderRadius: 1,
                border: `1px dashed ${alpha(DE_AMBER, 0.3)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: DE_AMBER,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                ✨ {cashbackText}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <AddMoneyDialog open={dialogOpen} setOpen={setDialogOpen} currentBalance={balance} />
    </>
  )
}

export default WalletBalanceCard
