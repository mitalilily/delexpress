import { Button, CircularProgress, Typography, type ButtonProps } from '@mui/material'
import React from 'react'

type ButtonVisualVariant = 'solid' | 'text'

interface CustomIconLoadingButtonProps
  extends Omit<ButtonProps, 'color' | 'type' | 'disabled' | 'onClick' | 'variant'> {
  text: string
  icon?: React.ReactNode
  loading?: boolean
  onClick?: () => void
  disabled?: boolean
  loadingText?: string
  type?: 'button' | 'submit' | 'reset'
  styles?: Record<string, unknown>
  variant?: ButtonVisualVariant
  textColor?: string
}

export default function CustomIconLoadingButton({
  text,
  icon,
  loading = false,
  onClick,
  disabled = false,
  loadingText = 'Loading...',
  type = 'button',
  styles,
  textColor,
  variant = 'solid',
  ...rest
}: CustomIconLoadingButtonProps) {
  const slate = '#243124'
  const slateDark = '#1a221a'
  const isDisabled = loading || disabled
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      sx={{
        ...styles,
        px: 3,
        py: 1.1,
        textTransform: 'none',
        fontWeight: 600,
        gap: 1,
        backgroundColor: variant === 'solid' ? slate : 'transparent',
        color: textColor ?? (variant === 'solid' ? '#fff' : slate),
        border: variant === 'text' ? `1px solid rgba(36, 49, 36, 0.3)` : 'none',
        '&:hover': {
          backgroundColor: variant === 'solid' ? slateDark : 'rgba(36, 49, 36, 0.08)',
        },
        '&:disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
          backgroundColor: variant === 'solid' ? slate : 'transparent',
          color: textColor ?? (variant === 'solid' ? '#fff' : 'rgba(36, 49, 36, 0.5)'),
          borderColor: variant === 'text' ? 'rgba(36, 49, 36, 0.15)' : 'none',
        },
      }}
      {...rest}
    >
      {loading ? (
        <>
          <CircularProgress size={16} thickness={4} sx={{ color: 'currentColor' }} />
          <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 600 }}>
            {loadingText}
          </Typography>
        </>
      ) : (
        <>
          {icon}
          <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 600 }}>
            {text}
          </Typography>
        </>
      )}
    </Button>
  )
}
