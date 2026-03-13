import { AssessmentRounded, HubRounded, Inventory2Rounded, LanguageRounded, LocalShippingRounded, RadarRounded } from "@mui/icons-material";

export const navigationLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Network", href: "#network" },
  { label: "FAQ", href: "#faq" },
];

export const trustMetrics = [
  { value: "180+", label: "Courier connections across priority lanes" },
  { value: "24%", label: "Typical savings through routing logic" },
  { value: "98.9%", label: "Tracking continuity across shipments" },
];

export const platformHighlights = [
  {
    title: "Rate logic across multiple courier partners",
    description: "Evaluate serviceability, margin, promised SLA, and delivery experience before every shipment moves into allocation.",
    icon: HubRounded,
  },
  {
    title: "One operating layer for shipping teams",
    description: "Manage order movement, labels, manifests, tracking, and delivery exceptions without splitting work between disconnected tools.",
    icon: Inventory2Rounded,
  },
  {
    title: "Branded visibility after dispatch",
    description: "Deliver cleaner customer updates, branded tracking, and stronger NDR handling from the same aggregator environment.",
    icon: RadarRounded,
  },
];

export const capabilityColumns = [
  {
    title: "Operational control",
    items: [
      "Rate comparison and courier recommendation",
      "Shipment booking and label generation",
      "Manifest and pickup coordination",
    ],
  },
  {
    title: "Post-shipment visibility",
    items: [
      "Tracking synchronization across partners",
      "NDR and RTO monitoring workflows",
      "Support-ready delivery exception timelines",
    ],
  },
  {
    title: "Commercial intelligence",
    items: [
      "Courier performance benchmarking",
      "Zone and lane level cost visibility",
      "Service quality and turnaround reporting",
    ],
  },
];

export const workflowSteps = [
  {
    step: "01",
    title: "Consolidate order flow",
    description: "Create one control layer for courier selection, booking, and shipment movement across channels.",
  },
  {
    step: "02",
    title: "Apply routing discipline",
    description: "Use aggregator logic to assign the right partner based on cost, serviceability, and promised experience.",
  },
  {
    step: "03",
    title: "Track delivery performance",
    description: "Keep support, operations, and leadership aligned on shipment status, exceptions, and final outcomes.",
  },
];

export const networkPanels = [
  {
    title: "Aggregator position",
    description: "DelExpress is presented as a logistics control platform, not just another courier booking screen.",
    icon: LocalShippingRounded,
  },
  {
    title: "Buyer expectation",
    description: "The page is written for operations teams and commerce brands evaluating shipping control, not consumer parcel users.",
    icon: LanguageRounded,
  },
  {
    title: "Decision visibility",
    description: "Performance, cost, and execution reporting are framed as core value rather than side features.",
    icon: AssessmentRounded,
  },
];

export const faqItems = [
  {
    question: "What does DelExpress represent?",
    answer: "DelExpress is positioned as an aggregator platform for brands that need better courier selection, shipment execution, and post-shipment visibility from one commercial system.",
  },
  {
    question: "Why is the design more restrained now?",
    answer: "Aggregator websites need to feel credible and deliverable. A more controlled layout, cleaner typography, and fewer decorative effects make the product look more serious.",
  },
  {
    question: "Why are the visuals limited?",
    answer: "The imagery is used only where it supports the narrative. That keeps the page closer to a real business website and further from an AI-generated landing page style.",
  },
];
