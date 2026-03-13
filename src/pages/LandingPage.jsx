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
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useMemo, useState } from "react";
import {
  faqItems,
  footerLinks,
  heroMetrics,
  mediaAssets,
  navigationLinks,
  operationsPoints,
  platformCards,
  shippingPillars,
  spotlightCards,
} from "../utils/landingContent";
import theme from "../utils/muiTheme";
import {
  VOLUMETRIC_DIVISOR,
  calculateChargeableWeight,
  calculateVolumetricWeight,
} from "../utils/volumetricWeight";

const calculatorFields = [
  { name: "length", label: "Length (cm)" },
  { name: "width", label: "Width (cm)" },
  { name: "height", label: "Height (cm)" },
  { name: "actualWeight", label: "Actual weight (kg)" },
];

function SectionEyebrow({ children }) {
  return (
    <Typography className="!text-sm !font-bold !uppercase !tracking-[0.24em] !text-[#9b3150]">
      {children}
    </Typography>
  );
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [calculatorValues, setCalculatorValues] = useState({
    length: "30",
    width: "20",
    height: "18",
    actualWeight: "2.4",
  });

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const volumetricWeight = useMemo(
    () => calculateVolumetricWeight(calculatorValues),
    [calculatorValues],
  );
  const chargeableWeight = useMemo(
    () =>
      calculateChargeableWeight({
        actualWeight: calculatorValues.actualWeight,
        volumetricWeight,
      }),
    [calculatorValues.actualWeight, volumetricWeight],
  );

  function handleCalculatorChange(event) {
    const { name, value } = event.target;

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCalculatorValues((currentValues) => ({
        ...currentValues,
        [name]: value,
      }));
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="page-shell min-h-screen text-stone-900">
        <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[rgba(248,243,237,0.84)] backdrop-blur-xl">
          <Container maxWidth="xl" className="!px-5 sm:!px-6 lg:!px-8">
            <div className="flex items-center justify-between gap-4 py-4">
              <a href="#top" className="flex min-w-0 items-center gap-4">
                <img src="/delexpress-logo.svg" alt="DelExpress logo" className="h-11 w-auto sm:h-12" />
              </a>

              <nav className="hidden items-center gap-7 lg:flex">
                {navigationLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm font-bold tracking-[0.02em] text-stone-600 transition hover:text-[#9b3150]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">
                <Button
                  color="inherit"
                  href="#calculator"
                  sx={{ borderRadius: 999, px: 2.6, color: "#3a3238", fontWeight: 700 }}
                >
                  Quick estimate
                </Button>
                <Button
                  variant="contained"
                  href="#contact"
                  endIcon={<EastRoundedIcon />}
                  sx={{
                    borderRadius: 999,
                    px: 2.8,
                    py: 1.15,
                    bgcolor: "#191419",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#9b3150", boxShadow: "none" },
                  }}
                >
                  Book a demo
                </Button>
              </div>

              <IconButton
                onClick={() => setMenuOpen((value) => !value)}
                className="lg:!hidden"
                sx={{ border: "1px solid rgba(190,181,186,0.82)", bgcolor: "#fff" }}
              >
                <MenuRoundedIcon />
              </IconButton>
            </div>

            {menuOpen ? (
              <div className="surface-panel mb-4 space-y-2 rounded-[1rem] p-3 lg:hidden">
                {navigationLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-4 py-3 text-sm font-bold text-stone-600 transition hover:bg-stone-50 hover:text-[#9b3150]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
          </Container>
        </header>

        <main id="top">
          <Container maxWidth="xl" className="!px-5 pb-12 pt-10 sm:!px-6 lg:!px-8 lg:pb-18 lg:pt-16">
            <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
              <div className="pt-2">
                <Chip
                  label="Multi-courier shipping control"
                  sx={{
                    bgcolor: "#fff",
                    border: "1px solid rgba(190,181,186,0.82)",
                    color: "#9b3150",
                    fontWeight: 800,
                  }}
                />
                <Typography
                  variant="h1"
                  className="mt-6 max-w-5xl !text-[3.4rem] !leading-[0.93] !text-stone-950 sm:!text-[4.6rem] lg:!text-[5.8rem]"
                >
                  Ship with better control, faster decisions, and clearer cost visibility.
                </Typography>
                <Typography className="mt-6 max-w-2xl !text-lg !leading-8 !text-stone-600 sm:!text-xl">
                  DelExpress helps teams compare couriers, run dispatch with more confidence, and stay
                  on top of shipment updates from booking through delivery follow-through.
                </Typography>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    variant="contained"
                    endIcon={<EastRoundedIcon />}
                    href="#contact"
                    sx={{
                      borderRadius: 999,
                      px: 3.2,
                      py: 1.4,
                      bgcolor: "#191419",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#9b3150", boxShadow: "none" },
                    }}
                  >
                    Request a walkthrough
                  </Button>
                  <Button
                    variant="outlined"
                    href="#platform"
                    sx={{
                      borderRadius: 999,
                      px: 3.2,
                      py: 1.4,
                      borderColor: "rgba(176,165,170,0.94)",
                      color: "#3d3640",
                      fontWeight: 700,
                    }}
                  >
                    Explore the platform
                  </Button>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {heroMetrics.map((item) => (
                    <div key={item.label} className="surface-panel rounded-[1.1rem] px-5 py-5">
                      <Typography className="!text-3xl !font-extrabold !text-stone-950">
                        {item.value}
                      </Typography>
                      <Typography className="mt-2 !text-sm !leading-6 !text-stone-500">
                        {item.label}
                      </Typography>
                    </div>
                  ))}
                </div>
              </div>

              <div id="calculator" className="hero-panel rounded-[1.6rem] p-5 sm:p-6 lg:sticky lg:top-28">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionEyebrow>Calculator</SectionEyebrow>
                    <Typography className="mt-3 !text-2xl !font-extrabold !leading-tight !text-stone-950">
                      Volumetric weight estimator
                    </Typography>
                  </div>
                  <Chip
                    label={`Divisor ${VOLUMETRIC_DIVISOR}`}
                    sx={{ bgcolor: "#f7e5ea", color: "#9b3150", fontWeight: 800 }}
                  />
                </div>

                <Typography className="mt-4 !text-sm !leading-7 !text-stone-600">
                  Calculate volumetric weight instantly and compare it with actual weight to preview the
                  likely chargeable weight before booking.
                </Typography>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {calculatorFields.map((field) => (
                    <TextField
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      value={calculatorValues[field.name]}
                      onChange={handleCalculatorChange}
                      fullWidth
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "1rem",
                          backgroundColor: "rgba(255,255,255,0.82)",
                        },
                      }}
                    />
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1rem] bg-[#191419] px-5 py-5 text-white">
                    <Typography className="!text-xs !font-bold !uppercase !tracking-[0.2em] !text-stone-400">
                      Volumetric Weight
                    </Typography>
                    <Typography className="mt-3 !text-4xl !font-extrabold !text-white">
                      {volumetricWeight.toFixed(2)} kg
                    </Typography>
                  </div>

                  <div className="rounded-[1rem] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(32,24,30,0.06)]">
                    <Typography className="!text-xs !font-bold !uppercase !tracking-[0.2em] !text-stone-500">
                      Chargeable Weight
                    </Typography>
                    <Typography className="mt-3 !text-4xl !font-extrabold !text-stone-950">
                      {chargeableWeight.toFixed(2)} kg
                    </Typography>
                  </div>
                </div>

                <Divider sx={{ borderColor: "rgba(157,135,145,0.22)", my: 3.5 }} />
                <Typography className="!text-sm !leading-7 !text-stone-500">
                  Formula used: Length × Width × Height / {VOLUMETRIC_DIVISOR}. Chargeable weight is the
                  higher of actual and volumetric weight.
                </Typography>
              </div>
            </div>

            <div className="mt-8 pill-row">
              {shippingPillars.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Container>

          <Container id="platform" maxWidth="xl" className="!px-5 py-8 sm:!px-6 lg:!px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <SectionEyebrow>Platform</SectionEyebrow>
                <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-[3.4rem]">
                  A more useful landing page and a more practical shipping workflow.
                </Typography>
              </div>
              <Typography className="max-w-2xl !text-lg !leading-8 !text-stone-600">
                The page is now led by something operationally useful at the top, then supported by a
                clearer story around courier choice, dispatch control, and post-shipment visibility.
              </Typography>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {platformCards.map((item, index) => (
                <div
                  key={item.title}
                  className={`${index === 1 ? "dark-panel text-white" : "surface-panel"} rounded-[1.3rem] px-6 py-6`}
                >
                  <Typography
                    className={`!text-2xl !font-extrabold !leading-snug ${
                      index === 1 ? "!text-white" : "!text-stone-950"
                    }`}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    className={`mt-4 !text-base !leading-7 ${
                      index === 1 ? "!text-stone-300" : "!text-stone-600"
                    }`}
                  >
                    {item.description}
                  </Typography>
                </div>
              ))}
            </div>
          </Container>

          <Container maxWidth="xl" className="!px-5 py-10 sm:!px-6 lg:!px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <div className="image-frame rounded-[1.6rem] bg-white p-3">
                <img
                  src={mediaAssets.hero}
                  alt="DelExpress warehouse shipping operations"
                  className="h-[340px] w-full rounded-[1.1rem] object-cover sm:h-[460px] lg:h-[560px]"
                />
              </div>

              <div className="space-y-5">
                <SectionEyebrow>Operations</SectionEyebrow>
                <Typography variant="h2" className="!text-4xl !leading-tight !text-stone-950 sm:!text-[3.2rem]">
                  Built for teams that need shipping clarity before and after dispatch.
                </Typography>
                <div className="space-y-4">
                  {operationsPoints.map((item) => (
                    <div key={item.title} className="surface-panel rounded-[1.1rem] px-5 py-5">
                      <Typography className="!text-lg !font-extrabold !text-stone-950">
                        {item.title}
                      </Typography>
                      <Typography className="mt-2 !text-sm !leading-7 !text-stone-600">
                        {item.description}
                      </Typography>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>

          <Container id="visibility" maxWidth="xl" className="!px-5 py-10 sm:!px-6 lg:!px-8 lg:py-14">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
              <div className="space-y-6">
                <div>
                  <SectionEyebrow>Visibility</SectionEyebrow>
                  <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-[3.2rem]">
                    Real movement, cleaner updates, and better alignment across teams.
                  </Typography>
                </div>
                <div className="image-frame rounded-[1.4rem] bg-white p-3">
                  <img
                    src={mediaAssets.visibility}
                    alt="Shipment visibility operations"
                    className="h-[320px] w-full rounded-[1rem] object-cover sm:h-[380px] lg:h-[420px]"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {spotlightCards.map((item) => (
                  <div key={item.title} className="surface-panel overflow-hidden rounded-[1.2rem]">
                    <img src={item.image} alt={item.title} className="h-[220px] w-full object-cover" />
                    <div className="space-y-2 px-5 py-5">
                      <Typography className="!text-lg !font-extrabold !text-stone-950">
                        {item.title}
                      </Typography>
                      <Typography className="!text-sm !leading-7 !text-stone-600">
                        {item.description}
                      </Typography>
                    </div>
                  </div>
                ))}

                <div className="dark-panel rounded-[1.2rem] px-5 py-6 text-white sm:col-span-2">
                  <Typography className="!text-lg !font-extrabold !text-white">
                    DelExpress helps teams stay ahead of cost, service, and delivery exceptions.
                  </Typography>
                  <Typography className="mt-3 !text-base !leading-8 !text-stone-300">
                    The goal is not just shipping faster. It is running shipment decisions, dispatch
                    execution, and ongoing visibility with less friction.
                  </Typography>
                </div>
              </div>
            </div>
          </Container>

          <Container id="faq" maxWidth="xl" className="!px-5 py-10 sm:!px-6 lg:!px-8 lg:py-16">
            <div className="max-w-2xl">
              <SectionEyebrow>FAQ</SectionEyebrow>
              <Typography variant="h2" className="mt-4 !text-4xl !leading-tight !text-stone-950 sm:!text-[3.1rem]">
                Straight answers for teams evaluating the platform.
              </Typography>
            </div>
            <div className="mt-8 space-y-4">
              {faqItems.map((item) => (
                <Accordion
                  key={item.question}
                  disableGutters
                  elevation={0}
                  className="surface-panel !rounded-[1rem] !bg-transparent !shadow-none before:!hidden"
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#9b3150" }} />}>
                    <Typography className="!text-lg !font-extrabold !text-stone-950">
                      {item.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography className="!text-base !leading-7 !text-stone-600">
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          </Container>

          <Container id="contact" maxWidth="xl" className="!px-5 pb-10 pt-4 sm:!px-6 lg:!px-8 lg:pb-14">
            <Box className="dark-panel rounded-[1.6rem] px-7 py-10 text-white sm:px-10 sm:py-12">
              <SectionEyebrow>Contact</SectionEyebrow>
              <Typography variant="h2" className="mt-4 max-w-4xl !text-4xl !leading-tight !text-white sm:!text-[3.3rem]">
                DelExpress for teams that want sharper shipping decisions from the first booking onward.
              </Typography>
              <Typography className="mt-5 max-w-2xl !text-lg !leading-8 !text-stone-300">
                Review the calculator, explore the workflow, and use the page as a stronger first
                impression for the platform.
              </Typography>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  variant="contained"
                  href="mailto:sales@delexpress.com"
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    py: 1.35,
                    bgcolor: "#fff",
                    color: "#191419",
                    "&:hover": { bgcolor: "#efe8eb" },
                  }}
                >
                  Contact DelExpress
                </Button>
                <Button
                  variant="outlined"
                  href="#top"
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    py: 1.35,
                    borderColor: "rgba(255,255,255,0.16)",
                    color: "#fff",
                  }}
                >
                  Back to top
                </Button>
              </div>
            </Box>
          </Container>

          <footer className="border-t border-stone-200/80 bg-[rgba(255,255,255,0.62)]">
            <Container maxWidth="xl" className="!px-5 py-8 sm:!px-6 lg:!px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <img src="/delexpress-logo.svg" alt="DelExpress logo" className="h-10 w-auto" />
                  <Typography className="!max-w-xl !text-sm !leading-6 !text-stone-500">
                    DelExpress © {currentYear}. Courier choice, dispatch execution, shipment visibility,
                    and better cost awareness in one platform.
                  </Typography>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-stone-600">
                  {footerLinks.map((item) => (
                    <a key={item.href} href={item.href} className="transition hover:text-[#9b3150]">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </Container>
          </footer>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default LandingPage;
