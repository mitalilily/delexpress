import { alpha, Box, Button, Skeleton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { FaWallet } from 'react-icons/fa'
import { useAuth } from '../../context/auth/AuthContext'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import AddMoneyDialog from '../AddMoneyDialog'

const PLUM = '#8A1F43'
const TEXT_PRIMARY = '#161219'

const WalletMenu = () => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { walletBalance, setWalletBalance } = useAuth()

  const { data, isLoading } = useWalletBalance(true)

  // ✅ Only set balance in context after render
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const balance = Number((data as any)?.data?.balance ?? data) // handle both shapes
    if (!isNaN(balance)) {
      setWalletBalance(balance)
    } else {
      setWalletBalance(0)
    }
  }, [data, setWalletBalance])

  return (
    <>
      <Box
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 0.8, sm: 1 },
          borderRadius: 1,
          bgcolor: alpha(PLUM, 0.05),
          border: `1px solid ${alpha(PLUM, 0.12)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: alpha(PLUM, 0.08),
            borderColor: alpha(PLUM, 0.3),
            transform: 'translateY(-1px)',
            boxShadow: `0 8px 24px ${alpha(PLUM, 0.1)}`,
          },
        }}
        onClick={() => setDialogOpen(true)}
      >
        <FaWallet size={18} style={{ color: PLUM }} />

        <Typography
          variant="body2"
          fontWeight={800}
          sx={{
            minWidth: 50,
            color: TEXT_PRIMARY,
            fontSize: { xs: '13px', sm: '14px' },
            letterSpacing: -0.2,
          }}
        >
          {isLoading || walletBalance === null ? (
            <Skeleton
              variant="text"
              width={40}
              height={20}
              sx={{ bgcolor: alpha(PLUM, 0.1) }}
            />
          ) : (
            `₹${walletBalance?.toLocaleString('en-IN')}`
          )}
        </Typography>

        <Button
          variant="contained"
          size="small"
          sx={{
            ml: { xs: 0.5, sm: 1 },
            fontSize: '11px',
            bgcolor: PLUM,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            borderRadius: 0.5,
            px: { xs: 1, sm: 1.5 },
            py: 0.5,
            fontWeight: 800,
            boxShadow: `0 4px 12px ${alpha(PLUM, 0.2)}`,
            '&:hover': {
              bgcolor: '#5E1630',
              boxShadow: `0 6px 16px ${alpha(PLUM, 0.3)}`,
            },
          }}
          onClick={(e) => {
            e.stopPropagation()
            setDialogOpen(true)
          }}
        >
          Recharge
        </Button>
      </Box>

      <AddMoneyDialog
        currentBalance={walletBalance ?? 0}
        open={dialogOpen}
        setOpen={setDialogOpen}
      />
    </>
  )
}

export default WalletMenu
