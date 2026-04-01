import EastRoundedIcon from "@mui/icons-material/EastRounded";
import SouthEastRoundedIcon from "@mui/icons-material/SouthEastRounded";
import { Button, Chip, Container, Typography } from "@mui/material";
import {
  clientAppUrl,
  heroContent,
  heroQuickTools,
  heroSpotlightCards,
  heroStats,
  mediaAssets,
} from "../../utils/landingContent";
import { fadeUp, LiteralVisual, MotionCard, MotionDiv, ToolIcon } from "./LandingPrimitives";

export default function HeroSection() {
  return (
    <section className="pt-8 pb-14 sm:pt-12 sm:pb-20">
      <Container maxWidth="xl">
        <div className="hero-stage">
          <MotionDiv {...fadeUp} className="hero-copy-column">
            <div className="hero-kicker">{heroContent.eyebrow}</div>

            <div className="pill-row">
              <span>Rate comparison</span>
              <span>Shipment tracking</span>
              <span>Courier automation</span>
            </div>

            <Typography
              variant="h1"
              className="brand-heading mt-7 max-w-4xl text-5xl leading-[0.98] sm:text-[4.8rem] lg:text-[5.2rem]"
            >
              {heroContent.headline}
            </Typography>

            <Typography className="hero-intro mt-6 max-w-2xl text-base leading-8 sm:text-lg">
              {heroContent.subheading}
            </Typography>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                component="a"
                href={clientAppUrl}
                variant="contained"
                endIcon={<EastRoundedIcon />}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  px: 3.6,
                  py: 1.45,
                  backgroundColor: "#151216",
                  boxShadow: "0 14px 30px rgba(21,18,22,0.18)",
                  "&:hover": { backgroundColor: "#2c242a" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {heroContent.primaryCta}
              </Button>
              <Button
                component="a"
                href="#calculator"
                variant="text"
                endIcon={<SouthEastRoundedIcon />}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  px: 0.4,
                  py: 1.35,
                  color: "#1d171c",
                  fontWeight: 700,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {heroContent.secondaryCta}
              </Button>
            </div>

            <Typography className="mt-6 text-sm sm:text-base" sx={{ color: "#5f5760" }}>
              {heroContent.trustLine}
            </Typography>

            <div className="hero-stats mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div key={item.label} className="hero-stat-card rounded-[26px] px-5 py-5">
                  <Typography variant="h4" className="text-3xl sm:text-[2.2rem]">
                    {item.value}
                  </Typography>
                  <Typography className="mt-2 text-sm leading-6" sx={{ color: "#665f67" }}>
                    {item.label}
                  </Typography>
                </div>
              ))}
            </div>
          </MotionDiv>

          <MotionDiv
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="hero-showcase-column"
          >
            <div className="hero-showcase-main">
              <div className="hero-showcase-copy">
                <Typography className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[#b45b45]">
                  Dashboard preview
                </Typography>
                <Typography variant="h4" className="mt-4 text-3xl text-[#181318]">
                  One clean surface for quotes, routes, and fulfillment decisions
                </Typography>
              </div>

              <div className="hero-visual-shell">
                <div className="hero-grid-glow" />
                <div className="image-frame rounded-[30px] bg-white">
                  <img
                    src={mediaAssets.hero}
                    alt="Delexpress shipping operations dashboard preview"
                    decoding="async"
                    fetchPriority="high"
                    className="h-[260px] w-full object-cover sm:h-[420px]"
                  />
                </div>

                <div className="hero-floating-card left-card">
                  <Typography className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#8f3d59]">
                    {heroSpotlightCards[0].eyebrow}
                  </Typography>
                  <Typography variant="h6" className="mt-3 text-lg">
                    {heroSpotlightCards[0].title}
                  </Typography>
                  <Typography className="mt-3 text-3xl font-semibold text-[#181318]">
                    {heroSpotlightCards[0].value}
                  </Typography>
                  <Typography className="mt-2 text-sm leading-6 text-[#635b63]">
                    {heroSpotlightCards[0].detail}
                  </Typography>
                </div>

                <div className="hero-floating-card right-card">
                  <Typography className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#2c7f6f]">
                    {heroSpotlightCards[1].eyebrow}
                  </Typography>
                  <Typography variant="h6" className="mt-3 text-lg">
                    {heroSpotlightCards[1].title}
                  </Typography>
                  <Typography className="mt-3 text-3xl font-semibold text-[#181318]">
                    {heroSpotlightCards[1].value}
                  </Typography>
                  <Typography className="mt-2 text-sm leading-6 text-[#635b63]">
                    {heroSpotlightCards[1].detail}
                  </Typography>
                </div>
              </div>
            </div>

            <div className="hero-showcase-caption mt-5">
              <div className="hero-showcase-line" />
              <Typography className="text-sm uppercase tracking-[0.22em] text-[#7a6a73]">
                Shipping aggregator interface for courier comparison, label creation, and order
                tracking.
              </Typography>
            </div>
          </MotionDiv>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {heroQuickTools.map((tool, index) => (
            <MotionCard
              key={tool.title}
              delay={0.18 + index * 0.06}
              className="hero-tool-panel rounded-[30px] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#141116] text-white shadow-[0_12px_28px_rgba(20,17,22,0.2)]">
                  <ToolIcon icon={tool.icon} size={28} />
                </div>
                <Chip
                  label={tool.metric}
                  sx={{
                    borderRadius: "999px",
                    backgroundColor: "#f8ecdf",
                    color: "#85582e",
                    fontWeight: 700,
                  }}
                />
              </div>
              <Typography variant="h5" className="mt-5 text-2xl">
                {tool.title}
              </Typography>
              <Typography className="mt-3 text-sm leading-7 sm:text-base" sx={{ color: "#645c65" }}>
                {tool.description}
              </Typography>
            </MotionCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
