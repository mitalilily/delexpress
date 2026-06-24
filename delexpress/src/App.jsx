import { useEffect, useMemo, useState } from 'react'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import LandingFooter from './components/landing/LandingFooter'
import LandingHeader from './components/landing/LandingHeader'
import { MotionProvider } from './components/landing/LandingPrimitives'
import ScrollProgress from './components/landing/ScrollProgress'
import FeaturesPage from './pages/FeaturesPage'
import FaqPage from './pages/FaqPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import TrackingPage from './pages/TrackingPage'
import ToolsPage from './pages/ToolsPage'
import {
  footerGroups,
  footerMeta,
  navigationLinks,
  siteRoutes,
} from './utils/landingContent'
import theme from './utils/muiTheme'

function normalizePath(pathname) {
  if (!pathname || pathname === '') return siteRoutes.home
  const normalized = pathname.replace(/\/+$/, '')
  return normalized === '' ? siteRoutes.home : normalized
}

function resolvePage(pathname) {
  switch (normalizePath(pathname)) {
    case siteRoutes.features:
      return <FeaturesPage />
    case siteRoutes.tools:
      return <ToolsPage />
    case siteRoutes.tracking:
    case siteRoutes.toolsTracking:
      return <TrackingPage />
    case siteRoutes.faq:
      return <FaqPage />
    case siteRoutes.legal:
      return <LegalPage />
    case siteRoutes.home:
    default:
      return <HomePage />
  }
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = useMemo(() => normalizePath(window.location.pathname), [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MotionProvider>
        <div className="page-shell min-h-screen">
          <ScrollProgress />
          <LandingHeader
            menuOpen={menuOpen}
            navigationLinks={navigationLinks}
            onToggleMenu={() => setMenuOpen((open) => !open)}
            onCloseMenu={() => setMenuOpen(false)}
          />

          <main>{resolvePage(pathname)}</main>

          <LandingFooter footerGroups={footerGroups} footerMeta={footerMeta} />
        </div>
      </MotionProvider>
    </ThemeProvider>
  )
}
