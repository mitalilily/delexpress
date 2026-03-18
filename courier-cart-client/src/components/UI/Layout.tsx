// components/layout/Layout.tsx
import { Box, Container, Drawer, Stack, useMediaQuery, useTheme } from '@mui/material'
import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { DRAWER_WIDTH } from '../../utils/constants'
import Navbar from '../Navbar/Navbar'
import KeyboardShortcuts from './keyboard/KeyboardShortcuts'
import FullScreenLoader from './loader/FullScreenLoader'
import Sidebar, { COLLAPSED_WIDTH } from './Sidebar'

export default function Layout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [pinned, setPinned] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleDrawerToggle = () => {
    if (isMobile) setMobileOpen(!mobileOpen)
    else setPinned((prev) => !prev)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: '#f7efe6',
        backgroundImage:
          'radial-gradient(circle at 12% 6%, rgba(155, 49, 80, 0.14) 0%, transparent 30%), radial-gradient(circle at 88% 8%, rgba(86, 192, 165, 0.12) 0%, transparent 26%)',
      }}
    >
      <KeyboardShortcuts />

      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              bgcolor: '#fff7f0',
              color: '#181318',
              borderRight: '1px solid rgba(155, 49, 80, 0.14)',
            },
          }}
        >
          <Sidebar
            hovered={hovered}
            setHovered={setHovered}
            pinned
            handleDrawerToggle={handleDrawerToggle}
          />
        </Drawer>
      ) : (
        <Box
          sx={{
            width: pinned ? DRAWER_WIDTH : COLLAPSED_WIDTH,
            minWidth: pinned ? DRAWER_WIDTH : COLLAPSED_WIDTH,
            flexShrink: 0,
            transition: 'width 240ms ease',
            position: 'relative',
          }}
        >
          <Sidebar
            hovered={hovered}
            setHovered={setHovered}
            pinned={pinned}
            handleDrawerToggle={handleDrawerToggle}
          />
        </Box>
      )}

      {/* Main Content */}
      <Stack
        sx={{
          flexGrow: 1,
          minWidth: 0,
          transition: 'margin-left 240ms ease',
          position: 'relative',
          height: '100vh',
          overflowX: 'hidden',
          bgcolor: 'transparent',
          px: { xs: 0.75, md: 1.35 },
          py: { xs: 0.75, md: 1.1 },
        }}
      >
        <Stack sx={{ flexGrow: 1, minHeight: 0, bgcolor: 'transparent' }}>
          <Navbar handleDrawerToggle={handleDrawerToggle} pinned={pinned} />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              bgcolor: 'transparent',
              px: { xs: 1.1, md: 2.2 },
              pb: { xs: 1.6, md: 2.4 },
              minHeight: 0,
            }}
          >
            <Container
              maxWidth="xl"
              sx={{
                bgcolor: 'transparent',
                pt: 0.6,
                overflowX: 'hidden',
              }}
            >
              <Suspense fallback={<FullScreenLoader />}>
                <Outlet />
              </Suspense>
            </Container>
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}
