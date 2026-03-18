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
import { BRAND_GRADIENT } from '../../user/profile/UserProfileForm'

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
            background: '#FFFFFF',
            borderLeft: anchor === 'right' ? '1px solid #E0E6ED' : 'none',
            borderRight: anchor === 'left' ? '1px solid #E0E6ED' : 'none',
            boxShadow: '0 8px 32px rgba(51, 51, 105, 0.12)',
            color: '#1A1A1A',
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
        >
          <Typography variant="h6" fontWeight={700} color="#333369">
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#333369',
              '&:hover': {
                bgcolor: 'rgba(51, 51, 105, 0.08)',
                transform: 'rotate(90deg)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <IoCloseCircleOutline size={24} />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#E0E6ED' }} />

      <Box
        p={3}
        sx={{
          overflowY: 'auto',
          height: '100%',
          bgcolor: '#F5F7FA',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#E0E6ED',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#333369',
            borderRadius: '4px',
            '&:hover': {
              background: '#2F3B5F',
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
