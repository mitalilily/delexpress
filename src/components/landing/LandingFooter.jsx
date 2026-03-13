import { Box, Container, Divider, Typography } from "@mui/material";

export default function LandingFooter({ footerGroups, footerMeta }) {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" className="pb-10 pt-4">
      <Container maxWidth="xl">
        <div className="surface-panel rounded-[34px] p-6 sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_1.4fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#181318] text-white">
                  <span className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold tracking-[-0.08em]">
                    DE
                  </span>
                </div>
                <div>
                  <Typography variant="h6" className="brand-heading text-xl">
                    DelExpress
                  </Typography>
                  <Typography className="text-sm" sx={{ color: "#6d6067" }}>
                    Shipping operations for growing ecommerce brands
                  </Typography>
                </div>
              </div>

              <Typography
                className="mt-6 max-w-md text-sm leading-8 sm:text-base"
                sx={{ color: "#625b63" }}
              >
                DelExpress helps sellers compare courier rates, automate fulfillment steps, and
                track every shipment from one clean workflow.
              </Typography>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[#ead8de] bg-[#fff7f8] p-4">
                  <Typography
                    className="text-xs font-semibold uppercase tracking-[0.2em]"
                    sx={{ color: "#9b3150" }}
                  >
                    Head Office
                  </Typography>
                  <Typography className="mt-3 text-sm leading-7" sx={{ color: "#554d54" }}>
                    {footerMeta.address}
                  </Typography>
                </div>
                <div className="rounded-[24px] border border-[#ead8de] bg-[#fffaf4] p-4">
                  <Typography
                    className="text-xs font-semibold uppercase tracking-[0.2em]"
                    sx={{ color: "#9b3150" }}
                  >
                    Support
                  </Typography>
                  <Typography className="mt-3 text-sm leading-7" sx={{ color: "#554d54" }}>
                    {footerMeta.supportHours}
                    <br />
                    {footerMeta.contactNumber}
                  </Typography>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <Typography variant="h6" className="text-base">
                    {group.title}
                  </Typography>
                  <div className="mt-4 grid gap-3">
                    {group.links.map((link) => (
                      <Typography key={link} className="text-sm leading-7" sx={{ color: "#625b63" }}>
                        {link}
                      </Typography>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider sx={{ my: 4, borderColor: "rgba(186, 170, 177, 0.74)" }} />

          <div className="flex flex-col gap-3 text-sm text-[#6b6068] sm:flex-row sm:items-center sm:justify-between">
            <Typography className="text-sm text-[#6b6068]">
              DelExpress (c) {currentYear}. All rights reserved.
            </Typography>
            <Typography className="text-sm text-[#6b6068]">
              Built for ecommerce teams who want faster shipping decisions and clearer delivery
              visibility.
            </Typography>
          </div>
        </div>
      </Container>
    </Box>
  );
}
