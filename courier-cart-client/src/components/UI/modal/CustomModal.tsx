import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import React from 'react'
import { FiX } from 'react-icons/fi'

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'
const BRAND_GRADIENT = `linear-gradient(135deg, ${DE_BLUE} 0%, ${DE_AMBER} 100%)`

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
      fullWidth
      maxWidth={width ? false : maxWidth}
      PaperProps={{
        sx: {
          borderRadius: 1,
          p: 0,
          background: `
            radial-gradient(460px 180px at 0% 0%, rgba(255, 171, 0, 0.09) 0%, transparent 70%),
            radial-gradient(460px 180px at 100% 0%, rgba(0, 82, 204, 0.10) 0%, transparent 72%),
            #ffffff
          `,
          border: '1px solid rgba(0, 82, 204, 0.16)',
          color: '#1A1A1A',
          boxShadow: '0 26px 60px rgba(0, 82, 204, 0.18)',
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
          color: DE_BLUE,
          borderBottom: '1px solid rgba(0, 82, 204, 0.12)',
        }}
      >
        {title}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: { xs: 8, sm: 12 },
            top: { xs: 9, sm: 11 },
            color: DE_BLUE,
            bgcolor: 'rgba(0, 82, 204, 0.06)',
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            '&:hover': {
              bgcolor: 'rgba(0, 82, 204, 0.14)',
              transform: 'rotate(90deg)',
            },
            transition: 'all 0.3s ease',
          }}
          aria-label="Close dialog"
        >
          <FiX size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 2.8 }, py: { xs: 1.8, sm: 2.2 }, borderBottom: footer ? '1px solid rgba(0, 82, 204, 0.08)' : 'none' }}>
        {children}
      </DialogContent>
      {footer && (
        <DialogActions sx={{ p: { xs: 1.6, sm: 2 }, borderTop: 'none', bgcolor: 'rgba(0, 82, 204, 0.01)' }}>
          {footer}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default CustomDialog
