import {
  alpha,
  Box,
  Container,
  Grid,
  Paper,
  Stack,
  styled,
  Typography,
} from '@mui/material'
import React from 'react'
import {
  FiDollarSign,
  FiGrid,
  FiPackage,
  FiSearch,
  FiSettings,
  FiTool,
} from 'react-icons/fi'
import PageHeading from '../components/UI/heading/PageHeading'

/**
 * ──────────────────────────────────────────────────────────────────────────────
 *  KeyboardShortcutsPage
 *  A polished, professional keyboard shortcuts reference page for DelExpress.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const DE_BLUE = '#0052CC'

const Kbd = styled(Box)(({ theme }) => ({
  fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
  padding: '6px 12px',
  borderRadius: '4px',
  border: '1px solid #DFE1E6',
  borderBottom: '3px solid #C1C7D0',
  background: '#FFFFFF',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  fontSize: '0.85rem',
  fontWeight: 800,
  color: '#172B4D',
  boxShadow: '0 2px 4px rgba(9, 30, 66, 0.08)',
  transition: 'all 0.1s ease',
  cursor: 'default',
  userSelect: 'none',
  minWidth: '32px',
  textAlign: 'center',
  '&:hover': {
    transform: 'translateY(1px)',
    borderBottomWidth: '2px',
  },
}))

interface Shortcut {
  keys: string[]
  label: string
}

interface Category {
  title: string
  icon: React.ReactNode
  shortcuts: Shortcut[]
}

const categories: Category[] = [
  {
    title: 'Navigation',
    icon: <FiGrid size={24} color={DE_BLUE} />,
    shortcuts: [
      { label: 'Dashboard', keys: ['Ctrl/⌘', 'Shift', 'D'] },
      { label: 'Home', keys: ['Ctrl/⌘', 'Shift', 'H'] },
    ],
  },
  {
    title: 'Shipments',
    icon: <FiPackage size={24} color={DE_BLUE} />,
    shortcuts: [
      { label: 'New Order', keys: ['Ctrl/⌘', 'Shift', 'N'] },
      { label: 'All Orders', keys: ['Ctrl/⌘', 'Shift', 'O'] },
    ],
  },
  {
    title: 'Search',
    icon: <FiSearch size={24} color={DE_BLUE} />,
    shortcuts: [{ label: 'Global Search', keys: ['/'] }],
  },
  {
    title: 'Finance',
    icon: <FiDollarSign size={24} color={DE_BLUE} />,
    shortcuts: [{ label: 'Wallet', keys: ['Ctrl/⌘', 'Shift', 'W'] }],
  },
  {
    title: 'Settings',
    icon: <FiSettings size={24} color={DE_BLUE} />,
    shortcuts: [{ label: 'Account Settings', keys: ['Ctrl/⌘', 'Shift', 'S'] }],
  },
  {
    title: 'Tools',
    icon: <FiTool size={24} color={DE_BLUE} />,
    shortcuts: [{ label: 'Rate Calculator', keys: ['Ctrl/⌘', 'Shift', 'R'] }],
  },
]

export default function KeyboardShortcutsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <PageHeading
        title="Keyboard Shortcuts"
        description="Speed up your workflow with these handy keyboard combinations."
      />

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {categories.map((category) => (
          <Grid item xs={12} md={6} key={category.title}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 1,
                border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
                background: `linear-gradient(135deg, #FFFFFF 0%, ${alpha(DE_BLUE, 0.02)} 100%)`,
                boxShadow: '0 4px 12px rgba(9, 30, 66, 0.04)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(9, 30, 66, 0.08)',
                  borderColor: alpha(DE_BLUE, 0.2),
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: alpha(DE_BLUE, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {category.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#172B4D' }}>
                  {category.title}
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {category.shortcuts.map((shortcut) => (
                  <Stack
                    key={shortcut.label}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      py: 1.2,
                      px: 2,
                      borderRadius: 1,
                      bgcolor: '#FFFFFF',
                      border: '1px solid #DFE1E6',
                      transition: 'all 0.1s ease',
                      '&:hover': {
                        borderColor: DE_BLUE,
                        bgcolor: alpha(DE_BLUE, 0.02),
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: '#42526E' }}
                    >
                      {shortcut.label}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {shortcut.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
