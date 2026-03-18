import { alpha, Box, Grid, Stack, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'
import React from 'react'
import { TbBolt, TbWorld, TbChartBar, TbClick } from 'react-icons/tb'

const features = [
  {
    title: 'Smart AI Routing',
    description:
      'Our intelligent algorithms automatically select the best courier for your specific shipment based on cost, speed, and reliability.',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600',
    tag: 'Efficiency',
    icon: <TbBolt size={24} />,
  },
  {
    title: 'Global Network',
    description:
      'Reach customers in over 220 countries and territories with our extensive network of international shipping partners.',
    image:
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=600',
    tag: 'Reach',
    icon: <TbWorld size={24} />,
  },
  {
    title: 'Real-time Analytics',
    description:
      'Monitor your entire supply chain with advanced dashboards providing real-time visibility into every shipment.',
    image:
      'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&q=80&w=600',
    tag: 'Visibility',
    icon: <TbChartBar size={24} />,
  },
  {
    title: 'Seamless Integration',
    description:
      'Connect your e-commerce store in minutes with our one-click integrations for Shopify, WooCommerce, and more.',
    image:
      'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?auto=format&fit=crop&q=80&w=600',
    tag: 'Simple',
    icon: <TbClick size={24} />,
  },
]

const DE_BLUE = '#0052CC'
const TEXT_PRIMARY = '#172B4D'
const TEXT_SECONDARY = '#42526E'

const FeatureSection: React.FC = () => {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        bgcolor: '#ffffff',
        borderRadius: 1,
        border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
        boxShadow: `0 4px 12px ${alpha(TEXT_PRIMARY, 0.04)}`,
        my: 4,
        overflow: 'hidden',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-end" mb={6} spacing={3}>
        <Box sx={{ maxWidth: '700px' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <Box sx={{ bgcolor: '#FFAB00', p: 0.8, borderRadius: 0.5, color: TEXT_PRIMARY }}>
              <TbBolt size={18} />
            </Box>
            <Typography
              sx={{
                fontSize: '10px',
                fontWeight: 900,
                color: DE_BLUE,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Capabilities
            </Typography>
          </Stack>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '1.8rem', md: '2.4rem' },
              fontWeight: 900,
              color: TEXT_PRIMARY,
              mb: 2,
              letterSpacing: -1,
            }}
          >
            Powerful Shipping Solutions
          </Typography>
          <Typography
            sx={{
              fontSize: '1.1rem',
              color: TEXT_SECONDARY,
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            Scale your business with our all-in-one logistics platform designed for modern e-commerce.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: '#F4F5F7',
                  border: '1px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    borderColor: alpha(DE_BLUE, 0.15),
                    boxShadow: `0 12px 32px ${alpha(TEXT_PRIMARY, 0.08)}`,
                    '& .feature-image': { transform: 'scale(1.1)' },
                  },
                }}
              >
                <Box sx={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="feature-image"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.7s ease',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      bgcolor: DE_BLUE,
                      color: '#ffffff',
                      px: 1.2,
                      py: 0.4,
                      borderRadius: 0.5,
                      fontSize: '10px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)',
                    }}
                  >
                    {feature.tag}
                  </Box>
                </Box>

                <Stack spacing={2} sx={{ p: 3, flexGrow: 1 }}>
                  <Box sx={{ color: DE_BLUE }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>
                    {feature.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.88rem',
                      color: TEXT_SECONDARY,
                      fontWeight: 500,
                      lineHeight: 1.6,
                      flexGrow: 1,
                    }}
                  >
                    {feature.description}
                  </Typography>
                  <Button
                    size="small"
                    endIcon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    }
                    sx={{
                      justifyContent: 'flex-start',
                      px: 0,
                      color: DE_BLUE,
                      fontWeight: 800,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      '&:hover': { bgcolor: 'transparent', '& .MuiButton-endIcon': { transform: 'translateX(4px)' } },
                      '& .MuiButton-endIcon': { transition: 'transform 0.2s' },
                    }}
                  >
                    Explore
                  </Button>
                </Stack>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default FeatureSection
