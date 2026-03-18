import { Box } from '@mui/material'
import React from 'react'
import './loader.css'
// Replace this with your actual logo path or import
import Logo from '/logo/delexpress-logo.svg'

type Props = {
  night?: boolean
}

const FullScreenLoader: React.FC<Props> = ({ night = false }) => {
  return (
    <Box className={`loader-overlay ${night ? 'night' : ''}`}>
      <Box className="loader-content">
        <div className="logo-container">
          <img src={Logo} alt="DelExpress Logo" className="loader-logo" />
        </div>
        <div style={{ color: '#8A1F43', fontWeight: 900, letterSpacing: 2, fontSize: '0.8rem' }}>
          DELEXPRESS
        </div>
      </Box>
    </Box>
  )
}

export default FullScreenLoader
