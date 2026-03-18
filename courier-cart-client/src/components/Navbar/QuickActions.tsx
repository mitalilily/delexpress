import { alpha, Box, ClickAwayListener, Grow, IconButton, Paper, Popper, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { AiTwotoneThunderbolt } from 'react-icons/ai'
import { CgCalculator, CgTrack } from 'react-icons/cg'
import { FaTicket } from 'react-icons/fa6'
import { MdLockOutline } from 'react-icons/md'
import { TbTruckDelivery } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'

const PLUM = '#8A1F43'
const MINT = '#56C0A5'

const QuickActions = () => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const { isReady, firstIncompleteStep } = useMerchantReadiness()

  const actions = [
    { icon: <TbTruckDelivery size={18} />, name: 'New Order', path: '/orders/create' },
    { icon: <CgCalculator size={18} />, name: 'Rate Calculator', path: '/tools/rate_calculator' },
    { icon: <CgTrack size={18} />, name: 'Track AWB', path: '/tools/order_tracking' },
    { icon: <FaTicket size={18} />, name: 'Create Ticket', path: '/support/tickets' },
  ]

  return (
    <>
      <Box ref={anchorRef} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <IconButton
          aria-label="Quick actions"
          sx={{
            bgcolor: alpha(MINT, 0.12),
            border: `1px solid ${alpha(MINT, 0.28)}`,
            color: '#2F8E77',
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(MINT, 0.18),
              borderColor: MINT,
              transform: 'translateY(-1px)',
            },
          }}
        >
          <AiTwotoneThunderbolt size={18} />
        </IconButton>
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        sx={{ zIndex: 2200 }}
        modifiers={[
          {
            name: 'offset',
            options: { offset: [0, 10] },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={200}>
            <Box>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <Paper
                  elevation={0}
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    px: 1.2,
                    py: 1.2,
                    borderRadius: 1,
                    background: '#ffffff',
                    border: `1px solid ${alpha(PLUM, 0.1)}`,
                    boxShadow: `0 12px 32px ${alpha('#172B4D', 0.1)}`,
                    minWidth: 220,
                  }}
                >
                  {actions.map((action) => {
                    const locked = action.path === '/orders/create' && !isReady

                    return (
                      <Box
                        key={action.name}
                        onClick={() => {
                          navigate(locked ? firstIncompleteStep?.path || '/home' : action.path)
                          setOpen(false)
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          cursor: 'pointer',
                          color: '#172B4D',
                          fontWeight: 700,
                          px: 1.5,
                          py: 1.2,
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(PLUM, 0.05),
                            color: PLUM,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', color: locked ? alpha('#172B4D', 0.3) : 'inherit' }}>
                          {action.icon}
                        </Box>
                        <Typography sx={{ fontSize: '14px', fontWeight: 'inherit', flex: 1 }}>
                          {action.name}
                        </Typography>
                        {locked && <MdLockOutline size={14} color={alpha('#172B4D', 0.4)} />}
                      </Box>
                    )
                  })}
                </Paper>
              </ClickAwayListener>
            </Box>
          </Grow>
        )}
      </Popper>
    </>
  )
}

export default QuickActions
