import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MdContentCopy } from 'react-icons/md'
import { SiShopify } from 'react-icons/si'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useIntegrateShopify } from '../../hooks/useIntegrations'
import { toast } from '../UI/Toast'

interface IShopifyIntegrationProps {
  fullWidth?: boolean
  forOnboarding?: boolean
  fromChannelList?: boolean
}

export interface ShopifyForm {
  id?: string
  storeUrl: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  webhookSecret?: string
  apiSecretKey?: string
  name?: string
  adminApiAccessToken?: string
  hostName?: string
  domain?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
  userId?: string
  status?: 'active' | 'inactive'
  settings?: {
    fulfillTrigger?: string
    customerNotifyOnFulfill?: string
    orderTagsToFetch?: string
    codTags?: string
    prepaidTags?: string
    autoUpdateShipmentStatus?: boolean
    autoCancelOrders?: boolean
    markCodPaidOnDelivery?: boolean
  }
}

const SHOPIFY_APP_URL = 'https://app.expressopro.in'
const SHOPIFY_REDIRECT_URLS = [
  'https://api.expressopro.in/api/integrations/shopify/oauth/callback',
  'https://api.expressopro.in/api/auth/shopify/callback',
]
const SHOPIFY_ORDER_WEBHOOK_URL =
  'https://api.expressopro.in/api/webhooks/shopify/order-created'
const SHOPIFY_TRACKING_URL = 'https://app.expressopro.in/tracking?awb=AWB_NUMBER'

const SHOPIFY_SCOPES = [
  'read_orders',
  'write_orders',
  'read_products',
  'read_customers',
  'read_fulfillments',
  'write_fulfillments',
  'read_merchant_managed_fulfillment_orders',
  'write_merchant_managed_fulfillment_orders',
  'read_third_party_fulfillment_orders',
  'write_third_party_fulfillment_orders',
]

const SHOPIFY_REQUIRED_SCOPES = SHOPIFY_SCOPES.join(', ')
const SHOPIFY_REDIRECT_URLS_TEXT = SHOPIFY_REDIRECT_URLS.join('\n')
const SHOPIFY_DATA_USE_ANSWER =
  'ExpressoPro uses Shopify order, customer, phone, and shipping address data to import unbooked orders from the connected store, create shipping labels, book courier pickups, update fulfillment tracking, and support shipment/customer-service queries.'

const setupSections = [
  {
    title: 'Open The Store',
    steps: [
      'Login to Shopify Admin for the exact store you want to connect.',
      'Click Settings from the bottom-left sidebar.',
      'Open Apps and sales channels, then click Develop apps.',
      'Click Build apps in Dev Dashboard. If Shopify asks, allow custom app development.',
    ],
  },
  {
    title: 'Create The App',
    steps: [
      'In Dev Dashboard, open Apps and click Create app.',
      'Set App name to ExpressoPro.',
      'Open the app, then go to Settings to confirm the app details.',
      'Use the same Shopify store when Shopify asks where this custom app will be installed.',
    ],
  },
  {
    title: 'Configure API Access',
    steps: [
      'Open Versions, then click Create version.',
      `In App URL, paste ${SHOPIFY_APP_URL}.`,
      'In Redirect URLs, paste both redirect URLs shown in the URLs box below.',
      'In Admin API access scopes, select every scope shown in the scopes box below, then save/release the version.',
    ],
  },
  {
    title: 'Distribution',
    steps: [
      'Open Distribution or App distribution.',
      'Choose Custom distribution.',
      'Enter the same store domain, for example your-store.myshopify.com.',
      'Generate the install link, open it, and approve Install app on the same store.',
    ],
  },
  {
    title: 'Customer Data Access',
    steps: [
      'If Shopify asks for protected customer data access, select customer name, email, phone, and shipping address.',
      'Use Store management as the reason.',
      'Save the access request before installing the app.',
    ],
  },
  {
    title: 'Copy Credentials',
    steps: [
      'Return to Dev Dashboard and open Apps > ExpressoPro.',
      'Open Settings.',
      'In Credentials, copy Client ID and Client secret.',
      'Paste the myshopify.com store domain, Client ID, and Client secret into ExpressoPro.',
    ],
  },
]

export const normalizeShopifyStoreUrl = (value?: string) => {
  const rawValue = String(value || '').trim().toLowerCase()
  if (!rawValue) return ''

  const valueWithProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`

  try {
    const parsed = new URL(valueWithProtocol)
    if (parsed.hostname === 'admin.shopify.com') {
      const pathParts = parsed.pathname.split('/').filter(Boolean)
      const storePathIndex = pathParts.findIndex((part) => part === 'store')
      const storeHandle = storePathIndex >= 0 ? pathParts[storePathIndex + 1] : ''
      return storeHandle ? `${storeHandle}.myshopify.com` : ''
    }

    return parsed.hostname
  } catch {
    return rawValue.replace(/^https?:\/\//, '').split(/[/?#]/)[0].replace(/\/+$/, '')
  }
}

export const getShopifyErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { error?: string; message?: string } }
    message?: string
  }

  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    'Error connecting Shopify custom app'
  )
}

export default function ShopifyIntegration({
  fullWidth,
  forOnboarding = false,
  fromChannelList = false,
}: IShopifyIntegrationProps) {
  const { user: userData } = useAuth()
  const theme = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [openModal, setOpenModal] = useState(false)

  const [shopifyDetails, setShopifyDetails] = useState<ShopifyForm>({
    storeUrl: '',
    clientId: '',
    clientSecret: '',
    apiKey: '',
    webhookSecret: '',
    adminApiAccessToken: '',
    userId: '',
    status: 'active',
    settings: {
      fulfillTrigger: 'order_booked',
      customerNotifyOnFulfill: 'do_not_notify',
      autoUpdateShipmentStatus: true,
      autoCancelOrders: false,
      markCodPaidOnDelivery: false,
    },
  })

  const [inputErrors, setInputErrors] = useState<Partial<ShopifyForm>>({})
  const { mutate: integrateShopify, isPending: integrating } = useIntegrateShopify()

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.open({ message: `${label} copied`, severity: 'success' })
    } catch {
      toast.open({ message: `Could not copy ${label}. Please copy it manually.`, severity: 'error' })
    }
  }

  const validateFields = () => {
    const normalizedStoreUrl = normalizeShopifyStoreUrl(shopifyDetails.storeUrl)
    const errors: Partial<ShopifyForm> = {}

    if (!shopifyDetails.storeUrl.trim()) {
      errors.storeUrl = 'Store URL is required'
    } else if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(normalizedStoreUrl)) {
      errors.storeUrl = 'Enter a valid Shopify URL, such as mystore.myshopify.com'
    }

    if (!String(shopifyDetails.clientId || '').trim()) {
      errors.clientId = 'Client ID is required'
    }

    if (!String(shopifyDetails.clientSecret || '').trim()) {
      errors.clientSecret = 'Client secret is required'
    }

    setInputErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleConnect = () => {
    if (!validateFields()) return

    const storeUrl = normalizeShopifyStoreUrl(shopifyDetails.storeUrl)
    const clientId = String(shopifyDetails.clientId || '').trim()
    const clientSecret = String(shopifyDetails.clientSecret || '').trim()

    integrateShopify(
      {
        ...shopifyDetails,
        storeUrl,
        domain: storeUrl,
        apiKey: clientId,
        clientId,
        apiSecretKey: clientSecret,
        webhookSecret: clientSecret,
        userId: userData?.userId,
      },
      {
        onSuccess: (data) => {
          const sync = data?.sync
          const syncMessage = sync
            ? ` Synced ${sync.created || 0} new and ${sync.updated || 0} updated unbooked orders from the last 30 days.`
            : ''
          toast.open({
            message: `${data?.message || 'Shopify integration successful!'}${syncMessage}${
              data?.warning ? ` ${data.warning}` : ''
            }`,
            severity: data?.warning ? 'warning' : 'success',
          })
          setOpenModal(false)
          queryClient.invalidateQueries({ queryKey: ['userInfo'] })
          queryClient.invalidateQueries({ queryKey: ['stores'] })
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
          if (fromChannelList && !forOnboarding) {
            navigate('/channels/connected')
          }
        },
        onError: (error) => {
          toast.open({
            message: getShopifyErrorMessage(error),
            severity: 'error',
          })
        },
      },
    )
  }

  const isConnected: boolean = Boolean(userData?.salesChannels?.shopify)

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          bgcolor: 'transparent',
          borderColor: 'rgba(255,255,255,0.1)',
          color: 'inherit',
          height: '100%',
          width: fullWidth ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
          <Box display="flex" justifyContent="center" mb={1}>
            <SiShopify size={28} />
          </Box>
          <Typography fontWeight={600}>Shopify</Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            size="small"
            variant="contained"
            color={isConnected && forOnboarding ? 'success' : 'inherit'}
            onClick={() => setOpenModal(true)}
            fullWidth={isMobile}
          >
            {forOnboarding && isConnected ? 'Connected' : isConnected ? 'Manage' : 'Connect'}
          </Button>
        </CardActions>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle>Connect Shopify custom app</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Alert severity="info">
              Create and install the custom app inside the same Shopify store, then connect it here
              with the store domain, Client ID, and Client secret.
            </Alert>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              {setupSections.map((section, index) => (
                <Box
                  key={section.title}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1.75,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Chip label={index + 1} size="small" color="primary" />
                    <Typography fontWeight={700}>{section.title}</Typography>
                  </Stack>
                  <Box
                    component="ol"
                    sx={{
                      m: 0,
                      pl: 2.5,
                      color: 'text.secondary',
                      '& li': { mb: 0.75, fontSize: 14 },
                    }}
                  >
                    {section.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={700}>Admin API scopes</Typography>
                  <Tooltip title="Copy scopes">
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(SHOPIFY_REQUIRED_SCOPES, 'Admin API scopes')}
                    >
                      <MdContentCopy size={18} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography sx={{ mt: 1, fontSize: 13, color: 'text.secondary', overflowWrap: 'anywhere', lineHeight: 1.6 }}>
                  {SHOPIFY_REQUIRED_SCOPES}
                </Typography>
              </Box>

              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={700}>Project URLs</Typography>
                  <Tooltip title="Copy URLs">
                    <IconButton
                      size="small"
                      onClick={() =>
                        copyToClipboard(
                          [
                            `App URL: ${SHOPIFY_APP_URL}`,
                            `Redirect URLs:\n${SHOPIFY_REDIRECT_URLS_TEXT}`,
                            `Order webhook: ${SHOPIFY_ORDER_WEBHOOK_URL}`,
                            `Tracking URL format: ${SHOPIFY_TRACKING_URL}`,
                          ].join('\n\n'),
                          'Shopify URLs',
                        )
                      }
                    >
                      <MdContentCopy size={18} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {[`App URL: ${SHOPIFY_APP_URL}`, ...SHOPIFY_REDIRECT_URLS.map((url) => `Redirect: ${url}`), `Order webhook: ${SHOPIFY_ORDER_WEBHOOK_URL}`, `Tracking: ${SHOPIFY_TRACKING_URL}`].map((line) => (
                    <Typography key={line} sx={{ fontSize: 13, color: 'text.secondary', overflowWrap: 'anywhere' }}>
                      {line}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Box>

            <Box sx={{ border: '1px solid', borderColor: 'success.light', borderRadius: 2, p: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography fontWeight={700}>Customer data answer</Typography>
                <Tooltip title="Copy answer">
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(SHOPIFY_DATA_USE_ANSWER, 'Customer data answer')}
                  >
                    <MdContentCopy size={18} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography sx={{ mt: 1, fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                Reason: Store management
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                {SHOPIFY_DATA_USE_ANSWER}
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField
                label="Shopify store URL"
                placeholder="your-store.myshopify.com"
                value={shopifyDetails.storeUrl}
                onChange={(event) =>
                  setShopifyDetails((current) => ({ ...current, storeUrl: event.target.value }))
                }
                error={Boolean(inputErrors.storeUrl)}
                helperText={inputErrors.storeUrl || 'Use the permanent myshopify.com domain.'}
                fullWidth
              />
              <TextField
                label="Client ID"
                placeholder="Paste Client ID from Shopify Dev Dashboard"
                value={shopifyDetails.clientId}
                onChange={(event) =>
                  setShopifyDetails((current) => ({ ...current, clientId: event.target.value }))
                }
                error={Boolean(inputErrors.clientId)}
                helperText={inputErrors.clientId || 'Use this for Shopify Dev Dashboard custom apps.'}
                fullWidth
              />
              <TextField
                label="Client secret"
                value={shopifyDetails.clientSecret}
                onChange={(event) =>
                  setShopifyDetails((current) => ({ ...current, clientSecret: event.target.value }))
                }
                error={Boolean(inputErrors.clientSecret)}
                helperText={inputErrors.clientSecret || 'Required for token exchange and webhook verification.'}
                type="password"
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={handleConnect} variant="contained" disabled={integrating}>
            {integrating ? 'Connecting...' : 'Connect custom app'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
