import { motion } from "framer-motion";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Typography } from "@mui/material";

export const MotionDiv = motion.div;

export const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const toolIconMap = {
  calculator: CurrencyRupeeRoundedIcon,
  comparison: CompareArrowsRoundedIcon,
  pincode: PlaceRoundedIcon,
};

const cardVisualMap = {
  "Too Many Courier Platforms": [DashboardRoundedIcon, HubRoundedIcon],
  "Unclear Shipping Costs": [CurrencyRupeeRoundedIcon, CompareArrowsRoundedIcon],
  "Limited Visibility on Deliveries": [LocalShippingRoundedIcon, RouteRoundedIcon],
  "No Data for Better Decisions": [InsightsRoundedIcon, TimelineRoundedIcon],
  "Courier Rate Comparison": [CompareArrowsRoundedIcon, CurrencyRupeeRoundedIcon],
  "Automated Shipping Labels": [ReceiptLongRoundedIcon, Inventory2RoundedIcon],
  "Real-Time Shipment Tracking": [RouteRoundedIcon, AccessTimeRoundedIcon],
  "Smart Courier Selection": [AutoAwesomeRoundedIcon, VerifiedRoundedIcon],
  "Bulk Order Processing": [Inventory2RoundedIcon, DashboardRoundedIcon],
  "COD Management": [CurrencyRupeeRoundedIcon, AccessTimeRoundedIcon],
  "Shipment Overview": [Inventory2RoundedIcon, LocalShippingRoundedIcon],
  "Courier Performance Analytics": [InsightsRoundedIcon, TimelineRoundedIcon],
  "Cost Tracking": [CurrencyRupeeRoundedIcon, AccessTimeRoundedIcon],
  "Delivery Insights": [RouteRoundedIcon, InsightsRoundedIcon],
  "Add Your Orders": [Inventory2RoundedIcon, DashboardRoundedIcon],
  "Compare Courier Options": [CompareArrowsRoundedIcon, HubRoundedIcon],
  "Generate Shipping Label": [ReceiptLongRoundedIcon, VerifiedRoundedIcon],
  "Track and Manage Deliveries": [RouteRoundedIcon, AccessTimeRoundedIcon],
};

export function SectionHeader({ eyebrow, title, description, align = "left" }) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <Typography
        className="mb-3 text-[0.74rem] font-semibold uppercase tracking-[0.28em]"
        sx={{ color: "#9b3150" }}
      >
        {eyebrow}
      </Typography>
      <Typography
        variant="h2"
        className={`brand-heading text-4xl sm:text-5xl ${centered ? "mx-auto" : ""}`}
      >
        {title}
      </Typography>
      {description ? (
        <Typography className="mt-4 text-base leading-8 sm:text-lg" sx={{ color: "#625b63" }}>
          {description}
        </Typography>
      ) : null}
    </div>
  );
}

export function ToolIcon({ icon, size = 22 }) {
  const Icon = toolIconMap[icon] ?? LocalShippingRoundedIcon;

  return <Icon sx={{ fontSize: size }} />;
}

export function LiteralVisual({ title, compact = false }) {
  const [PrimaryIcon, SecondaryIcon] = cardVisualMap[title] ?? [
    LocalShippingRoundedIcon,
    VerifiedRoundedIcon,
  ];
  const primarySize = compact ? 54 : 72;
  const secondarySize = compact ? 42 : 54;

  return (
    <div className={`relative ${compact ? "h-20 w-24" : "h-24 w-28"}`}>
      <MotionDiv
        animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 top-5 grid place-items-center rounded-[24px] border border-white/70 bg-white/90 shadow-[0_16px_34px_rgba(42,26,34,0.12)]"
        style={{ width: primarySize, height: primarySize, color: "#9b3150", backdropFilter: "blur(8px)" }}
      >
        <PrimaryIcon sx={{ fontSize: compact ? 28 : 34 }} />
      </MotionDiv>
      <MotionDiv
        animate={{ y: [0, 7, 0], x: [0, 4, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
        className="absolute bottom-0 right-0 grid place-items-center rounded-full border border-[#f0d2db] bg-[#f8e7ed] shadow-[0_10px_30px_rgba(155,49,80,0.18)]"
        style={{ width: secondarySize, height: secondarySize, color: "#181318" }}
      >
        <SecondaryIcon sx={{ fontSize: compact ? 20 : 24 }} />
      </MotionDiv>
      <MotionDiv
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-x-2 bottom-1 h-5 rounded-full blur-md"
        style={{ background: "rgba(155, 49, 80, 0.18)" }}
      />
    </div>
  );
}

export function MotionCard({ children, className = "", delay = 0 }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className={className}
    >
      {children}
    </MotionDiv>
  );
}
