// components/layout/Sidebar.tsx
import {
  alpha,
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { BiInfoCircle, BiListPlus } from 'react-icons/bi'
import { FaBalanceScaleLeft } from 'react-icons/fa'
import { FaClipboardList as FaFileAlt, FaMoneyBill, FaToolbox } from 'react-icons/fa6'
import { HiDocumentReport } from 'react-icons/hi'
import {
  MdAccountBalanceWallet,
  MdDashboard,
  MdExpandMore,
  MdHelp,
  MdHome,
  MdKeyboardReturn,
  MdOutlineAddBusiness,
  MdOutlineRateReview,
  MdShoppingCart,
  MdSyncAlt,
  MdSyncProblem,
} from 'react-icons/md'
import { RiSettings2Fill } from 'react-icons/ri'
import { TbInvoice, TbReportAnalytics, TbTransactionRupee } from 'react-icons/tb'
import { NavLink, useLocation } from 'react-router-dom'

import type { JSX } from '@emotion/react/jsx-runtime'
import { CgTrack } from 'react-icons/cg'
import { DRAWER_WIDTH } from '../../utils/constants'
import { isActive } from '../../utils/functions'

const TEXT_PRIMARY = '#161219'
const TEXT_SECONDARY = '#6A616A'
const DE_BLUE = '#8A1F43'
const SURFACE = '#FFFDF9'
const MINT = '#56C0A5'

export type Role = 'customer' | 'admin'

export interface SubItem {
  text: string
  path: string
  icon?: JSX.Element
}

export interface NavItem {
  text: string
  icon: JSX.Element
  path: string
  roles: Role[]
  children?: SubItem[]
}

interface SidebarProps {
  role?: Role
  pinned: boolean
  handleDrawerToggle: () => void
  setHovered: Dispatch<SetStateAction<boolean>>
  hovered: boolean
  // onPinnedChange: Dispatch<SetStateAction<boolean>>;
}

// ------------------------------------------------------
//  MINI‑VARIANT CONFIG
// ------------------------------------------------------
export const COLLAPSED_WIDTH = 80 // px

// ------------------------------------------------------
//  SIDEBAR COMPONENT
// ------------------------------------------------------
const STANDARD_ICON_SIZE = 19
const navItems: NavItem[] = [
  // ========== OVERVIEW & DASHBOARD ==========
  {
    text: 'Home',
    icon: <MdHome size={STANDARD_ICON_SIZE} />,
    path: '/home',
    roles: ['customer', 'admin'],
  },
  {
    text: 'Dashboard',
    icon: <MdDashboard size={STANDARD_ICON_SIZE} />,
    path: '/dashboard',
    roles: ['customer', 'admin'],
  },

  // ========== CORE OPERATIONS ==========
  {
    text: 'Shipment Control',
    icon: <MdShoppingCart size={STANDARD_ICON_SIZE} />,
    path: '/orders',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'All Shipments',
        path: '/orders/list',
        icon: <FaFileAlt size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'B2C Shipments',
        path: '/orders/b2c/list',
        icon: <MdOutlineAddBusiness size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'B2B Shipments',
        path: '/orders/b2b/list',
        icon: <MdOutlineAddBusiness size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Create Shipment',
        path: '/orders/create',
        icon: <BiListPlus size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
  {
    text: 'Operations',
    icon: <MdSyncAlt size={STANDARD_ICON_SIZE} />,
    path: '/ops',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'NDR',
        path: '/ops/ndr',
        icon: <MdSyncProblem size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'RTO',
        path: '/ops/rto',
        icon: <MdKeyboardReturn size={STANDARD_ICON_SIZE} />,
      },
    ],
  },

  // ========== FINANCIAL ==========
  {
    text: 'Finance Desk',
    icon: <FaMoneyBill size={STANDARD_ICON_SIZE} />,
    path: '/billing',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'Wallet Transactions',
        path: '/billing/wallet_transactions',
        icon: <TbTransactionRupee size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'COD Remittance',
        path: '/cod-remittance',
        icon: <MdAccountBalanceWallet size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Invoice',
        path: '/billing/invoice_management',
        icon: <TbInvoice size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
  {
    text: 'Reconciliation',
    icon: <FaBalanceScaleLeft size={STANDARD_ICON_SIZE} />,
    path: '/reconciliation',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'Weight',
        path: '/reconciliation/weight',
        icon: <FaBalanceScaleLeft size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Weight Settings',
        path: '/reconciliation/weight/settings',
        icon: <RiSettings2Fill size={STANDARD_ICON_SIZE} />,
      },
    ],
  },

  // ========== TOOLS & UTILITIES ==========
  {
    text: 'Tools',
    icon: <FaToolbox size={STANDARD_ICON_SIZE} />,
    path: '/tools',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'Rate Card',
        path: '/tools/rate_card',
        icon: <MdOutlineRateReview size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Rate Calculator',
        path: '/tools/rate_calculator',
        icon: <TbReportAnalytics size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Order Tracking',
        path: '/tools/order_tracking',
        icon: <CgTrack size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
  {
    text: 'Reports',
    icon: <HiDocumentReport size={STANDARD_ICON_SIZE} />,
    path: '/reports',
    roles: ['customer', 'admin'],
  },

  // ========== CONFIGURATION & SUPPORT ==========
  {
    text: 'Settings',
    icon: <RiSettings2Fill size={STANDARD_ICON_SIZE} />,
    path: '/settings',
    roles: ['customer', 'admin'],
  },
  {
    text: 'Help Center',
    icon: <MdHelp size={STANDARD_ICON_SIZE} />,
    path: '/support',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'Raise Ticket',
        path: '/support/tickets',
        icon: <BiListPlus size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'About Us',
        path: '/support/about_us',
        icon: <BiInfoCircle size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
]

export default function Sidebar({
  role = 'customer',
  pinned,
  hovered,
  setHovered,
}: SidebarProps) {
  const location = useLocation()
  const theme = useTheme()
  const isSidebarExpanded = pinned || hovered

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const toggleExpand = (key: string) =>
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    if (!isSidebarExpanded) {
      setExpandedItems({})
    }
  }, [isSidebarExpanded])

  const activeItemSx = {
    bgcolor: alpha(DE_BLUE, 0.08),
    color: DE_BLUE,
    '& .MuiListItemIcon-root': { color: DE_BLUE },
    '& .MuiListItemText-primary': { fontWeight: 800 },
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '10%',
      height: '80%',
      width: '4px',
      bgcolor: DE_BLUE,
      borderRadius: '0 4px 4px 0',
    },
  }

  const navItemSx = {
    mx: 1,
    my: 0.4,
    borderRadius: 1,
    py: 1,
    px: 1.6,
    color: TEXT_SECONDARY,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      bgcolor: alpha(DE_BLUE, 0.05),
      color: DE_BLUE,
      '& .MuiListItemIcon-root': { color: DE_BLUE },
    },
  }

  const renderNavList = (items: NavItem[]) => (
    <List disablePadding>
      {items.map((item) => {
        const isSelected = isActive(location.pathname, item.path)
        const hasChildren = item.children && item.children.length > 0
        const isExpanded = expandedItems[item.text]
        const childSelected = Boolean(item.children?.some((sub) => isActive(location.pathname, sub.path)))
        const showExpanded = isSidebarExpanded && isExpanded

        return (
          <Box key={item.text}>
            <ListItemButton
              component={hasChildren ? 'div' : NavLink}
              to={hasChildren ? undefined : item.path}
              onClick={hasChildren ? () => toggleExpand(item.text) : undefined}
              sx={{
                ...navItemSx,
                justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
                px: isSidebarExpanded ? 1.6 : 1.1,
                ...(isSelected && !hasChildren ? activeItemSx : {}),
                ...(hasChildren && childSelected
                  ? {
                      bgcolor: alpha(DE_BLUE, 0.06),
                      color: DE_BLUE,
                      '& .MuiListItemIcon-root': { color: DE_BLUE },
                    }
                  : {}),
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isSidebarExpanded ? 40 : 0,
                  mr: isSidebarExpanded ? 0 : 0,
                  justifyContent: 'center',
                  color: isSelected || childSelected ? DE_BLUE : 'inherit',
                  transition: 'color 0.2s',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {isSidebarExpanded ? (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.88rem',
                    fontWeight: isSelected || childSelected ? 800 : 600,
                    letterSpacing: '-0.01em',
                  }}
                />
              ) : null}
              {hasChildren && isSidebarExpanded ? (
                <MdExpandMore
                  style={{
                    transform: showExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s',
                    color: showExpanded ? DE_BLUE : 'inherit',
                  }}
                />
              ) : null}
            </ListItemButton>

            {hasChildren && isSidebarExpanded && (
              <Collapse in={showExpanded} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ ml: 4.5, mt: 0.5, mb: 1 }}>
                  {item.children?.map((sub) => {
                    const subActive = isActive(location.pathname, sub.path)
                    return (
                      <ListItemButton
                        key={sub.text}
                        component={NavLink}
                        to={sub.path}
                        sx={{
                          py: 0.7,
                          px: 1.5,
                          borderRadius: 1,
                          color: subActive ? DE_BLUE : TEXT_SECONDARY,
                          bgcolor: subActive ? alpha(DE_BLUE, 0.07) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(DE_BLUE, 0.04),
                            color: DE_BLUE,
                          },
                          mb: 0.4,
                        }}
                      >
                        <ListItemText
                          primary={sub.text}
                          primaryTypographyProps={{
                            fontSize: '0.82rem',
                            fontWeight: subActive ? 800 : 500,
                          }}
                        />
                      </ListItemButton>
                    )
                  })}
                </List>
              </Collapse>
            )}
          </Box>
        )
      })}
    </List>
  )

  return (
    <Box
      sx={{
        width: isSidebarExpanded ? DRAWER_WIDTH : COLLAPSED_WIDTH,
        height: '100vh',
        bgcolor: SURFACE,
        borderRight: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: theme.zIndex.drawer,
        position: 'fixed',
        left: 0,
        top: 0,
        overflowX: 'hidden',
        boxShadow: '4px 0 24px rgba(22, 18, 25, 0.05)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box sx={{ p: 2.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/logo/delexpress-logo.svg"
          alt="DelExpress"
          sx={{
            width: isSidebarExpanded ? 122 : 32,
            height: isSidebarExpanded ? 30 : 32,
            objectFit: 'contain',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            borderRadius: 2,
          }}
        />
        {isSidebarExpanded && (
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                color: TEXT_PRIMARY,
                fontSize: '1.1rem',
                letterSpacing: -0.5,
              }}
            >
              DelExpress
            </Typography>
            <Typography
              sx={{
                color: alpha(TEXT_SECONDARY, 0.9),
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Operations dashboard
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
        {isSidebarExpanded && (
          <Typography
            variant="caption"
            sx={{
              px: 2.5,
              py: 1,
              display: 'block',
              fontWeight: 800,
              color: alpha(TEXT_SECONDARY, 0.68),
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontSize: '0.65rem',
            }}
          >
            DelExpress navigation
          </Typography>
        )}
        {renderNavList(navItems.filter((i) => i.roles.includes(role || 'customer')))}
      </Box>

      <Box sx={{ p: 1.5, borderTop: `1px solid ${alpha(DE_BLUE, 0.08)}`, bgcolor: alpha(MINT, 0.03) }}>
        <ListItemButton
          component={NavLink}
          to="/settings"
          sx={{
            ...navItemSx,
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            px: isSidebarExpanded ? 1.6 : 1.1,
            ...(isActive(location.pathname, '/settings') ? activeItemSx : {}),
          }}
        >
          <ListItemIcon sx={{ minWidth: isSidebarExpanded ? 40 : 0, justifyContent: 'center' }}>
            <RiSettings2Fill size={STANDARD_ICON_SIZE} />
          </ListItemIcon>
          {isSidebarExpanded ? (
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
            />
          ) : null}
        </ListItemButton>
      </Box>
    </Box>
  )
}
