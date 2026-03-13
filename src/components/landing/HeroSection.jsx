import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { Button, Chip, Container, Typography } from "@mui/material";
import {
  heroContent,
  heroHighlights,
  heroQuickTools,
  mediaAssets,
} from "../../utils/landingContent";
import { fadeUp, LiteralVisual, MotionCard, MotionDiv, ToolIcon } from "./LandingPrimitives";

export default function HeroSection() {
  return (
    <section className="pt-8 pb-14 sm:pt-12 sm:pb-20">
      <Container maxWidth="xl">
        <div className="grid gap-8 xl:grid-cols-[1.06fr_0.94fr]">
          <MotionDiv {...fadeUp} className="hero-panel rounded-[28px] p-5 sm:rounded-[34px] sm:p-8 lg:p-10">
            <div className="pill-row">
              <span>Rate comparison</span>
              <span>Shipment tracking</span>
              <span>Courier automation</span>
            </div>

            <Typography
              variant="h1"
              className="brand-heading mt-6 max-w-4xl text-4xl leading-[1.02] sm:text-6xl lg:text-[4.8rem]"
            >
              {heroContent.headline}
            </Typography>

            <Typography
              className="mt-6 max-w-2xl text-base leading-8 sm:text-lg"
              sx={{ color: "#5d5861" }}
            >
              {heroContent.subheading}
            </Typography>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                component="a"
                href="#get-started"
                variant="contained"
                endIcon={<EastRoundedIcon />}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  px: 3.1,
                  py: 1.35,
                  backgroundColor: "#181318",
                  "&:hover": { backgroundColor: "#30262e" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {heroContent.primaryCta}
              </Button>
              <Button
                component="a"
                href="#calculator"
                variant="outlined"
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  px: 3.1,
                  py: 1.35,
                  borderColor: "rgba(155, 49, 80, 0.32)",
                  color: "#181318",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {heroContent.secondaryCta}
              </Button>
            </div>

            <Typography className="mt-6 text-sm sm:text-base" sx={{ color: "#6a5f67" }}>
              {heroContent.trustLine}
            </Typography>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {heroQuickTools.map((tool, index) => (
                <MotionCard
                  key={tool.title}
                  delay={index * 0.06}
                  className="tool-card surface-panel rounded-[26px] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1f5] text-[#9b3150]">
                      <ToolIcon icon={tool.icon} size={24} />
                    </div>
                    <Chip
                      label={tool.metric}
                      sx={{
                        borderRadius: "999px",
                        backgroundColor: "#fff4df",
                        color: "#73552f",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  <Typography variant="h6" className="mt-4 text-xl">
                    {tool.title}
                  </Typography>
                  <Typography className="mt-2 text-sm leading-7" sx={{ color: "#625b63" }}>
                    {tool.description}
                  </Typography>
                </MotionCard>
              ))}
            </div>
          </MotionDiv>

          <MotionDiv
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="hero-panel rounded-[28px] p-4 sm:rounded-[34px] sm:p-6"
          >
            <div className="image-frame rounded-[30px] bg-white">
              <img
                src={mediaAssets.hero}
                alt="DelExpress shipping operations dashboard preview"
                className="h-[260px] w-full object-cover sm:h-[420px]"
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {heroHighlights.map((item, index) => (
                <MotionCard
                  key={item.label}
                  delay={0.12 + index * 0.05}
                  className="surface-panel rounded-[26px] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <LiteralVisual title={item.visualTitle} compact />
                    <div className="text-right">
                      <Typography variant="h4" className="text-2xl">
                        {item.value}
                      </Typography>
                      <Typography className="text-sm" sx={{ color: "#6b6068" }}>
                        {item.label}
                      </Typography>
                    </div>
                  </div>
                </MotionCard>
              ))}
            </div>
          </MotionDiv>
        </div>
      </Container>
    </section>
  );
}
