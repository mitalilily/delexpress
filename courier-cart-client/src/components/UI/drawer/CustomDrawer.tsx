import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React from 'react'
import { IoCloseCircleOutline } from 'react-icons/io5'

const PLUM = '#7696AC'
const MINT = '#56C0A5'
const TEXT_PRIMARY = '#161219'
const BRAND_GRADIENT = `linear-gradient(135deg, ${PLUM} 0%, #A7C8D2 58%, ${MINT} 100%)`

interface GlassDrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  width?: number | string
  anchor?: 'left' | 'right'
  children: React.ReactNode
}

const CustomDrawer: React.FC<GlassDrawerProps> = ({
  open,
  onClose,
  title,
  width = 400,
  anchor = 'right',
  children,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : width,
            background: `
              radial-gradient(340px 140px at 0% 0%, rgba(118, 150, 172, 0.08) 0%, transparent 68%),
              radial-gradient(320px 160px at 100% 0%, rgba(86, 192, 165, 0.08) 0%, transparent 65%),
              linear-gradient(180deg, #FFFDF9 0%, #FFF6EF 100%)
            `,
            borderLeft: anchor === 'right' ? '1px solid rgba(118, 150, 172, 0.12)' : 'none',
            borderRight: anchor === 'left' ? '1px solid rgba(118, 150, 172, 0.12)' : 'none',
            boxShadow: '0 18px 48px rgba(22, 18, 25, 0.16)',
            color: TEXT_PRIMARY,
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Header with gradient accent */}
      <Box
        sx={{
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: BRAND_GRADIENT,
          },
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={3}
          py={2.5}
          mt={0.5}
          sx={{
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="h6" fontWeight={800} color={PLUM}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: PLUM,
              bgcolor: 'rgba(118, 150, 172, 0.06)',
              border: '1px solid rgba(118, 150, 172, 0.08)',
              '&:hover': {
                bgcolor: 'rgba(118, 150, 172, 0.12)',
                transform: 'rotate(90deg)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <IoCloseCircleOutline size={24} />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(118, 150, 172, 0.08)' }} />

      <Box
        p={3}
        sx={{
          overflowY: 'auto',
          height: '100%',
          bgcolor: 'rgba(255,255,255,0.35)',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#EFE4DD',
          },
          '&::-webkit-scrollbar-thumb': {
            background: PLUM,
            borderRadius: '4px',
            '&:hover': {
              background: '#6A1737',
            },
          },
        }}
      >
        {children}
      </Box>
    </Drawer>
  )
}

export default CustomDrawer
