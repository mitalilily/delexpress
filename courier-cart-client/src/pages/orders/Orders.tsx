import { Alert, Box, Button, Container, Fade, Popover, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { MdAdd } from 'react-icons/md'
import AllOrders from '../../components/orders/AllOrders'
import B2COrderFormSteps from '../../components/orders/b2c/B2COrderForm'
import CustomDrawer from '../../components/UI/drawer/CustomDrawer'
import { useNavigate } from 'react-router-dom'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'

export default function Orders() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [orderType, setOrderType] = useState<'b2c' | 'b2b' | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const { isReady, progress, firstIncompleteStep } = useMerchantReadiness()

  const openPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const closePopover = () => {
    setAnchorEl(null)
  }

  const handleSelectOrderType = (type: 'b2c' | 'b2b') => {
    if (!isReady) {
      navigate(firstIncompleteStep?.path || '/home')
      closePopover()
      return
    }

    setOrderType(type)
    setDrawerOpen(true)
    closePopover()
  }

  const glass = {
    backdropFilter: 'blur(16px)',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #333369',
    boxShadow: '0 8px 24px rgba(59, 74, 116, 0.15)',
    borderRadius: '12px',
    p: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {!isReady && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => navigate(firstIncompleteStep?.path || '/home')}>
              Continue Setup
            </Button>
          }
          sx={{ mb: 3 }}
        >
          <Typography sx={{ fontWeight: 700 }}>Order creation is locked</Typography>
          <Typography variant="body2">
            Complete merchant readiness first. Current progress: {progress}%.
          </Typography>
        </Alert>
      )}
      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 4 }}>
        <Button
          startIcon={<MdAdd />}
          onClick={openPopover}
          variant="contained"
          size="medium"
          disabled={!isReady}
          sx={{
            bgcolor: '#333369',
            color: '#FFFFFF',
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            py: 1.2,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(59, 74, 116, 0.3)',
            '&:hover': {
              bgcolor: '#2F3B5F',
              boxShadow: '0 4px 12px rgba(59, 74, 116, 0.4)',
            },
          }}
        >
          Create Order
        </Button>
      </Stack>
      {/* 🔹 Content / List Placeholder */}
      <Box sx={{ mt: 2 }}>
        <AllOrders />
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        sx={{ mt: 1 }}
        onClose={closePopover}
        slots={{ transition: Fade }}
        transitionDuration={200}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: glass } }}
      >
        <Button
          variant="outlined"
          onClick={() => handleSelectOrderType('b2c')}
          sx={{
            borderColor: '#333369',
            color: '#333369',
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            py: 1,
            borderRadius: '8px',
            '&:hover': {
              borderColor: '#2F3B5F',
              backgroundColor: 'rgba(59, 74, 116, 0.08)',
              color: '#2F3B5F',
            },
          }}
        >
          Create B2C Order
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleSelectOrderType('b2b')}
          sx={{
            borderColor: '#333369',
            color: '#333369',
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            py: 1,
            borderRadius: '8px',
            '&:hover': {
              borderColor: '#2F3B5F',
              backgroundColor: 'rgba(59, 74, 116, 0.08)',
              color: '#2F3B5F',
            },
          }}
        >
          Create B2B Order
        </Button>
      </Popover>
      <CustomDrawer
        width={1400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={orderType === 'b2c' ? 'Create New B2C Order' : 'Create New B2B Order'}
      >
        {orderType === 'b2c' ? <B2COrderFormSteps onClose={() => setDrawerOpen(false)} /> : null}
      </CustomDrawer>
    </Container>
  )
}
