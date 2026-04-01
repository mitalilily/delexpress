import { Box, Chip, Container, Typography } from "@mui/material";
import {
  dashboardCapabilities,
  featureList,
  mediaAssets,
  trackingStages,
  workflowSteps,
} from "../../utils/landingContent";
import { fadeUp, LiteralVisual, MotionCard, MotionDiv, SectionHeader } from "./LandingPrimitives";

export default function OperationsSections() {
  const trackingMeta = [
    { tag: "Stage 01", note: "Order captured" },
    { tag: "Stage 02", note: "Pickup coordination" },
    { tag: "Stage 03", note: "Network movement" },
    { tag: "Stage 04", note: "Final mile handoff" },
    { tag: "Stage 05", note: "Order completed" },
  ];

  return (
    <>
      <section id="features" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="Features"
              title="Everything You Need to Manage Shipping"
              description="From rate comparison to tracking and COD visibility, every step is designed to help shipping teams move faster with fewer manual tasks."
              align="center"
            />
          </MotionDiv>

          <div className="feature-rail mt-10">
            {featureList.map((feature, index) => {
              const highlighted = index === 0 || index === 3;

              return (
                <MotionCard
                  key={feature.title}
                  delay={index * 0.05}
                  className={`feature-row ${highlighted ? "feature-row-highlighted" : ""}`}
                >
                  <div className="feature-row-index">0{index + 1}</div>
                  <div className="feature-row-main">
                    <div className="feature-row-top">
                      <Typography variant="h5" className="text-[1.45rem] sm:text-[1.7rem]">
                        {feature.title}
                      </Typography>
                      <div className="feature-row-visual">
                        <LiteralVisual title={feature.title} compact />
                      </div>
                    </div>
                    <Typography className="mt-3 max-w-3xl text-sm leading-7 sm:text-base" sx={{ color: "#615961" }}>
                      {feature.description}
                    </Typography>
                  </div>
                </MotionCard>
              );
            })}
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="How It Works"
              title="Start Shipping in Four Simple Steps"
              description="Your team can move from order intake to delivery tracking without switching tabs or rebuilding the process for every courier."
              align="center"
            />
          </MotionDiv>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <MotionCard
                key={step.title}
                delay={index * 0.06}
                className="surface-panel rounded-[32px] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <Chip
                    label={step.step}
                    sx={{
                      borderRadius: "999px",
                      backgroundColor: "#fff1f5",
                      color: "#9b3150",
                      fontWeight: 700,
                    }}
                  />
                  <LiteralVisual title={step.title} compact />
                </div>
                <Typography variant="h6" className="mt-5 text-xl">
                  {step.title}
                </Typography>
                <Typography className="mt-3 text-sm leading-7" sx={{ color: "#625b63" }}>
                  {step.description}
                </Typography>
              </MotionCard>
            ))}
          </div>

          <div className="flowchart-grid mt-10 lg:grid-cols-[1fr_80px_1fr_80px_1fr_80px_1fr]">
            {workflowSteps.map((step, index) => (
              <Box key={step.title} className="contents">
                <MotionDiv
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="surface-panel rounded-[28px] p-4"
                >
                  <Typography
                    className="text-sm font-semibold uppercase tracking-[0.18em]"
                    sx={{ color: "#9b3150" }}
                  >
                    {step.step}
                  </Typography>
                  <Typography variant="h6" className="mt-3 text-lg">
                    {step.title}
                  </Typography>
                </MotionDiv>
                {index < workflowSteps.length - 1 ? (
                  <>
                    <div className="hidden self-center lg:block">
                      <div className="flow-line" />
                    </div>
                    <div className="lg:hidden">
                      <div className="flow-line" />
                    </div>
                  </>
                ) : null}
              </Box>
            ))}
          </div>
        </Container>
      </section>

      <section id="analytics" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <MotionDiv {...fadeUp} className="surface-panel rounded-[34px] p-4 sm:p-5">
              <div className="rounded-[30px] bg-[#f3e5d7] p-4">
                <img
                  src={mediaAssets.dashboard}
                  alt="Shipping analytics dashboard"
                  loading="lazy"
                  decoding="async"
                  className="h-full min-h-[250px] w-full rounded-[22px] object-cover sm:min-h-[360px] sm:rounded-[26px]"
                />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {["Courier mix", "Cost breakdown", "Zone planning", "Fulfillment trends"].map((label) => (
                  <div key={label} className="rounded-[24px] bg-[#f7efe5] p-4">
                    <Typography className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ab5a43]">
                      Analytics block
                    </Typography>
                    <Typography variant="h6" className="mt-3 text-lg text-[#181318]">
                      {label}
                    </Typography>
                  </div>
                ))}
              </div>
            </MotionDiv>

            <MotionDiv {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <SectionHeader
                eyebrow="Analytics"
                title="Complete Control Over Your Shipments"
                description="Get full visibility into your logistics operations with analytics and shipment tracking tools. Review courier performance, delivery timelines, and shipping costs so you can optimize your fulfillment strategy."
              />

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {dashboardCapabilities.map((item, index) => (
                  <MotionCard
                    key={item.title}
                    delay={index * 0.05}
                    className="surface-panel rounded-[30px] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Chip
                        label={index === 2 ? "Cost overview" : "Overview"}
                        sx={{
                          borderRadius: "999px",
                          backgroundColor: "#f5ebf0",
                          color: "#8b415b",
                          fontWeight: 700,
                        }}
                      />
                      <div className="shrink-0 rounded-[22px] border border-[#ead9df] bg-[#fff7fa] px-2 py-1 shadow-[0_12px_24px_rgba(155,49,80,0.08)]">
                        <LiteralVisual title={item.title} compact />
                      </div>
                    </div>
                    <Typography variant="h6" className="mt-6 pr-2 text-xl">
                      {item.title}
                    </Typography>
                    <Typography className="mt-3 text-sm leading-7" sx={{ color: "#625b63" }}>
                      {item.description}
                    </Typography>
                  </MotionCard>
                ))}
              </div>
            </MotionDiv>
          </div>
        </Container>
      </section>

      <section id="tracking" className="py-14 sm:py-18">
        <Container maxWidth="lg">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="Order Tracking"
              title="Track every stage with one clean timeline"
              description="As the page scrolls, each milestone steps into view so buyers and operations teams can understand exactly where the shipment stands."
              align="center"
            />
          </MotionDiv>

          <div className="timeline-shell mt-12 rounded-[36px] p-5 sm:p-7">
            <div className="timeline-grid">
              <div className="timeline-rail">
                <div className="timeline-line" />
                {trackingStages.map((stage, index) => (
                  <MotionDiv
                    key={stage.title}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{
                      duration: 0.52,
                      delay: index * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="timeline-stage"
                  >
                    <div className="timeline-marker">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </div>

                    <div className="timeline-stage-card">
                      <div className="timeline-stage-top">
                        <div>
                          <Typography className="timeline-stage-tag">
                            {trackingMeta[index]?.tag}
                          </Typography>
                          <Typography variant="h5" className="mt-2 text-[1.35rem] text-[#181318] sm:text-[1.5rem]">
                            {stage.title}
                          </Typography>
                        </div>
                        <Chip
                          label={trackingMeta[index]?.note ?? "Shipment stage"}
                          sx={{
                            borderRadius: "999px",
                            backgroundColor: "#f4ece5",
                            color: "#8d5b46",
                            fontWeight: 700,
                          }}
                        />
                      </div>

                      <Typography className="mt-4 max-w-2xl text-sm leading-7 sm:text-base" sx={{ color: "#625b63" }}>
                        {stage.description}
                      </Typography>
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
