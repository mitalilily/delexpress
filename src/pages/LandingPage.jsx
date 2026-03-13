import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  capabilityColumns,
  faqItems,
  navigationLinks,
  networkPanels,
  platformHighlights,
  trustMetrics,
  workflowSteps,
} from "../utils/landingContent";
import theme from "../utils/muiTheme";

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="site-shell min-h-screen text-stone-900">
        <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[rgba(246,242,236,0.92)] backdrop-blur-xl">
          <Container maxWidth="xl" className="!px-5 sm:!px-6 lg:!px-8">
            <div className="flex items-center justify-between gap-4 py-4">
              <a href="#top" className="flex min-w-0 items-center gap-4">
                <img src="/delexpress-logo.svg" alt="DelExpress logo" className="h-12 w-auto sm:h-14" />
              </a>

              <nav className="hidden items-center gap-8 lg:flex">
                {navigationLinks.map((item) => (
                  <a key={item.href} href={item.href} className="text-sm font-semibold tracking-[0.01em] text-stone-600 transition hover:text-[#8A1F43]">
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                <Button color="inherit" href="#platform" sx={{ borderRadius: 999, px: 2.25, color: "#433d46" }}>
                  Platform overview
                </Button>
                <Button
                  variant="contained"
                  endIcon={<EastRoundedIcon />}
                  href="#contact"
                  sx={{
                    borderRadius: 999,
                    px: 2.7,
                    py: 1.15,
                    bgcolor: "#161318",
                    boxShadow: "none",
                    '&:hover': { bgcolor: '#8A1F43', boxShadow: 'none' },
                  }}
                >
                  Talk to DelExpress
                </Button>
              </div>

              <IconButton
                onClick={() => setMenuOpen((value) => !value)}
                className="lg:!hidden"
                sx={{ border: "1px solid rgba(199,184,190,0.8)", bgcolor: "rgba(255,255,255,0.88)" }}
              >
                <MenuRoundedIcon />
              </IconButton>
            </div>

            {menuOpen ? (
              <div className="mb-4 space-y-2 rounded-[1.2rem] border border-stone-200 bg-white p-3 lg:hidden">
                {navigationLinks.map((item) => (
                  <a key={item.href} href={item.href} className="block rounded-xl px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-[#8A1F43]">
                    {item.label}
                  </a>
                ))}
                <Button variant="contained" href="#contact" fullWidth sx={{ borderRadius: 999, py: 1.25, bgcolor: "#161318", '&:hover': { bgcolor: '#8A1F43' } }}>
                  Talk to DelExpress
                </Button>
              </div>
            ) : null}
          </Container>
        </header>

        <main id="top">
          <Container maxWidth="xl" className="!px-5 pb-10 pt-10 sm:!px-6 lg:!px-8 lg:pb-18 lg:pt-16">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <Stack direction="row" spacing={1.2} className="flex-wrap">
                  <Chip label="Logistics aggregator" sx={{ bgcolor: "#ffffff", border: "1px solid rgba(201, 186, 192, 0.86)", color: "#8A1F43", fontWeight: 700 }} />
                  <Chip label="DelExpress" sx={{ bgcolor: "#f0e7ea", color: "#161318", fontWeight: 700 }} />
                </Stack>

                <Typography variant="h1" className="mt-7 max-w-5xl !text-5xl !leading-[0.97] !text-stone-950 sm:!text-6xl lg:!text-[5.2rem]">
                  A cleaner shipping aggregator experience for brands that care about cost,
                  <span className="serif-display ml-2 inline text-[#8A1F43]">control</span>
                  <span className="ml-2 inline">and delivery visibility.</span>
                </Typography>

                <Typography className="mt-6 max-w-3xl !text-lg !leading-8 !text-stone-600 sm:!text-xl">
                  DelExpress is presented as a serious aggregator platform for multi-courier execution, post-shipment visibility, and shipping decisions built on operational logic.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} className="mt-8 max-w-xl">
                  <Button
                    variant="contained"
                    endIcon={<EastRoundedIcon />}
                    href="#contact"
                    sx={{
                      borderRadius: 999,
                      px: 3.2,
                      py: 1.5,
                      bgcolor: "#161318",
                      boxShadow: "none",
                      '&:hover': { bgcolor: '#8A1F43', boxShadow: 'none' },
                    }}
                  >
                    Request a platform walkthrough
                  </Button>
                  <Button
                    variant="outlined"
                    href="#capabilities"
                    sx={{
                      borderRadius: 999,
                      px: 3.2,
                      py: 1.5,
                      borderColor: "rgba(176, 153, 162, 0.92)",
                      color: "#3d3640",
                    }}
                  >
                    Review capabilities
                  </Button>
                </Stack>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {trustMetrics.map((item) => (
                    <div key={item.label} className="frame-card rounded-[1.3rem] px-5 py-5">
                      <p className="text-3xl font-bold tracking-tight text-stone-950">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="frame-card overflow-hidden rounded-[1.7rem] p-4 sm:p-5">
                <img src="/aggregator-hero.svg" alt="DelExpress dashboard visualization" className="w-full rounded-[1.15rem] border border-stone-200" />
              </div>
            </div>
          </Container>

          <Container maxWidth="xl" className="!px-5 py-4 sm:!px-6 lg:!px-8">
            <div className="frame-card flex flex-wrap items-center justify-between gap-4 rounded-[1.3rem] px-5 py-5 text-sm font-semibold text-stone-600">
              <p className="text-stone-950">Structured for an aggregator buyer, not a generic courier marketing page.</p>
              <div className="flex flex-wrap gap-2">
                <Chip label="Routing intelligence" size="small" sx={{ bgcolor: "#fff", fontWeight: 700 }} />
                <Chip label="Branded tracking" size="small" sx={{ bgcolor: "#fff", fontWeight: 700 }} />
                <Chip label="Operational control" size="small" sx={{ bgcolor: "#fff", fontWeight: 700 }} />
              </div>
            </div>
          </Container>

          <Container id="platform" maxWidth="xl" className="!px-5 py-12 sm:!px-6 lg:!px-8 lg:py-20">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Typography className="!text-sm !font-bold !uppercase !tracking-[0.28em] !text-[#8A1F43]">Platform positioning</Typography>
                <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-5xl">
                  The page now sounds like an aggregator platform should.
                </Typography>
              </div>
              <Typography className="!text-lg !leading-8 !text-stone-600">
                Real logistics aggregators do not sell vague speed and convenience. They sell courier breadth, margin control, routing discipline, tracking continuity, and post-shipment responsiveness. DelExpress now reflects that framing.
              </Typography>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {platformHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="tinted-card rounded-[1.4rem] p-7">
                    <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Icon sx={{ color: "#8A1F43", fontSize: 26 }} />
                    </div>
                    <Typography variant="h3" className="mt-6 !text-[1.45rem] !text-stone-950">
                      {item.title}
                    </Typography>
                    <Typography className="mt-4 !text-base !leading-7 !text-stone-600">
                      {item.description}
                    </Typography>
                  </div>
                );
              })}
            </div>
          </Container>

          <Container id="capabilities" maxWidth="xl" className="!px-5 py-4 sm:!px-6 lg:!px-8 lg:py-16">
            <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-start">
              <div className="frame-card rounded-[1.7rem] p-5 sm:p-6">
                <img src="/aggregator-network.svg" alt="DelExpress operating network illustration" className="w-full rounded-[1.05rem] border border-stone-200" />
              </div>

              <div className="space-y-5">
                <div>
                  <Typography className="!text-sm !font-bold !uppercase !tracking-[0.28em] !text-[#8A1F43]">Capabilities</Typography>
                  <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-5xl">
                    The modules are clearer, straighter, and more useful.
                  </Typography>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {capabilityColumns.map((column) => (
                    <div key={column.title} className="frame-card rounded-[1.3rem] p-5">
                      <Typography className="!text-sm !font-bold !uppercase !tracking-[0.18em] !text-stone-500">{column.title}</Typography>
                      <div className="mt-4 space-y-3">
                        {column.items.map((item) => (
                          <div key={item} className="border-l-2 border-[#8A1F43]/60 pl-3 text-sm leading-6 text-stone-600">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>

          <Container id="network" maxWidth="xl" className="!px-5 py-12 sm:!px-6 lg:!px-8 lg:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <Typography className="!text-sm !font-bold !uppercase !tracking-[0.28em] !text-[#8A1F43]">Network and workflow</Typography>
                <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-5xl">
                  Stronger delivery logic from order intake to final outcome.
                </Typography>
              </div>
              <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-500">
                Aggregator website direction: precise, credible, modern
              </div>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {workflowSteps.map((item) => (
                <div key={item.step} className="frame-card rounded-[1.3rem] p-7">
                  <Typography className="!text-sm !font-bold !text-[#8A1F43]">{item.step}</Typography>
                  <Typography variant="h3" className="mt-5 !text-[1.45rem] !text-stone-950">
                    {item.title}
                  </Typography>
                  <Typography className="mt-4 !text-base !leading-7 !text-stone-600">
                    {item.description}
                  </Typography>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {networkPanels.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="tinted-card rounded-[1.3rem] p-6">
                    <Icon sx={{ color: "#8A1F43", fontSize: 24 }} />
                    <Typography className="mt-4 !text-lg !font-semibold !text-stone-950">{item.title}</Typography>
                    <Typography className="mt-3 !text-sm !leading-7 !text-stone-600">{item.description}</Typography>
                  </div>
                );
              })}
            </div>
          </Container>

          <Container id="faq" maxWidth="xl" className="!px-5 py-12 sm:!px-6 lg:!px-8 lg:py-20">
            <div className="max-w-2xl">
              <Typography className="!text-sm !font-bold !uppercase !tracking-[0.28em] !text-[#8A1F43]">FAQ</Typography>
              <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-5xl">
                Clean answers for the DelExpress story.
              </Typography>
            </div>

            <div className="mt-8 space-y-4">
              {faqItems.map((item) => (
                <Accordion key={item.question} disableGutters elevation={0} className="frame-card !rounded-[1.2rem] !bg-transparent !shadow-none before:!hidden">
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#8A1F43" }} />}>
                    <Typography className="!text-lg !font-semibold !text-stone-950">{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography className="!text-base !leading-7 !text-stone-600">{item.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          </Container>

          <Container id="contact" maxWidth="xl" className="!px-5 pb-16 pt-4 sm:!px-6 lg:!px-8 lg:pb-24">
            <Box className="rounded-[1.8rem] border border-stone-300 bg-[#171419] px-7 py-10 text-white shadow-[0_28px_60px_rgba(23,20,25,0.16)] sm:px-10 sm:py-12">
              <Typography className="!text-sm !font-bold !uppercase !tracking-[0.28em] !text-rose-300">Contact</Typography>
              <Typography variant="h2" className="mt-4 max-w-4xl !text-4xl !leading-tight !text-white sm:!text-5xl">
                DelExpress, repositioned as a sharper aggregator website.
              </Typography>
              <Typography className="mt-5 max-w-2xl !text-lg !leading-8 !text-stone-300">
                This version drops the softer, AI-looking visual language and replaces it with a cleaner brand system, more professional typography, and logistics-focused messaging.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} className="mt-8 max-w-xl">
                <Button variant="contained" href="mailto:sales@delexpress.com" sx={{ borderRadius: 999, px: 3, py: 1.45, bgcolor: "#fff", color: "#171419", '&:hover': { bgcolor: '#efe8eb' } }}>
                  Contact DelExpress
                </Button>
                <Button variant="outlined" href="#top" sx={{ borderRadius: 999, px: 3, py: 1.45, borderColor: "rgba(255,255,255,0.18)", color: "#fff" }}>
                  Back to top
                </Button>
              </Stack>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 5 }} />
              <Typography className="!text-sm !text-stone-400">DelExpress © {currentYear}. Multi-courier orchestration, tracking continuity, and delivery operations in one aggregator platform.</Typography>
            </Box>
          </Container>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default LandingPage;
