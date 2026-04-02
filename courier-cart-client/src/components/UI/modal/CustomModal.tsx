import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import React from 'react'
import { FiX } from 'react-icons/fi'

const PLUM = '#8A1F43'
const MINT = '#56C0A5'
const TEXT_PRIMARY = '#161219'
const BRAND_GRADIENT = `linear-gradient(135deg, ${PLUM} 0%, #C86B5E 58%, ${MINT} 100%)`

interface CustomDialogProps {
  open: boolean
  onClose: () => void
  title?: string | React.ReactElement
  children: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  borderRadius?: number // in px
  footer?: React.ReactNode
  width?: string
  fullScreen?: boolean
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm',
  footer,
  fullScreen,
  width,
}) => {
  return (
    <Dialog
      open={open}
      fullScreen={fullScreen}
      onClose={onClose}
      keepMounted
      fullWidth
      maxWidth={width ? false : maxWidth}
      PaperProps={{
        sx: {
          borderRadius: { xs: 3, sm: 4 },
          p: 0,
          background: `
            radial-gradient(420px 180px at 0% 0%, rgba(138, 31, 67, 0.10) 0%, transparent 72%),
            radial-gradient(420px 180px at 100% 0%, rgba(86, 192, 165, 0.10) 0%, transparent 70%),
            linear-gradient(180deg, #FFFCF8 0%, #FFF7F1 100%)
          `,
          border: '1px solid rgba(138, 31, 67, 0.14)',
          color: TEXT_PRIMARY,
          boxShadow: '0 28px 64px rgba(22, 18, 25, 0.18)',
          minWidth: { xs: 'unset', sm: 360 },
          mx: { xs: 1, sm: 0 },
          width: width ? width : 'auto',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: BRAND_GRADIENT,
            borderRadius: '4px 4px 0 0',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          pt: { xs: 2.4, sm: 2.8 },
          pb: { xs: 1.4, sm: 1.6 },
          px: { xs: 2, sm: 2.8 },
          fontWeight: 800,
          fontSize: { xs: '1.04rem', sm: '1.18rem' },
          color: PLUM,
          borderBottom: '1px solid rgba(138, 31, 67, 0.08)',
        }}
      >
        {title}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 12 },
            top: { xs: 9, sm: 11 },
            color: PLUM,
            bgcolor: 'rgba(138, 31, 67, 0.07)',
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            border: '1px solid rgba(138, 31, 67, 0.08)',
            '&:hover': {
              bgcolor: 'rgba(138, 31, 67, 0.12)',
              transform: 'rotate(90deg)',
            },
            transition: 'all 0.3s ease',
          }}
          aria-label="Close dialog"
        >
          <FiX size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          px: { xs: 2, sm: 2.8 },
          py: { xs: 1.8, sm: 2.2 },
          borderBottom: footer ? '1px solid rgba(138, 31, 67, 0.06)' : 'none',
        }}
      >
        {children}
      </DialogContent>
      {footer && (
        <DialogActions
          sx={{
            p: { xs: 1.6, sm: 2 },
            borderTop: 'none',
            bgcolor: 'rgba(138, 31, 67, 0.015)',
          }}
        >
          {footer}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default CustomDialog
