import { Chip, Container, Typography } from "@mui/material";
import {
  courierPartners,
  problemPoints,
  quickToolCards,
  mediaAssets,
} from "../../utils/landingContent";
import {
  fadeUp,
  LiteralVisual,
  MotionCard,
  MotionDiv,
  SectionHeader,
  ToolIcon,
} from "./LandingPrimitives";

export default function CommerceSections() {
  return (
    <>
      <section id="network" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
            <MotionDiv {...fadeUp}>
              <SectionHeader
                eyebrow="Our Courier Network"
                title="Our Courier Network"
                description="Access a wide network of reliable courier partners from one platform. Compare rates, delivery times, and serviceability instantly to choose the best shipping option for every order."
              />

              <Typography className="mt-5 text-base leading-8" sx={{ color: "#625b63" }}>
                Supported couriers include trusted logistics providers used by thousands of
                ecommerce businesses.
              </Typography>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {courierPartners.map((partner, index) => (
                  <MotionCard
                    key={partner.name}
                    delay={index * 0.05}
                    className="surface-panel rounded-[24px] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="grid h-14 w-14 place-items-center rounded-2xl border border-white/70"
                        style={{ backgroundColor: partner.accent }}
                      >
                        <img
                          src={partner.logoUrl}
                          alt={`${partner.name} logo`}
                          className="h-8 w-8 rounded-xl"
                        />
                      </div>
                      <div>
                        <Typography variant="h6" className="text-lg">
                          {partner.name}
                        </Typography>
                        <Typography className="text-sm" sx={{ color: "#6a5f67" }}>
                          Express, surface, COD, and tracking support
                        </Typography>
                      </div>
                    </div>
                  </MotionCard>
                ))}
              </div>
            </MotionDiv>

            <MotionDiv
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="image-frame rounded-[34px] bg-white p-3"
            >
              <img
                src={mediaAssets.network}
                alt="Courier network operations"
                className="h-full min-h-[320px] w-full rounded-[26px] object-cover"
              />
            </MotionDiv>
          </div>
        </Container>
      </section>

      <section id="tools" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="Quick Tools"
              title="Useful checks before every shipment"
              description="Run quick shipping checks in seconds so your team can validate routes, compare options, and estimate cost before creating a label."
              align="center"
            />
          </MotionDiv>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {quickToolCards.map((tool, index) => (
              <MotionCard
                key={tool.title}
                delay={index * 0.07}
                className="tool-card surface-panel rounded-[28px] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#fff1f5] text-[#9b3150]">
                    <ToolIcon icon={tool.icon} size={28} />
                  </div>
                  <LiteralVisual title={tool.title} compact />
                </div>
                <Typography variant="h5" className="mt-6 text-2xl">
                  {tool.title}
                </Typography>
                <Typography
                  className="mt-3 text-sm leading-7 sm:text-base"
                  sx={{ color: "#635b63" }}
                >
                  {tool.description}
                </Typography>
                <Chip
                  label={tool.stat}
                  className="mt-5"
                  sx={{
                    borderRadius: "999px",
                    backgroundColor: "#f6e9ed",
                    color: "#7b3b52",
                    fontWeight: 700,
                  }}
                />
              </MotionCard>
            ))}
          </div>
        </Container>
      </section>

      <section id="problem" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <MotionDiv {...fadeUp}>
              <SectionHeader
                eyebrow="Shipping Challenges"
                title="Shipping Shouldn't Slow Down Your Business"
                description="Managing deliveries across multiple courier services can quickly become complicated. Sellers often waste time comparing shipping rates, switching between dashboards, and manually tracking shipments."
              />

              <div className="mt-9 grid gap-4 sm:grid-cols-2">
                {problemPoints.map((item, index) => (
                  <MotionCard
                    key={item.title}
                    delay={index * 0.05}
                    className="problem-card surface-panel rounded-[26px] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <LiteralVisual title={item.title} compact />
                      <Chip
                        label={`0${index + 1}`}
                        sx={{
                          borderRadius: "999px",
                          backgroundColor: "#fff6e8",
                          color: "#7c5d2f",
                          fontWeight: 700,
                        }}
                      />
                    </div>
                    <Typography variant="h6" className="mt-5 text-xl">
                      {item.title}
                    </Typography>
                    <Typography className="mt-3 text-sm leading-7" sx={{ color: "#625b63" }}>
                      {item.description}
                    </Typography>
                  </MotionCard>
                ))}
              </div>

              <Typography className="mt-7 text-base leading-8" sx={{ color: "#625b63" }}>
                Our platform brings all your shipping operations together in one simple, powerful
                dashboard.
              </Typography>
            </MotionDiv>

            <MotionDiv {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <div className="dark-panel problem-visual rounded-[34px] p-6 text-white sm:p-8">
                <Typography className="text-sm uppercase tracking-[0.25em] text-[#f1c5d1]">
                  One view for every shipment
                </Typography>
                <Typography variant="h3" className="brand-heading-light mt-4 text-3xl sm:text-4xl">
                  Clarity replaces guesswork
                </Typography>
                <Typography className="mt-4 max-w-md text-sm leading-7 text-white/72 sm:text-base">
                  Instead of jumping between courier portals, your team sees shipping cost, lane
                  coverage, delivery updates, and courier performance in one place.
                </Typography>

                <div className="problem-ring" />
                <div className="problem-dot dot-a" />
                <div className="problem-dot dot-b" />
                <div className="problem-dot dot-c" />

                <MotionDiv
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-8 top-28 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/80"
                >
                  Multiple dashboards
                </MotionDiv>
                <MotionDiv
                  animate={{ y: [0, 7, 0] }}
                  transition={{ duration: 4.1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="absolute right-8 top-48 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/80"
                >
                  Manual rate checks
                </MotionDiv>
                <MotionDiv
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  className="absolute bottom-10 left-12 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/80"
                >
                  Scattered tracking
                </MotionDiv>
              </div>
            </MotionDiv>
          </div>
        </Container>
      </section>
    </>
  );
}
