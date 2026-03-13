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
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  experiencePoints,
  faqItems,
  heroMetrics,
  mediaAssets,
  navigationLinks,
  servicePoints,
  visualHighlights,
} from "../utils/landingContent";
import theme from "../utils/muiTheme";

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen text-stone-900">
        <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[rgba(248,245,241,0.94)] backdrop-blur-xl">
          <Container maxWidth="xl" className="!px-5 sm:!px-6 lg:!px-8">
            <div className="flex items-center justify-between gap-4 py-4">
              <a href="#top" className="flex min-w-0 items-center gap-4">
                <img src="/delexpress-logo.svg" alt="DelExpress logo" className="h-11 w-auto sm:h-13" />
              </a>

              <nav className="hidden items-center gap-8 lg:flex">
                {navigationLinks.map((item) => (
                  <a key={item.href} href={item.href} className="text-sm font-semibold text-stone-600 transition hover:text-[#8a1f43]">
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                <Button color="inherit" href="#services" sx={{ borderRadius: 999, px: 2.4, color: "#3d3640" }}>
                  Explore services
                </Button>
                <Button variant="contained" endIcon={<EastRoundedIcon />} href="#contact" sx={{ borderRadius: 999, px: 2.8, py: 1.15, bgcolor: "#151219", boxShadow: "none", '&:hover': { bgcolor: '#8a1f43', boxShadow: 'none' } }}>
                  Book a demo
                </Button>
              </div>

              <IconButton onClick={() => setMenuOpen((value) => !value)} className="lg:!hidden" sx={{ border: "1px solid rgba(190,181,186,0.82)", bgcolor: "#fff" }}>
                <MenuRoundedIcon />
              </IconButton>
            </div>

            {menuOpen ? (
              <div className="mb-4 space-y-2 rounded-[0.9rem] border border-stone-200 bg-white p-3 lg:hidden">
                {navigationLinks.map((item) => (
                  <a key={item.href} href={item.href} className="block rounded-lg px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-[#8a1f43]">
                    {item.label}
                  </a>
                ))}
                <Button variant="contained" href="#contact" fullWidth sx={{ borderRadius: 999, py: 1.15, bgcolor: "#151219", '&:hover': { bgcolor: '#8a1f43' } }}>
                  Book a demo
                </Button>
              </div>
            ) : null}
          </Container>
        </header>

        <main id="top">
          <Container maxWidth="xl" className="!px-5 pt-10 sm:!px-6 lg:!px-8 lg:pt-16">
            <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <div>
                <Chip label="Shipping operations platform" sx={{ bgcolor: "#fff", border: "1px solid rgba(190,181,186,0.82)", color: "#8a1f43", fontWeight: 700 }} />
                <Typography variant="h1" className="mt-7 max-w-5xl !text-5xl !leading-[0.99] !text-stone-950 sm:!text-6xl lg:!text-[4.8rem]">
                  Better shipping control for brands that need speed, accuracy, and reliable delivery visibility.
                </Typography>
                <Typography className="mt-6 max-w-3xl !text-xl !leading-8 !text-stone-600">
                  DelExpress brings courier selection, dispatch execution, tracking updates, and shipment follow-through into one operating layer built for modern teams.
                </Typography>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="contained" endIcon={<EastRoundedIcon />} href="#contact" sx={{ borderRadius: 999, px: 3.2, py: 1.45, bgcolor: "#151219", boxShadow: "none", '&:hover': { bgcolor: '#8a1f43', boxShadow: 'none' } }}>
                    Request a walkthrough
                  </Button>
                  <Button variant="outlined" href="#overview" sx={{ borderRadius: 999, px: 3.2, py: 1.45, borderColor: "rgba(176,165,170,0.94)", color: "#3d3640" }}>
                    See the platform
                  </Button>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {heroMetrics.map((item) => (
                    <div key={item.label} className="surface-panel rounded-[0.9rem] px-5 py-5">
                      <Typography className="!text-3xl !font-semibold !text-stone-950">{item.value}</Typography>
                      <Typography className="mt-2 !text-sm !leading-6 !text-stone-500">{item.label}</Typography>
                    </div>
                  ))}
                </div>
              </div>

              <div className="image-frame rounded-[1.1rem] bg-white p-3">
                <img src={mediaAssets.hero} alt="DelExpress shipping control scene" className="h-[420px] w-full rounded-[0.8rem] object-cover lg:h-[560px]" />
              </div>
            </div>
          </Container>

          <Container maxWidth="xl" className="!px-5 py-10 sm:!px-6 lg:!px-8 lg:py-14">
            <div className="grid gap-6 lg:grid-cols-3">
              {visualHighlights.map((item) => (
                <div key={item.title} className="surface-panel overflow-hidden rounded-[1rem]">
                  <img src={item.image} alt={item.title} className="h-[240px] w-full object-cover sm:h-[280px]" />
                  <div className="space-y-2 px-5 py-5">
                    <Typography className="!text-lg !font-semibold !text-stone-950">{item.title}</Typography>
                    <Typography className="!text-sm !leading-6 !text-stone-600">{item.description}</Typography>
                  </div>
                </div>
              ))}
            </div>
          </Container>

          <Container id="overview" maxWidth="xl" className="!px-5 py-14 sm:!px-6 lg:!px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <div>
                <Typography className="!text-sm !font-semibold !uppercase !tracking-[0.26em] !text-[#8a1f43]">Overview</Typography>
                <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-[3.2rem]">
                  A more practical shipping platform for day-to-day execution.
                </Typography>
              </div>
              <div className="space-y-5 text-lg leading-8 text-stone-600">
                <Typography>
                  DelExpress is built for businesses that need better courier choice, steadier dispatch workflows, and stronger visibility after a shipment is created.
                </Typography>
                <Typography>
                  The platform is positioned around real operating needs: shipping cost control, delivery updates, and a cleaner experience for teams managing volume every day.
                </Typography>
              </div>
            </div>
          </Container>

          <Container id="services" maxWidth="xl" className="!px-5 py-2 sm:!px-6 lg:!px-8 lg:py-10">
            <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <div className="space-y-5">
                <Typography className="!text-sm !font-semibold !uppercase !tracking-[0.26em] !text-[#8a1f43]">Services</Typography>
                <Typography variant="h2" className="!text-4xl !leading-tight !text-stone-950 sm:!text-[3.2rem]">
                  Shipping tools that support execution instead of slowing it down.
                </Typography>
                <div className="space-y-4">
                  {servicePoints.map((item) => (
                    <div key={item} className="surface-panel rounded-[0.9rem] px-5 py-4 text-base leading-7 text-stone-600">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="image-frame rounded-[1.1rem] bg-white p-3">
                <img src={mediaAssets.operations} alt="DelExpress operations workflow scene" className="h-[360px] w-full rounded-[0.8rem] object-cover lg:h-[480px]" />
              </div>
            </div>
          </Container>

          <Container id="visibility" maxWidth="xl" className="!px-5 py-14 sm:!px-6 lg:!px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="image-frame rounded-[1.1rem] bg-white p-3">
                <img src={mediaAssets.team} alt="DelExpress client visibility scene" className="h-[360px] w-full rounded-[0.8rem] object-cover lg:h-[480px]" />
              </div>
              <div>
                <Typography className="!text-sm !font-semibold !uppercase !tracking-[0.26em] !text-[#8a1f43]">Visibility</Typography>
                <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-[3.2rem]">
                  Better shipment visibility for teams that need to stay aligned.
                </Typography>
                <div className="mt-6 space-y-4">
                  {experiencePoints.map((item) => (
                    <div key={item} className="border-b border-stone-200 pb-4 text-base leading-7 text-stone-600 last:border-none last:pb-0">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>

          <Container id="faq" maxWidth="xl" className="!px-5 py-10 sm:!px-6 lg:!px-8 lg:py-16">
            <div className="max-w-2xl">
              <Typography className="!text-sm !font-semibold !uppercase !tracking-[0.26em] !text-[#8a1f43]">FAQ</Typography>
              <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-[3.1rem]">
                Straight answers for prospective clients.
              </Typography>
            </div>
            <div className="mt-8 space-y-4">
              {faqItems.map((item) => (
                <Accordion key={item.question} disableGutters elevation={0} className="surface-panel !rounded-[0.9rem] !bg-transparent !shadow-none before:!hidden">
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#8a1f43" }} />}>
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
            <Box className="rounded-[1rem] bg-[#151219] px-7 py-10 text-white shadow-[0_18px_36px_rgba(21,18,25,0.12)] sm:px-10 sm:py-12">
              <Typography className="!text-sm !font-semibold !uppercase !tracking-[0.26em] !text-rose-300">Contact</Typography>
              <Typography variant="h2" className="mt-4 max-w-4xl !text-4xl !leading-tight !text-white sm:!text-[3.1rem]">
                DelExpress for businesses that want cleaner shipping execution.
              </Typography>
              <Typography className="mt-5 max-w-2xl !text-lg !leading-8 !text-stone-300">
                This version uses clearer language, stronger visuals, and a simpler interface so the website feels more relevant and more presentable.
              </Typography>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="contained" href="mailto:sales@delexpress.com" sx={{ borderRadius: 999, px: 3, py: 1.4, bgcolor: "#fff", color: "#151219", '&:hover': { bgcolor: '#efe8eb' } }}>
                  Contact DelExpress
                </Button>
                <Button variant="outlined" href="#top" sx={{ borderRadius: 999, px: 3, py: 1.4, borderColor: "rgba(255,255,255,0.18)", color: "#fff" }}>
                  Back to top
                </Button>
              </div>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 5 }} />
              <Typography className="!text-sm !text-stone-400">DelExpress © {currentYear}. Courier choice, shipment visibility, and delivery operations in one platform.</Typography>
            </Box>
          </Container>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default LandingPage;

