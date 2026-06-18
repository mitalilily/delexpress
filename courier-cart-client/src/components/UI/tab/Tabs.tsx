import {
  alpha,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  styled,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  type TabsProps,
} from '@mui/material'
import * as React from 'react'
import { FiMoreHorizontal } from 'react-icons/fi'

const PLUM = '#7696AC'
const TEXT_PRIMARY = '#161219'
const TEXT_SECONDARY = '#6A616A'

/* Types */
type StatusColor = 'primary' | 'success' | 'warning' | 'error' | undefined

export interface TabItem<T extends string = string> {
  label: string
  value: T
  icon?: React.ReactElement
  badgeCount?: number
  statusColor?: StatusColor
  to?: string
}

interface SmartTabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  muiTabsProps?: Omit<TabsProps, 'value' | 'onChange'>
}

/* ───────────── Styled Components ───────────── */
const StyledTabs = styled(Tabs)(() => ({
  '& .MuiTabs-indicator': { display: 'none' },
  minHeight: 0,
}))

const StyledTab = styled(Tab)(() => ({
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '0.95rem',
  color: TEXT_SECONDARY,
  minHeight: 'unset',
  padding: '8px 16px',
  borderRadius: 14,
  transition: 'all 0.2s ease',

  '&.Mui-selected': {
    color: PLUM,
    background: `linear-gradient(180deg, ${alpha('#FFF4F1', 0.98)} 0%, ${alpha('#FCEBE3', 0.92)} 100%)`,
    boxShadow: `0 10px 22px ${alpha(PLUM, 0.08)}`,
  },
}))

const CounterChip = styled('span')(() => ({
  fontSize: '0.75rem',
  padding: '2px 6px',
  borderRadius: 999,
  background: alpha(PLUM, 0.08),
  color: PLUM,
  marginLeft: 6,
  fontWeight: 700,
}))

/* ───────────── Main Component ───────────── */
export function SmartTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  muiTabsProps,
}: SmartTabsProps<T>) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  // Show first N tabs, rest go into "More"
  const visibleCount = isMobile ? 3 : 6
  const visibleTabs = tabs.slice(0, visibleCount)
  const overflowTabs = tabs.slice(visibleCount)
  const isOverflowSelected = overflowTabs.some((t) => t.value === value)
  const controlledValue = isOverflowSelected ? '__more__' : value

  const handleChange = (_: React.SyntheticEvent, val: unknown) => {
    if (val === '__more__') return
    onChange(val as T)
  }

  return isMobile ? (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: '20px 20px 0 0',
        zIndex: 999,
        borderTop: `1px solid ${alpha(PLUM, 0.12)}`,
        background: 'rgba(255, 250, 244, 0.94)',
        backdropFilter: 'blur(18px)',
      }}
      elevation={4}
    >
      <BottomNavigation showLabels value={controlledValue} onChange={handleChange}>
        {visibleTabs?.map((t, index) => (
          <BottomNavigationAction
            key={`${t.label} ${index}`}
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                {t.label}
                {typeof t.badgeCount === 'number' && <CounterChip>{t.badgeCount}</CounterChip>}
              </Box>
            }
            value={t.value}
            icon={t.icon}
          />
        ))}

        {/* "More…" */}
        {overflowTabs.length > 0 && (
          <>
            <IconButton
              onClick={handleOpen}
              sx={{
                flex: 1,
                ...(isOverflowSelected && {
                  color: PLUM,
                  backgroundColor: alpha(PLUM, 0.1),
                  borderRadius: 2,
                }),
              }}
            >
              <FiMoreHorizontal />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              // slotProps={{ paper: { sx: glass } }}
            >
              {overflowTabs.map((t) => (
                <MenuItem
                  key={t.value}
                  selected={isOverflowSelected && value === t.value}
                  onClick={() => {
                    onChange(t.value)
                    handleClose()
                  }}
                >
                  {t.label}
                  {typeof t.badgeCount === 'number' && (
                    <CounterChip style={{ marginLeft: 8 }}>{t.badgeCount}</CounterChip>
                  )}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </BottomNavigation>
    </Paper>
  ) : (
    <Box>
      <Box
        sx={{
          display: 'inline-flex',
          p: 0.6,
          borderRadius: 3,
          border: `1px solid ${alpha(PLUM, 0.1)}`,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,248,243,0.88))',
          boxShadow: `0 10px 28px ${alpha(TEXT_PRIMARY, 0.05)}`,
        }}
      >
        <StyledTabs value={controlledValue} onChange={handleChange} {...muiTabsProps}>
          {visibleTabs.map((tab) => {
            const labelContent = (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tab.label}
                {typeof tab.badgeCount === 'number' && <CounterChip>{tab.badgeCount}</CounterChip>}
              </Box>
            )
            return <StyledTab key={tab.value} value={tab.value} label={labelContent} disableRipple />
          })}

        {/* "More…" trigger */}
          {overflowTabs.length > 0 && (
            <>
              <StyledTab
                label={<FiMoreHorizontal />}
                value="__more__"
                onClick={handleOpen}
                disableRipple
                sx={{
                  ...(isOverflowSelected && {
                    color: PLUM,
                    backgroundColor: alpha(PLUM, 0.1),
                  }),
                }}
              />
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                // slotProps={{ paper: { sx: glass } }}
              >
                {overflowTabs.map((t) => (
                  <MenuItem
                    key={t.value}
                    selected={isOverflowSelected && value === t.value}
                    onClick={() => {
                      onChange(t.value)
                      handleClose()
                    }}
                  >
                    {t.label}
                    {typeof t.badgeCount === 'number' && (
                      <CounterChip style={{ marginLeft: 8 }}>{t.badgeCount}</CounterChip>
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </StyledTabs>
      </Box>
      <Divider sx={{ mt: 1.5, borderColor: alpha(PLUM, 0.08) }} />
    </Box>
  )
}
