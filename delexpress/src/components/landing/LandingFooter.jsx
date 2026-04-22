import { Box, Container, Divider, Typography } from '@mui/material'
import { siteRoutes } from '../../utils/landingContent'

function getFooterLinkHref(link) {
  if (link.startsWith('Phone:')) {
    const phone = link.split(': ').at(-1)?.trim().replace(/\s+/g, '')
    return `tel:${phone}`
  }

  const anchorMap = {
    Features: siteRoutes.features,
    'Shipping Calculator': siteRoutes.tools,
    'Courier Partners': siteRoutes.features,
    Pricing: siteRoutes.tools,
    'About Us': siteRoutes.home,
    Careers: siteRoutes.home,
    Contact: siteRoutes.home,
    'Help Center': siteRoutes.faq,
    'Shipping Guide': siteRoutes.features,
    'API Documentation': siteRoutes.tools,
    'Privacy Policy': siteRoutes.legal,
    'Terms of Service': siteRoutes.legal,
  }

  return anchorMap[link] || siteRoutes.home
}

export default function LandingFooter({ footerGroups, footerMeta }) {
  const currentYear = new Date().getFullYear()

  return (
    <Box component="footer" className="pb-10 pt-4">
      <Container maxWidth="xl">
        <div className="footer-shell rounded-[38px] p-6 sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_1.4fr]">
            <div>
              <div className="flex items-center gap-3">
                <Box
                  component="img"
                  src="/Expressopro-logo.svg"
                  alt="ExpressoPro"
                  sx={{ width: { xs: 126, sm: 156 }, height: 'auto', display: 'block' }}
                />
                <div>
                  <Typography variant="h6" className="text-xl" sx={{ color: '#ffffff' }}>
                    ExpressoPro
                  </Typography>
                  <Typography className="text-sm" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                    Shipping operations for growing ecommerce brands
                  </Typography>
                </div>
              </div>

              <Typography
                className="mt-6 max-w-md text-sm leading-8 sm:text-base"
                sx={{ color: 'rgba(255,255,255,0.72)' }}
              >
                ExpressoPro helps sellers compare courier rates, automate fulfillment steps, and
                track every shipment from one clean workflow.
              </Typography>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {footerMeta.address ? (
                  <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <Typography
                      className="text-xs font-semibold uppercase tracking-[0.2em]"
                      sx={{ color: '#f2c7d1' }}
                    >
                      Head Office
                    </Typography>
                    <Typography
                      className="mt-3 text-sm leading-7"
                      sx={{ color: 'rgba(255,255,255,0.78)' }}
                    >
                      {footerMeta.address}
                    </Typography>
                  </div>
                ) : null}
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <Typography
                    className="text-xs font-semibold uppercase tracking-[0.2em]"
                    sx={{ color: '#f2c7d1' }}
                  >
                    Support
                  </Typography>
                  <Typography
                    className="mt-3 text-sm leading-7"
                    sx={{ color: 'rgba(255,255,255,0.78)' }}
                  >
                    {footerMeta.supportHours ? (
                      <>
                        {footerMeta.supportHours}
                        <br />
                      </>
                    ) : null}
                    {footerMeta.contactNumber}
                  </Typography>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <Typography variant="h6" className="text-base" sx={{ color: '#ffffff' }}>
                    {group.title}
                  </Typography>
                  <div className="mt-4 grid gap-3">
                    {group.links.map((link) => (
                      <Typography
                        key={link}
                        component="a"
                        href={getFooterLinkHref(link)}
                        className="text-sm leading-7 transition-colors hover:text-white"
                        sx={{ color: 'rgba(255,255,255,0.72)' }}
                      >
                        {link}
                      </Typography>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <Typography className="text-sm" sx={{ color: 'rgba(255,255,255,0.62)' }}>
              ExpressoPro (c) {currentYear}. All rights reserved.
            </Typography>
            <Typography className="text-sm" sx={{ color: 'rgba(255,255,255,0.62)' }}>
              Built for ecommerce teams who want faster shipping decisions and clearer delivery
              visibility.
            </Typography>
          </div>
        </div>
      </Container>
    </Box>
  )
}
