import { Chip, type ChipProps } from '@mui/material'
import React from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { MdError, MdInfo, MdPending } from 'react-icons/md'

interface StatusChipProps extends Partial<ChipProps> {
  status: 'success' | 'pending' | 'error' | 'info'
  label?: string
}

const STATUS_STYLES = {
  success: {
    bg: '#D5F4E6',
    color: '#27AE60',
    icon: <FaCheckCircle size={12} />,
    defaultLabel: 'Success',
  },
  pending: {
    bg: '#FDEBD0',
    color: '#E67E22',
    icon: <MdPending size={12} />,
    defaultLabel: 'Pending',
  },
  error: {
    bg: '#FADBD8',
    color: '#C0392B',
    icon: <MdError size={12} />,
    defaultLabel: 'Failed',
  },
  info: {
    bg: '#D6EAF8',
    color: '#2C3E50',
    icon: <MdInfo size={12} />,
    defaultLabel: 'Info',
  },
}

const StatusChip: React.FC<StatusChipProps> = ({ status, label, ...props }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.info

  return (
    <Chip
      size="small"
      icon={style.icon}
      label={label || style.defaultLabel}
      sx={{
        height: 22,
        fontSize: '10px',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.color}20`,
        borderRadius: '12px',
        '& .MuiChip-icon': {
          color: style.color,
        },
        ...props.sx,
      }}
      {...props}
    />
  )
}

export default StatusChip
