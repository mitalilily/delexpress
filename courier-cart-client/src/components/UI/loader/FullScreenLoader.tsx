import { Box, Typography } from '@mui/material'
import React from 'react'
import './loader.css'
import Logo from '/logo/delexpress-logo.svg'

type Props = {
  night?: boolean
  soft?: boolean
}

const FullScreenLoader: React.FC<Props> = ({ night = false, soft = false }) => {
  return (
    <Box className={`loader-overlay ${night ? 'night' : ''} ${soft ? 'soft' : ''}`}>
      <Box className="loader-content">
        <Box className="loader-shell">
          <div className="logo-container">
            <img src={Logo} alt="Delexpress Logo" className="loader-logo" />
          </div>
          <Typography className="loader-title">DELEXPRESS</Typography>
          <Typography className="loader-copy">
            Preparing your workspace
          </Typography>
          <Box className="loader-bar">
            <Box className="loader-bar-fill" />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default FullScreenLoader
