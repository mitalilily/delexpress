import { alpha, Box, Stack, Typography, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import React from 'react'
import { TbSparkles } from 'react-icons/tb'

interface PageHeadingProps {
  title: string | React.ReactNode
  subtitle?: string
  center?: boolean
  fontSize?: string | number
  icon?: React.ReactNode
}

const PageHeading: React.FC<PageHeadingProps> = ({
  title,
  subtitle,
  center = false,
  fontSize,
  icon = <TbSparkles size={20} />,
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        backgroundColor: '#fffdf9',
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.5, sm: 2 },
          boxShadow: `0 12px 28px ${alpha(theme.palette.text.primary, 0.06)}`,
      }}
    >
      <Stack spacing={1} textAlign={center ? 'center' : 'left'}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            justifyContent: center ? 'center' : 'flex-start',
          }}
        >
          <motion.div
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            whileHover={{ rotate: 180, scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          </motion.div>
          <Typography
            fontSize={fontSize ?? { xs: '1.4rem', md: '1.8rem' }}
            fontWeight={800}
            lineHeight={1.1}
            sx={{
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>
        </Stack>

        {subtitle && (
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: '0.9rem', md: '0.95rem' },
              maxWidth: center ? 820 : 720,
              mx: center ? 'auto' : 0,
              lineHeight: 1.5,
              fontWeight: 500,
              pl: 6,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

export default PageHeading
