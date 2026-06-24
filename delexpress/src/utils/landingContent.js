const defaultClientAppUrl = 'https://app.expressopro.in/'
const defaultMarketingSiteUrl = 'https://expressopro.in/'

export const clientAppUrl = import.meta.env.VITE_CLIENT_APP_URL?.trim() || defaultClientAppUrl
export const marketingSiteUrl =
  import.meta.env.VITE_MARKETING_SITE_URL?.trim() || defaultMarketingSiteUrl
export const siteRoutes = {
  home: '/',
  features: '/features',
  tools: '/tools',
  tracking: '/tracking',
  toolsTracking: '/tools/order_tracking',
  faq: '/faq',
  legal: '/legal',
}
export const orderTrackingUrl = siteRoutes.tracking

export const navigationLinks = [
  {
    label: 'Features',
    href: siteRoutes.features,
    children: [
      { label: 'Shipping Features', href: siteRoutes.features },
      { label: 'Tools & Serviceability', href: siteRoutes.tools },
      { label: 'FAQs & Legal', href: siteRoutes.faq },
    ],
  },
  { label: 'Track Order', href: orderTrackingUrl },
  { label: 'Tools', href: siteRoutes.tools },
  { label: 'FAQ', href: siteRoutes.faq },
  { label: 'Legal', href: siteRoutes.legal },
]

export const heroContent = {
  eyebrow: 'Shipping platform for ecommerce sellers',
  headline: 'Ship Smarter. Save More on Every Order.',
  subheading:
    'Compare courier partners, automate shipping, and track every order from a single dashboard. Built for growing ecommerce sellers who want faster deliveries and lower shipping costs.',
  primaryCta: 'Start Shipping',
  secondaryCta: 'Calculate Shipping Cost',
  trustLine: 'Built for growing ecommerce brands and independent sellers across India.',
}

export const heroStats = [
  { value: '6+', label: 'Courier partners' },
  { value: '15%', label: 'Average shipping savings' },
  { value: '<10 min', label: 'To book your first shipment' },
]

export const heroSpotlightCards = [
  {
    eyebrow: 'Sample route',
    title: 'Delhi to Mumbai',
    value: 'Rs 78',
    detail: 'Express lane, estimated in 2-3 days',
    tone: 'warm',
  },
  {
    eyebrow: 'Platform view',
    title: 'Shipment overview',
    value: '6+',
    detail: 'Courier options available in one dashboard',
    tone: 'cool',
  },
]

export const heroQuickTools = [
  {
    icon: 'calculator',
    title: 'Shipping Cost Calculator',
    description: 'Estimate shipping spend before you create a shipment.',
    metric: 'Quote preview',
  },
  {
    icon: 'comparison',
    title: 'Courier Comparison',
    description: 'Compare serviceability, rates, and speed in one view.',
    metric: '6 partners',
  },
  {
    icon: 'pincode',
    title: 'Pincode Serviceability Check',
    description: 'Check whether a delivery lane is covered before dispatch.',
    metric: 'Route check',
  },
]

export const heroHighlights = [
  { value: '6+', label: 'Courier partners', visualTitle: 'Courier Rate Comparison' },
  { value: '1', label: 'Tracking dashboard', visualTitle: 'Shipment Tracking' },
  { value: '1', label: 'Unified dashboard', visualTitle: 'Shipment Overview' },
]

export const courierPartners = [
  {
    name: 'Delhivery',
    logoUrl: 'https://www.google.com/s2/favicons?domain=delhivery.com&sz=128',
    accent: '#FFE9ED',
  },
  {
    name: 'Blue Dart',
    logoUrl: 'https://www.google.com/s2/favicons?domain=bluedart.com&sz=128',
    accent: '#FFF1D7',
  },
  {
    name: 'DTDC',
    logoUrl: 'https://www.google.com/s2/favicons?domain=dtdc.in&sz=128',
    accent: '#EAF1FF',
  },
  {
    name: 'Xpressbees',
    logoUrl: 'https://www.google.com/s2/favicons?domain=xpressbees.com&sz=128',
    accent: '#FFF3E6',
  },
  {
    name: 'Ecom Express',
    logoUrl: 'https://www.google.com/s2/favicons?domain=ecomexpress.in&sz=128',
    accent: '#ECFFF1',
  },
  {
    name: 'Shadowfax',
    logoUrl: 'https://www.google.com/s2/favicons?domain=shadowfax.in&sz=128',
    accent: '#F0EDFF',
  },
]

export const problemPoints = [
  {
    title: 'Too Many Courier Platforms',
    description: 'Managing separate dashboards for each courier wastes valuable time.',
  },
  {
    title: 'Unclear Shipping Costs',
    description:
      'Comparing courier prices manually makes it difficult to find the most cost-effective option.',
  },
  {
    title: 'Limited Visibility on Deliveries',
    description:
      'Tracking shipments across different platforms leads to confusion and missed updates.',
  },
  {
    title: 'No Data for Better Decisions',
    description:
      "Without proper analytics, it's hard to know which courier performs best for your business.",
  },
]

export const featureList = [
  {
    title: 'Courier Rate Comparison',
    description:
      'Compare shipping prices from multiple courier partners and choose the most cost-effective option.',
  },
  {
    title: 'Automated Shipping Labels',
    description: 'Generate shipping labels and schedule pickups in seconds without manual work.',
  },
  {
    title: 'Shipment Tracking',
    description:
      'Track every shipment from one dashboard and keep customers informed about delivery progress.',
  },
  {
    title: 'Smart Courier Selection',
    description:
      'Automatically choose the best courier based on delivery speed, serviceability, and cost.',
  },
  {
    title: 'Bulk Order Processing',
    description:
      'Upload and process multiple orders at once to save time during peak sales periods.',
  },
  {
    title: 'COD Management',
    description:
      'Track cash-on-delivery payments and manage remittances with complete transparency.',
  },
  {
    title: 'Pincode Serviceability Check',
    description:
      'Verify pickup and delivery coverage before booking so your team can avoid failed routing at the last step.',
  },
  {
    title: 'Instant Shipping Calculator',
    description:
      'Estimate shipping cost using weight, dimensions, payment mode, and route details before creating the shipment.',
  },
]

export const workflowSteps = [
  {
    step: 'Step 1',
    title: 'Add Your Orders',
    description: 'Import orders from your ecommerce store or upload them directly to the platform.',
  },
  {
    step: 'Step 2',
    title: 'Compare Courier Options',
    description:
      'View shipping rates, delivery timelines, and courier availability for each order.',
  },
  {
    step: 'Step 3',
    title: 'Generate Shipping Label',
    description:
      'Select the courier that works best and create your shipping label without extra steps.',
  },
  {
    step: 'Step 4',
    title: 'Track and Manage Deliveries',
    description: 'Monitor shipment progress and delivery performance through a unified dashboard.',
  },
]

export const quickToolCards = [
  {
    icon: 'calculator',
    title: 'Shipping Cost Calculator',
    description:
      'Estimate rates using package weight, pickup pincode, and delivery pincode before you book.',
    stat: 'Estimate preview',
  },
  {
    icon: 'comparison',
    title: 'Courier Comparison',
    description:
      'Review shipping prices, expected delivery timelines, and courier availability side by side.',
    stat: 'Compare faster',
  },
  {
    icon: 'pincode',
    title: 'Pincode Serviceability Check',
    description:
      'Check if a courier can service a route before committing a shipment to that delivery partner.',
    stat: 'Lane coverage',
  },
]

export const calculatorPresets = [
  {
    label: 'Light parcel',
    values: {
      packageWeight: '0.5',
      pickupPincode: '110001',
      deliveryPincode: '400001',
      orderAmount: '999',
      paymentType: 'prepaid',
      length: '10',
      breadth: '10',
      height: '10',
    },
  },
  {
    label: 'Regional shipment',
    values: {
      packageWeight: '1.2',
      pickupPincode: '560001',
      deliveryPincode: '600001',
      orderAmount: '1499',
      paymentType: 'prepaid',
      length: '18',
      breadth: '14',
      height: '10',
    },
  },
  {
    label: 'Heavy COD order',
    values: {
      packageWeight: '2.5',
      pickupPincode: '122001',
      deliveryPincode: '700001',
      orderAmount: '2499',
      paymentType: 'cod',
      length: '24',
      breadth: '20',
      height: '14',
    },
  },
]

export const shippingFields = [
  { key: 'packageWeight', label: 'Package Weight (kg)', placeholder: '0.5' },
  { key: 'pickupPincode', label: 'Pickup Pincode', placeholder: '110001' },
  { key: 'deliveryPincode', label: 'Delivery Pincode', placeholder: '400001' },
]

export const calculatorHighlights = [
  { label: 'Estimated Cost', title: 'Cost Tracking' },
  { label: 'Shipping Zone', title: 'Compare Courier Options' },
  { label: 'Expected Delivery', title: 'Track and Manage Deliveries' },
]

export const trackingStages = [
  {
    title: 'Booked',
    description: 'Your order has been confirmed and entered into the shipping queue.',
  },
  {
    title: 'Pending Pickup',
    description: 'Pickup is scheduled and the courier partner is preparing collection.',
  },
  {
    title: 'In Transit',
    description: 'The shipment is moving through the line-haul and sorting network.',
  },
  {
    title: 'Out for Delivery',
    description: 'The parcel is with the delivery executive and heading to the customer.',
  },
  {
    title: 'Delivered',
    description: 'Delivery is complete and the shipment status is marked as delivered.',
  },
]

export const testimonials = [
  {
    quote:
      'Using this platform helped us reduce shipping costs while improving delivery reliability. Managing orders across couriers is now much easier.',
    author: 'Ecommerce Store Owner',
  },
  {
    quote:
      'The courier comparison feature saves us hours every week. We can quickly choose the best delivery partner for every order.',
    author: 'D2C Brand Founder',
  },
  {
    quote:
      'Having all shipment tracking in one dashboard has made logistics management far more efficient for our team.',
    author: 'Online Marketplace Seller',
  },
]

export const faqItems = [
  {
    question: 'Which courier partners are available on the platform?',
    answer:
      'We work with multiple trusted courier providers such as Delhivery, Blue Dart, DTDC, and other partners to give sellers a wide range of shipping options based on price, delivery time, and serviceability.',
  },
  {
    question: 'Do I need a website or store integration to use the platform?',
    answer: 'You can connect your ecommerce store or upload orders manually through the dashboard.',
  },
  {
    question: 'How are shipping costs calculated?',
    answer:
      'Shipping rates depend on package weight, pickup and delivery locations, and the courier service selected.',
  },
  {
    question: 'Can I track all shipments from one dashboard?',
    answer:
      'Yes. All shipments created through the platform can be tracked in real time from a centralized dashboard.',
  },
  {
    question: 'Is there a minimum number of shipments required?',
    answer:
      'The platform is designed to support both small sellers and growing businesses without strict shipment limits.',
  },
]

export const footerGroups = [
  {
    title: 'Product',
    links: ['Features', 'Shipping Calculator', 'Courier Partners', 'Pricing'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Careers', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Help Center', 'Shipping Guide', 'API Documentation'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service'],
  },
  {
    title: 'Contact',
    links: ['Phone: +91 8200661530'],
  },
]

export const footerMeta = {
  address: '',
  supportHours: '',
  contactNumber: '+91 8200661530',
}

export const privacyPolicyHighlights = [
  'We collect only the information needed to create shipments, manage accounts, support deliveries, and improve platform performance.',
  'Order details, contact information, and operational data are used to process shipments, provide customer support, and maintain service quality.',
  'We do not sell merchant or customer personal information. Data may be shared only with logistics, payment, or compliance partners when needed to deliver the service.',
  'Reasonable administrative and technical safeguards are used to protect stored account and shipment data.',
]

export const termsOfServiceHighlights = [
  'By using ExpressoPro, merchants agree to provide accurate shipment, contact, and payment information for every order created on the platform.',
  'Courier availability, delivery timelines, and pricing can vary by route, serviceability, weight, and partner policies.',
  'Users are responsible for ensuring prohibited, restricted, or incorrectly declared shipments are not handed over through the platform.',
  'Continued use of the platform means acceptance of updated policies, operational guidelines, and service terms published by ExpressoPro.',
]

export const mediaAssets = {
  hero: 'https://images.pexels.com/photos/6170405/pexels-photo-6170405.jpeg?auto=compress&cs=tinysrgb&w=1600',
  network:
    'https://images.pexels.com/photos/6169643/pexels-photo-6169643.jpeg?auto=compress&cs=tinysrgb&w=1400',
  dashboard:
    'https://images.pexels.com/photos/5025635/pexels-photo-5025635.jpeg?auto=compress&cs=tinysrgb&w=1400',
}
