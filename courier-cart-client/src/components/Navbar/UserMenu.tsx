import {
  alpha,
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { BsKeyboardFill } from 'react-icons/bs'
import { FaGavel } from 'react-icons/fa6'
import { MdAccountCircle, MdLogout, MdSettings } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { usePresignedDownloadUrls } from '../../hooks/Uploads/usePresignedDownloadUrls'

const DE_BLUE = '#8A1F43'
const TEXT_PRIMARY = '#161219'

const getInitials = (fullName?: string) => {
  if (!fullName) return 'U'

  const parts = fullName.trim().split(/\s+/)
  const firstInitial = parts[0]?.[0] ?? ''
  const lastInitial = parts.length > 1 ? parts.at(-1)?.[0] ?? '' : ''

  return `${firstInitial}${lastInitial}`.toUpperCase()
}

const UserMenu = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const { data: avatarUrl } = usePresignedDownloadUrls({
    keys: user?.companyInfo?.profilePicture,
    enabled: !!user?.companyInfo?.profilePicture,
  })

  const handleClose = () => setAnchorEl(null)

  const menuItems: {
    key: string
    label?: string
    icon?: React.ElementType
    onClick?: () => void
  }[] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: MdAccountCircle,
      onClick: () => {
        navigate('/profile/user_profile/settings/user')
        handleClose()
      },
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: MdSettings,
      onClick: () => {
        navigate('/settings')
        handleClose()
      },
    },

    {
      key: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: BsKeyboardFill,
      onClick: () => {
        navigate('/help/shortcuts')
        handleClose()
      },
    },
    {
      key: 'terms-conditions',
      label: 'Legal & Policies',
      icon: FaGavel,
      onClick: () => {
        navigate('/policies/refund_cancellation')
        handleClose()
      },
    },
    { key: 'divider' },
    {
      key: 'logout',
      label: 'Logout',
      icon: MdLogout,
      onClick: () => {
        logout()
        handleClose()
      },
    },
  ]

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{
          p: 0.5,
          border: `1.5px solid ${alpha(DE_BLUE, 0.1)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: alpha(DE_BLUE, 0.05),
            borderColor: alpha(DE_BLUE, 0.3),
          },
        }}
      >
        <Avatar
          src={avatarUrl?.[0] ?? ''}
          sx={{
            width: 32,
            height: 32,
            bgcolor: DE_BLUE,
            fontSize: '14px',
            fontWeight: 800,
            borderRadius: 1,
          }}
        >
          {getInitials(user?.companyInfo?.contactPerson || user?.name)}
        </Avatar>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5,
            width: 280,
            borderRadius: 1,
            border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
            boxShadow: `0 12px 32px ${alpha(TEXT_PRIMARY, 0.1)}`,
            overflow: 'visible',
          },
        }}
      >
        <Box sx={{ p: 2.5, bgcolor: alpha(DE_BLUE, 0.02) }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={avatarUrl?.[0] ?? ''}
              sx={{
                width: 48,
                height: 48,
                bgcolor: DE_BLUE,
                borderRadius: 1,
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              {getInitials(user?.companyInfo?.contactPerson || user?.name)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} noWrap color={TEXT_PRIMARY}>
                {user?.companyInfo?.contactPerson || user?.name || 'DelExpress User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '12px', fontWeight: 500 }}>
                {user?.companyInfo?.contactEmail || user?.email}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ opacity: 0.6 }} />

        <List sx={{ p: 1 }}>
          {menuItems.map((item, index) => {
            if (item.key === 'divider') return <Divider key={index} sx={{ my: 1, opacity: 0.6 }} />
            const Icon = item.icon!
            return (
              <ListItemButton
                key={item.key}
                onClick={item.onClick}
                sx={{
                  borderRadius: 1,
                  py: 1.2,
                  px: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(DE_BLUE, 0.05),
                    color: DE_BLUE,
                    '& .MuiListItemIcon-root': { color: DE_BLUE },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: alpha(TEXT_PRIMARY, 0.6) }}>
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Popover>
    </Box>
  )
}

export default UserMenu
