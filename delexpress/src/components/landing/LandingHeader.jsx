import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { Box, Button, Container, IconButton, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { clientAppUrl, siteRoutes } from '../../utils/landingContent'

function NavLink({ item, isOpen = false, onClick, onToggle, mobile = false }) {
  const baseClass = mobile
    ? 'header-mobile-link'
    : `header-nav-chip ${isOpen ? 'header-nav-chip-active' : ''}`

  if (item.children?.length) {
    return (
      <div className={mobile ? 'flex flex-col gap-2' : 'relative'}>
        <button
          type="button"
          onClick={onClick}
          className={`${baseClass} inline-flex items-center gap-1.5`}
        >
          {item.label}
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 18,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 180ms ease',
            }}
          />
        </button>

        {isOpen ? (
          <div
            className={
              mobile
                ? 'ml-3 flex flex-col gap-2 border-l border-[#ead8d0] pl-3'
                : 'header-dropdown-panel'
            }
          >
            <div className="grid gap-2">
              {item.children.map((child) => (
                <a
                  key={child.label}
                  href={child.href}
                  onClick={onToggle}
                  className="header-dropdown-link"
                >
                  <span className="block">{child.label}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <a
      href={item.href}
      onClick={onClick}
      target={item.external ? '_self' : undefined}
      rel={item.external ? 'noreferrer' : undefined}
      className={baseClass}
    >
      {item.label}
    </a>
  )
}

export default function LandingHeader({ menuOpen, navigationLinks, onToggleMenu, onCloseMenu }) {
  const [openDropdown, setOpenDropdown] = useState(null)
  const desktopNavRef = useRef(null)

  useEffect(() => {
    function handlePointerDown(event) {
      if (!desktopNavRef.current?.contains(event.target)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      setOpenDropdown(null)
    }
  }, [menuOpen])

  return (
    <Box component="header" className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <Container maxWidth="xl">
        <div className="header-shell px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-3 lg:gap-5">
            <a href={siteRoutes.home} className="header-brand-lockup">
              <div className="header-brand-mark">
                <Box
                  component="img"
                  src="/Expressopro-logo.svg"
                  alt="ExpressoPro"
                  sx={{ width: { xs: 108, sm: 132 }, height: 'auto', display: 'block' }}
                />
              </div>
              <div className="hidden min-w-0 sm:block">
                <Typography variant="h6" className="brand-heading text-xl">
                  ExpressoPro
                </Typography>
                <Typography className="text-sm leading-6" sx={{ color: '#5d6c78' }}>
                  Smart shipping stack for modern ecommerce teams
                </Typography>
              </div>
            </a>

            <div
              ref={desktopNavRef}
              className="header-nav-wrap hidden lg:flex lg:items-center lg:gap-2"
            >
              {navigationLinks.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  isOpen={openDropdown === item.label}
                  onClick={
                    item.children
                      ? () =>
                          setOpenDropdown((current) => (current === item.label ? null : item.label))
                      : undefined
                  }
                  onToggle={() => setOpenDropdown(null)}
                />
              ))}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Button
                component="a"
                href={siteRoutes.tools}
                variant="outlined"
                className="header-secondary-cta"
                sx={{
                  borderRadius: '999px',
                  px: 2.2,
                  py: 1.15,
                  borderColor: 'rgba(118, 150, 172, 0.16)',
                  color: '#20181d',
                }}
              >
                Calculator
              </Button>
              <Button
                component="a"
                href={clientAppUrl}
                variant="contained"
                className="header-primary-cta"
                sx={{
                  borderRadius: '999px',
                  px: 2.5,
                  py: 1.15,
                  backgroundColor: '#132436',
                  '&:hover': { backgroundColor: '#1D3044' },
                }}
              >
                Get Started
              </Button>
            </div>

            <IconButton
              onClick={onToggleMenu}
              className="header-menu-trigger"
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </div>
        </div>

        {menuOpen ? (
          <div className="header-mobile-panel mt-3 lg:hidden">
            <div className="flex flex-col gap-2">
              {navigationLinks.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  mobile
                  isOpen={openDropdown === item.label}
                  onClick={
                    item.children
                      ? () =>
                          setOpenDropdown((current) => (current === item.label ? null : item.label))
                      : onCloseMenu
                  }
                  onToggle={onCloseMenu}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                component="a"
                href={siteRoutes.tools}
                onClick={onCloseMenu}
                variant="outlined"
                sx={{
                  borderRadius: '999px',
                  py: 1.15,
                  borderColor: 'rgba(118, 150, 172, 0.18)',
                  color: '#20181d',
                }}
              >
                Open Calculator
              </Button>
              <Button
                component="a"
                href={clientAppUrl}
                onClick={onCloseMenu}
                variant="contained"
                sx={{
                  borderRadius: '999px',
                  py: 1.15,
                  backgroundColor: '#132436',
                  '&:hover': { backgroundColor: '#1D3044' },
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        ) : null}
      </Container>
    </Box>
  )
}
