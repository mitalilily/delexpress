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
              className="image-frame rounded-[28px] bg-white p-3 sm:rounded-[34px]"
            >
              <img
                src={mediaAssets.network}
                alt="Courier network operations"
                loading="lazy"
                decoding="async"
                className="h-full min-h-[240px] w-full rounded-[22px] object-cover sm:min-h-[320px] sm:rounded-[26px]"
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
              <div className="dark-panel rounded-[28px] p-5 text-white sm:rounded-[34px] sm:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-lg">
                      <Typography className="text-sm uppercase tracking-[0.25em] text-[#f1c5d1]">
                        One view for every shipment
                      </Typography>
                      <Typography
                        variant="h3"
                        className="brand-heading-light mt-4 text-3xl sm:text-4xl"
                      >
                        Clarity replaces guesswork
                      </Typography>
                      <Typography className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
                        Replace scattered courier tools with one structured workspace for rates,
                        tracking, and delivery performance.
                      </Typography>
                    </div>
                    <div className="sm:pt-2">
                      <LiteralVisual title="Shipment Overview" compact />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      "Rate comparison",
                      "Tracking updates",
                      "Courier performance",
                    ].map((label) => (
                      <div
                        key={label}
                        className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4"
                      >
                        <Typography className="text-xs uppercase tracking-[0.18em] text-white/45">
                          Live view
                        </Typography>
                        <Typography className="mt-3 text-base font-semibold text-white">
                          {label}
                        </Typography>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
                    <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                      <div className="grid gap-3">
                        {[
                          "Compare rates without switching dashboards",
                          "Check active shipment status in one place",
                          "Review delivery trends before choosing a partner",
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-3">
                            <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[#56c0a5]" />
                            <Typography className="text-sm leading-7 text-white/72">
                              {item}
                            </Typography>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-3">
                        {[
                          "Unified dashboard",
                          "Lower manual work",
                          "Faster decisions",
                        ].map((item) => (
                          <div
                            key={item}
                            className="rounded-full border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/80"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </MotionDiv>
          </div>
        </Container>
      </section>
    </>
  );
}
