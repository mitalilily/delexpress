import EastRoundedIcon from "@mui/icons-material/EastRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Container,
  Typography,
} from "@mui/material";
import { faqItems, testimonials } from "../../utils/landingContent";
import { fadeUp, MotionDiv, SectionHeader } from "./LandingPrimitives";

export default function SocialSections() {
  return (
    <>
      <section id="testimonials" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="Testimonials"
              title="Trusted by Growing Ecommerce Sellers"
              description="Teams use DelExpress to simplify courier decisions, improve visibility, and make shipping operations easier to manage."
              align="center"
            />
          </MotionDiv>

          <div className="testimonial-marquee mt-10">
            <MotionDiv
              className="testimonial-track"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 22, ease: "linear", repeat: Infinity }}
            >
              {[...testimonials, ...testimonials].map((item, index) => (
                <div
                  key={`${item.author}-${index}`}
                  className="surface-panel w-[320px] shrink-0 rounded-[30px] p-6 sm:w-[380px]"
                >
                  <Typography className="text-base leading-8" sx={{ color: "#2b2428" }}>
                    "{item.quote}"
                  </Typography>
                  <Typography
                    className="mt-5 text-sm font-semibold uppercase tracking-[0.18em]"
                    sx={{ color: "#9b3150" }}
                  >
                    {item.author}
                  </Typography>
                </div>
              ))}
            </MotionDiv>
          </div>
        </Container>
      </section>

      <section id="faq" className="py-14 sm:py-18">
        <Container maxWidth="lg">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="FAQ"
              title="Frequently Asked Questions"
              description="Answers to the most common questions around courier options, pricing, visibility, and getting started."
              align="center"
            />
          </MotionDiv>

          <div className="mt-10 grid gap-4">
            {faqItems.map((item, index) => (
              <MotionDiv
                key={item.question}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
              >
                <Accordion
                  disableGutters
                  sx={{
                    borderRadius: "24px !important",
                    border: "1px solid rgba(186, 170, 177, 0.74)",
                    backgroundColor: "rgba(255,255,255,0.84)",
                    boxShadow: "0 16px 34px rgba(39, 28, 35, 0.06)",
                    "&::before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Typography variant="h6" className="text-lg">
                      {item.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography className="leading-8" sx={{ color: "#625b63" }}>
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </MotionDiv>
            ))}
          </div>
        </Container>
      </section>

      <section id="get-started" className="pt-14 pb-10 sm:pt-18 sm:pb-14">
        <Container maxWidth="xl">
          <MotionDiv {...fadeUp} className="dark-panel rounded-[36px] p-7 text-white sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <Typography className="text-sm uppercase tracking-[0.28em] text-[#f1c5d1]">
                  Get Started
                </Typography>
                <Typography variant="h2" className="brand-heading-light mt-4 text-4xl sm:text-5xl">
                  Simplify Your Shipping Operations
                </Typography>
                <Typography className="mt-5 max-w-2xl text-base leading-8 text-white/74 sm:text-lg">
                  Compare courier rates, automate shipping workflows, and gain full visibility into
                  your deliveries. Start shipping smarter with a single platform designed for
                  ecommerce sellers.
                </Typography>
              </div>

              <div className="flex flex-col items-start gap-4 lg:items-end">
                <Button
                  variant="contained"
                  endIcon={<EastRoundedIcon />}
                  sx={{
                    borderRadius: "999px",
                    px: 3.2,
                    py: 1.35,
                    backgroundColor: "#ffffff",
                    color: "#181318",
                    "&:hover": { backgroundColor: "#f6edf1" },
                  }}
                >
                  Get Started Today
                </Button>
                <Typography className="text-sm text-white/58">
                  No lengthy setup. Start with your next shipment.
                </Typography>
              </div>
            </div>
          </MotionDiv>
        </Container>
      </section>
    </>
  );
}
