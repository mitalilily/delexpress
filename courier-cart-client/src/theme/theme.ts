import { alpha, createTheme } from '@mui/material/styles'

const DE_BLUE = '#8A1F43'
const DE_BLUE_LIGHT = '#B65476'
const DE_BLUE_DARK = '#5E1630'
const DE_AMBER = '#56C0A5'
const DE_AMBER_LIGHT = '#82D5C0'
const DE_AMBER_DARK = '#2F8E77'
const BACKGROUND = '#F7F2ED'
const SURFACE = '#FFFDF9'
const TEXT_PRIMARY = '#161219'
const TEXT_SECONDARY = '#6A616A'
const TEXT_MUTED = '#91868D'
const BORDER = '#E8DAD1'
const BODY_FONT = '"Bahnschrift", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
const DISPLAY_FONT = '"Bahnschrift", "Segoe UI", "Helvetica Neue", Arial, sans-serif'

// Rebranding Aliases for backwards compatibility
export const BRAND_NAVY = DE_BLUE
export const BRAND_PLUM = DE_BLUE
export const BRAND_YELLOW = DE_AMBER
export const BRAND_BLUE = DE_BLUE_LIGHT
export const TEXT = TEXT_SECONDARY
export const BRAND_LIGHT_NAVY = DE_BLUE_LIGHT
export const BRAND_PURPLE = BRAND_PLUM

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 300,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    mode: 'light',
    background: {
      default: BACKGROUND,
      paper: SURFACE,
    },
    primary: {
      main: DE_BLUE,
      light: DE_BLUE_LIGHT,
      dark: DE_BLUE_DARK,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: DE_AMBER,
      light: DE_AMBER_LIGHT,
      dark: DE_AMBER_DARK,
      contrastText: TEXT_PRIMARY,
    },
    error: {
      main: '#D84F5F',
      light: '#EA7987',
      dark: '#A73342',
    },
    warning: {
      main: DE_AMBER,
      light: DE_AMBER_LIGHT,
      dark: DE_AMBER_DARK,
    },
    info: {
      main: '#56C0A5',
      light: '#82D5C0',
      dark: '#2F8E77',
    },
    success: {
      main: '#3F8D74',
      light: '#6BB59D',
      dark: '#2B6553',
    },
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_SECONDARY,
      disabled: TEXT_MUTED,
    },
    divider: BORDER,
  },
  shape: {
    borderRadius: 3,
  },
  typography: {
    fontFamily: BODY_FONT,
    h1: {
      fontFamily: DISPLAY_FONT,
      color: TEXT_PRIMARY,
      fontWeight: 700,
      fontSize: '2.7rem',
      lineHeight: 1.06,
      letterSpacing: '-0.015em',
    },
    h2: {
      fontFamily: DISPLAY_FONT,
      color: TEXT_PRIMARY,
      fontWeight: 700,
      fontSize: '2.2rem',
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: DISPLAY_FONT,
      color: TEXT_PRIMARY,
      fontWeight: 700,
      fontSize: '1.9rem',
      lineHeight: 1.1,
    },
    h4: {
      fontFamily: DISPLAY_FONT,
      color: TEXT_PRIMARY,
      fontWeight: 700,
      fontSize: '1.55rem',
      lineHeight: 1.14,
    },
    h5: {
      fontFamily: DISPLAY_FONT,
      color: TEXT_PRIMARY,
      fontWeight: 700,
      fontSize: '1.24rem',
      lineHeight: 1.18,
    },
    h6: {
      fontFamily: DISPLAY_FONT,
      color: TEXT_PRIMARY,
      fontWeight: 700,
      fontSize: '1.05rem',
      lineHeight: 1.2,
    },
    subtitle1: {
      color: TEXT_PRIMARY,
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle2: {
      color: TEXT_SECONDARY,
      fontWeight: 600,
      fontSize: '0.86rem',
      letterSpacing: '0.02em',
    },
    body1: {
      color: TEXT_PRIMARY,
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.62,
    },
    body2: {
      color: TEXT_SECONDARY,
      fontWeight: 400,
      fontSize: '0.92rem',
      lineHeight: 1.58,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BACKGROUND,
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          color: TEXT_PRIMARY,
          fontFamily: BODY_FONT,
        },
        '#root': {
          minHeight: '100vh',
        },
        '::selection': {
          backgroundColor: alpha(DE_BLUE, 0.18),
          color: TEXT_PRIMARY,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: alpha(SURFACE, 0.88),
          color: TEXT_PRIMARY,
          boxShadow: `0 8px 32px ${alpha(TEXT_PRIMARY, 0.08)}`,
          borderBottom: `1px solid ${alpha(DE_BLUE, 0.08)}`,
          backdropFilter: 'blur(14px)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          boxShadow: `0 3px 10px ${alpha(TEXT_PRIMARY, 0.035)}`,
          border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
          backgroundColor: SURFACE,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: SURFACE,
          borderRadius: 3,
        },
        elevation1: {
          boxShadow: `0 2px 8px ${alpha(TEXT_PRIMARY, 0.035)}`,
        },
        elevation4: {
          boxShadow: `0 10px 28px ${alpha(TEXT_PRIMARY, 0.07)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          padding: '9px 22px',
          fontSize: '0.875rem',
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 12px 28px ${alpha(TEXT_PRIMARY, 0.14)}`,
          },
        },
        containedPrimary: {
          backgroundColor: DE_BLUE,
          color: '#FFFFFF',
          boxShadow: `0 4px 14px ${alpha(DE_BLUE, 0.35)}`,
          '&:hover': {
            backgroundColor: DE_BLUE_DARK,
            boxShadow: `0 6px 20px ${alpha(DE_BLUE, 0.45)}`,
          },
        },
        containedSecondary: {
          backgroundColor: DE_AMBER,
          color: TEXT_PRIMARY,
          '&:hover': {
            backgroundColor: DE_AMBER_DARK,
          },
        },
        outlined: {
          borderColor: alpha(DE_BLUE, 0.24),
          color: TEXT_PRIMARY,
          backgroundColor: alpha('#FFFFFF', 0.62),
          '&:hover': {
            borderColor: alpha(DE_BLUE, 0.44),
            backgroundColor: alpha(DE_BLUE, 0.06),
          },
        },
        text: {
          color: DE_BLUE,
          '&:hover': {
            backgroundColor: alpha(DE_BLUE, 0.08),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: alpha('#FFFFFF', 0.88),
            '& fieldset': {
              borderColor: alpha(DE_BLUE, 0.16),
            },
            '&:hover fieldset': {
              borderColor: alpha(DE_BLUE, 0.28),
            },
            '&.Mui-focused fieldset': {
              borderColor: DE_BLUE,
            },
          },
          '& .MuiInputLabel-root': {
            color: TEXT_SECONDARY,
            fontWeight: 500,
            '&.Mui-focused': {
              color: DE_BLUE,
            },
          },
          '& .MuiOutlinedInput-input': {
            color: TEXT_PRIMARY,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: DE_BLUE,
          textDecoration: 'none',
          '&:hover': {
            color: DE_BLUE_DARK,
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          fontWeight: 600,
        },
        filled: {
          backgroundColor: alpha(DE_BLUE, 0.1),
          color: DE_BLUE_DARK,
        },
        outlined: {
          borderColor: alpha(DE_BLUE, 0.18),
          color: DE_BLUE_DARK,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 3,
          border: `1px solid ${alpha(DE_BLUE, 0.12)}`,
          boxShadow: `0 32px 68px ${alpha(TEXT_PRIMARY, 0.16)}`,
          background: SURFACE,
          overflow: 'hidden',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: TEXT_PRIMARY,
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: '1.14rem',
          padding: '22px 24px 12px',
          borderBottom: `1px solid ${alpha(DE_BLUE, 0.08)}`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '18px 24px',
          '&.MuiDialogContent-dividers': {
            borderTop: `1px solid ${alpha(DE_BLUE, 0.08)}`,
            borderBottom: `1px solid ${alpha(DE_BLUE, 0.08)}`,
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '14px 20px',
          borderTop: `1px solid ${alpha(DE_BLUE, 0.08)}`,
          backgroundColor: alpha(DE_BLUE, 0.02),
          gap: 10,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(TEXT_PRIMARY, 0.4),
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: alpha(DE_BLUE, 0.04),
          color: TEXT_PRIMARY,
          fontWeight: 700,
          borderBottom: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        },
        root: {
          borderBottom: `1px solid ${alpha(BORDER, 0.5)}`,
          color: TEXT_PRIMARY,
        },
      },
    },
  },
})

export default theme
