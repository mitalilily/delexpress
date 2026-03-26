import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { Box, Button, Container, IconButton, Typography } from "@mui/material";

export default function LandingHeader({
  menuOpen,
  navigationLinks,
  onToggleMenu,
  onCloseMenu,
}) {
  return (
    <Box
      component="header"
      className="sticky top-0 z-40 border-b border-[#d8cbc4]/70 bg-[#f7efe6]/90 backdrop-blur-xl"
    >
      <Container maxWidth="xl" className="py-4">
        <div className="flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#181318] text-white shadow-[0_12px_24px_rgba(24,19,24,0.14)]">
              <span className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold tracking-[-0.08em]">
                DE
              </span>
            </div>
            <div>
              <Typography variant="h6" className="brand-heading text-xl">
                DelExpress
              </Typography>
              <Typography className="text-sm" sx={{ color: "#6d6067" }}>
                Shipping operations for modern ecommerce teams
              </Typography>
            </div>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {navigationLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#4c4148] transition-colors hover:text-[#9b3150]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Button
              component="a"
              href="#calculator"
              variant="outlined"
              sx={{
                borderColor: "rgba(155, 49, 80, 0.28)",
                color: "#181318",
                borderRadius: "999px",
                px: 2.4,
              }}
            >
              Calculate Shipping Cost
            </Button>
            <Button
              component="a"
              href="#get-started"
              variant="contained"
              sx={{
                borderRadius: "999px",
                px: 2.6,
                backgroundColor: "#181318",
                "&:hover": { backgroundColor: "#30262e" },
              }}
            >
              Start Shipping
            </Button>
          </div>

          <IconButton
            className="lg:hidden"
            onClick={onToggleMenu}
            sx={{
              border: "1px solid rgba(155, 49, 80, 0.18)",
              backgroundColor: "rgba(255,255,255,0.7)",
            }}
          >
            <MenuRoundedIcon />
          </IconButton>
        </div>

        {menuOpen ? (
          <div className="mt-4 rounded-[26px] border border-[#dacdc7] bg-white/85 p-4 shadow-[0_18px_36px_rgba(42,26,34,0.08)] lg:hidden">
            <div className="flex flex-col gap-3">
              {navigationLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMenu}
                  className="rounded-2xl px-3 py-2 text-sm font-medium text-[#4c4148] hover:bg-[#f5e6ea]"
                >
                  {item.label}
                </a>
              ))}
              <Button
                component="a"
                href="#get-started"
                variant="contained"
                sx={{
                  mt: 1,
                  borderRadius: "999px",
                  backgroundColor: "#181318",
                  "&:hover": { backgroundColor: "#30262e" },
                }}
              >
                Start Shipping
              </Button>
            </div>
          </div>
        ) : null}
      </Container>
    </Box>
  );
}
