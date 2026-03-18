import { alpha, Box, IconButton, Stack, useMediaQuery, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarRightCollapseFilled,
} from 'react-icons/tb'
import GlobalSearch from './GlobalSearch'
import QuickActions from './QuickActions'
import UserMenu from './UserMenu'
import WalletMenu from './WalletMenu'

interface NavbarProps {
  handleDrawerToggle: () => void
  pinned: boolean
  name?: string
}

const TEXT_PRIMARY = '#161219'
const PLUM = '#8A1F43'

export default function Navbar({ handleDrawerToggle, pinned }: NavbarProps) {
  const theme = useTheme()
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 2.5 },
        py: { xs: 1.25, md: 1.5 },
        bgcolor: 'transparent',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: (theme) => theme.zIndex.appBar,
        position: 'sticky',
        top: 0,
      }}
    >
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ width: '100%' }}
      >
        <Stack
          direction={isTablet ? 'column' : 'row'}
          spacing={isTablet ? 1.1 : 1.4}
          alignItems={isTablet ? 'stretch' : 'center'}
          justifyContent="space-between"
          sx={{
            width: '100%',
            borderRadius: 3,
            border: `1px solid ${alpha(PLUM, 0.12)}`,
            bgcolor: alpha('#fffaf4', 0.92),
            backdropFilter: 'blur(20px)',
            boxShadow: `0 12px 28px ${alpha(TEXT_PRIMARY, 0.07)}`,
            px: { xs: 1.2, sm: 1.8, md: 2.2 },
            py: { xs: 1.05, md: 1.15 },
            overflow: 'hidden',
          }}
        >
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            minWidth={0}
            justifyContent="space-between"
            sx={{
              width: isTablet ? '100%' : 'auto',
              flex: isTablet ? '0 0 auto' : '0 1 auto',
            }}
          >
            <IconButton
              size="small"
              onClick={handleDrawerToggle}
              sx={{
                bgcolor: alpha(PLUM, 0.07),
                borderRadius: 2.5,
                border: `1px solid ${alpha(PLUM, 0.18)}`,
                color: PLUM,
                width: { xs: 38, sm: 42 },
                height: { xs: 38, sm: 42 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(PLUM, 0.12),
                  borderColor: alpha(PLUM, 0.32),
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {isTablet ? (
                <TbLayoutSidebarRightCollapseFilled size={18} />
              ) : pinned ? (
                <TbLayoutSidebarLeftCollapseFilled size={18} />
              ) : (
                <TbLayoutSidebarRightCollapseFilled size={18} />
              )}
            </IconButton>

            <Box sx={{ minWidth: 0, flexShrink: 1 }}>
              <Box
                component="img"
                src="/logo/delexpress-logo.svg"
                alt="DelExpress"
                sx={{ width: { xs: 138, sm: 178 }, height: 'auto', display: 'block' }}
              />
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={{ xs: 0.8, sm: 1.1, md: 1.4 }}
            alignItems="center"
            justifyContent={isTablet ? 'space-between' : 'flex-end'}
            useFlexGap
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              flexWrap: 'wrap',
              rowGap: 0.9,
              width: isTablet ? '100%' : 'auto',
              overflow: 'hidden',
            }}
          >
            {!isTablet && <GlobalSearch />}
            <WalletMenu />
            <QuickActions />
            <UserMenu />
          </Stack>
        </Stack>
      </motion.div>
    </Box>
  )
}
