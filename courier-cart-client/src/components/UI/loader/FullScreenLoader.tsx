import { Box, Typography } from '@mui/material'
import React from 'react'
import './loader.css'
import Logo from '/logo/ExpressoPro-logo.svg'

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
            <img src={Logo} alt="ExpressoPro Logo" className="loader-logo" />
          </div>
          <Typography className="loader-title">ExpressoPro</Typography>
          <Typography className="loader-copy">Preparing your workspace</Typography>
          <Box className="loader-bar">
            <Box className="loader-bar-fill" />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default FullScreenLoader
