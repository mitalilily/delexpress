import { useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import moment from 'moment'
import { useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import {
  MdArrowDropDown,
  MdCancel,
  MdDescription,
  MdFileDownload,
  MdLocalShipping,
  MdMoreVert,
  MdReceipt,
  MdSync,
  MdVisibility,
} from 'react-icons/md'
import { generateManifestService } from '../../../api/order.service'
import { fetchTracking } from '../../../api/tracking.service'
import { useAllCouriersWithDetails } from '../../../hooks/Integrations/useCouriers'
import {
  useB2COrdersByUser,
  useCancelShipment,
  useCreateReverseShipment,
  useRegenerateOrderDocuments,
  useRetryFailedManifest,
  useShipNowOrder,
} from '../../../hooks/Orders/useOrders'
import { usePickupAddresses } from '../../../hooks/Pickup/usePickupAddresses'
import { usePresignedDownloadMutation } from '../../../hooks/Uploads/usePresignedDownloadUrls'
import { useKycVerification } from '../../../hooks/User/useKycVerification'
import type { B2COrder } from '../../../types/generic.types'
import { normalizePickupTime } from '../../../utils/pickupSchedule'
import { FilterBar, type FilterField } from '../../FilterBar'
import { toast } from '../../UI/Toast'
import StatusChip from '../../UI/chip/StatusChip'
import CustomDrawer from '../../UI/drawer/CustomDrawer'
import { SmartTabs } from '../../UI/tab/Tabs'
import DataTable, { type Column } from '../../UI/table/DataTable'
import TableSkeleton from '../../UI/table/TableSkeleton'
import CustomSelect from '../../UI/inputs/CustomSelect'
import ManifestPickupScheduleDialog from '../ManifestPickupScheduleDialog'
import ShipNowDialog from '../ShipNowDialog'
import {
  BULK_MANIFEST_LIMIT,
  downloadFile,
  downloadMergedPdf,
  type DocumentEntry,
  type DocumentType,
  getActionableErrorMessage,
  getB2CManifestIdentifier,
  getB2CManifestProvider,
  getDocumentReference,
  getDownloadFileName,
  getOrderDocumentLabel,
  isB2CManifestEligible,
  isShopifySyncedOrderReadyForCourier,
  resolveDocumentEntriesForDownload,
  summarizeMessages,
  summarizeOrderNumbers,
} from '../bulkActionUtils'
import ReverseModal from '../reverse/ReverseModal'
import B2COrderFormSteps from './B2COrderForm'

/* ───────────── Types ───────────── */
interface OrderFilters {
  status?: string
  sortBy?: 'created_at'
  sortOrder?: 'asc' | 'desc'
  type?: string
  courier?: string
  warehouse?: string
  fromDate?: string
  toDate?: string
  search?: string
}

type BulkFeedback = {
  severity: 'info' | 'success' | 'error' | 'warning'
  title: string
  message: string
}

type PickupSchedulePayload = {
  pickup_date: string
  pickup_time: string
}

type ShipNowPayload = PickupSchedulePayload & {
  expected_package_count: number
  pickup_address_id?: string
}

type ActionMenuAction =
  | 'view-details'
  | 'generate-manifest'
  | 'regenerate-label'
  | 'regenerate-invoice'
  | 'download-label'
  | 'download-invoice'
  | 'download-manifest'
  | 'cancel-shipment'
  | 'track-shipment'
  | 'sync-live-status'
  | 'select-courier'
  | 'reverse-shipment'
  | 'retry-manifest'
  | 'ship-now'

const getDefaultPickupDateInput = () => new Date().toISOString().split('T')[0]

const getDefaultPickupTimeInput = () => {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000)
  return `${String(nextHour.getHours()).padStart(2, '0')}:${String(nextHour.getMinutes()).padStart(2, '0')}`
}

const parsePickupDetails = (value: unknown) => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return value as Record<string, unknown>
}

const empty = '—'

const asText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return empty
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const asDateTime = (value: unknown) => {
  if (!value) return empty
  const date = moment(value as string)
  return date.isValid() ? date.format('DD MMM YYYY, hh:mm A') : asText(value)
}

const asDate = (value: unknown) => {
  if (!value) return empty
  const date = moment(value as string)
  return date.isValid() ? date.format('DD MMM YYYY') : asText(value)
}

const asMoney = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '₹0.00'
  const amount = Number(value)
  return Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : asText(value)
}

const asWeight = (value: unknown) => {
  if (value === null || value === undefined || value === '') return empty
  const weight = Number(value)
  return Number.isFinite(weight) ? `${weight.toFixed(2)} kg` : asText(value)
}

const getSourceLabel = (row: B2COrder) =>
  String(row.integration_type || '').toLowerCase() === 'shopify'
    ? 'Shopify'
    : row.is_external_api
      ? 'API'
      : 'Local'

const getSourceStatus = (row: B2COrder): 'success' | 'pending' | 'error' | 'info' =>
  String(row.integration_type || '').toLowerCase() === 'shopify' || row.is_external_api
    ? 'info'
    : 'success'

const getAddressLine = (parts: unknown[]) =>
  parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ') || empty

const getProductName = (product: Record<string, unknown>) =>
  asText(product.productName ?? product.name ?? product.title)

const getProductQuantity = (product: Record<string, unknown>) =>
  asText(product.quantity ?? product.qty ?? product.quantityOrdered)

const getProductPrice = (product: Record<string, unknown>) => asMoney(product.price ?? product.amount)

const compactId = (value: unknown, max = 18) => {
  const text = String(value ?? '').trim()
  if (!text) return empty
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

const DetailItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box
    sx={{
      minWidth: 0,
      borderBottom: '1px solid rgba(13, 59, 142, 0.08)',
      pb: 0.75,
    }}
  >
    <Typography variant="caption" sx={{ display: 'block', color: '#6B7280', fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography
      component="div"
      sx={{ color: '#1f3559', fontSize: 13, fontWeight: 600, wordBreak: 'break-word' }}
    >
      {value || empty}
    </Typography>
  </Box>
)

const DetailSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Stack spacing={1.25}>
    <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#5D7E96', textTransform: 'uppercase' }}>
      {title}
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 1.25,
      }}
    >
      {children}
    </Box>
  </Stack>
)

/* ───────────── Status Color Mapping ───────────── */
export const statusColorMap: Record<string, 'success' | 'pending' | 'error' | 'info'> = {
  pending: 'pending',
  booked: 'info',
  manifest_failed: 'error',
  pickup_initiated: 'pending',
  shipment_created: 'info', // legacy
  in_transit: 'pending',
  out_for_delivery: 'pending',
  on_hold: 'pending',
  delivered: 'success',
  cancelled: 'error',
  ndr: 'error',
  rto: 'error',
  rto_in_transit: 'pending',
  rto_delivered: 'info',
  cancellation_requested: 'info',
  manifest_generated: 'info', // legacy
}

/* ───────────── Shipping Statuses ───────────── */
const shippingStatusMap: Record<string, string> = {
  pending: 'Pending',
  booked: 'Booked',
  manifest_failed: 'Manifest Failed',
  pickup_initiated: 'Pending Pickup',
  shipment_created: 'Shipment Created',
  in_transit: 'In Transit',
  out_for_delivery: 'Out For Delivery',
  on_hold: 'On Hold',
  delivered: 'Delivered',
  ndr: 'NDR',
  rto: 'RTO Initiated',
  rto_in_transit: 'RTO In Transit',
  rto_delivered: 'RTO Delivered',
  cancellation_requested: 'Cancellation Requested',
  cancelled: 'Cancelled',
}

const ShipmentDetailsDialog = ({
  order,
  open,
  onClose,
}: {
  order: B2COrder | null
  open: boolean
  onClose: () => void
}) => {
  if (!order) return null

  const pickup = parsePickupDetails(order.pickup_details)
  const rto = parsePickupDetails(order.rto_details)
  const products = Array.isArray(order.products) ? order.products : []
  const dimensions = `${asText(order.length)} x ${asText(order.breadth)} x ${asText(order.height)} cm`
  const totalCustomerCharge = Math.max(
    Number(order.order_amount ?? 0) +
      Number(order.shipping_charges ?? 0) +
      Number(order.transaction_fee ?? 0) +
      Number(order.gift_wrap ?? 0) -
      (Number(order.discount ?? 0) + Number(order.prepaid_amount ?? 0)),
    0,
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
          <Box>
            <Typography sx={{ fontWeight: 900, color: '#172B4D' }}>
              Shipment {order.order_number}
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
              AWB {order.awb_number || empty} · {order.courier_partner || empty}
            </Typography>
          </Box>
          <StatusChip
            label={shippingStatusMap[order.order_status] || order.order_status || 'Unknown'}
            status={statusColorMap[order.order_status] || 'info'}
          />
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2.5}>
          <DetailSection title="Shipment">
            <DetailItem label="Order Number" value={order.order_number} />
            <DetailItem label="Backend Order ID" value={asText(order.order_id)} />
            <DetailItem label="Shipment ID" value={asText(order.shipment_id)} />
            <DetailItem
              label="AWB"
              value={
                order.awb_number ? (
                  <Link href={`/tracking?awb=${encodeURIComponent(order.awb_number)}`} underline="hover">
                    {order.awb_number}
                  </Link>
                ) : (
                  empty
                )
              }
            />
            <DetailItem label="Source" value={getSourceLabel(order)} />
            <DetailItem label="Tags" value={asText(order.tags)} />
            <DetailItem label="Order Date" value={asDate(order.order_date)} />
            <DetailItem label="Created" value={asDateTime(order.created_at)} />
            <DetailItem label="Updated" value={asDateTime(order.updated_at)} />
          </DetailSection>

          <DetailSection title="Courier & Tracking">
            <DetailItem label="Courier" value={asText(order.courier_partner)} />
            <DetailItem label="Courier ID" value={asText(order.courier_id)} />
            <DetailItem label="Integration" value={asText(order.integration_type)} />
            <DetailItem label="Shipping Mode" value={asText(order.shipping_mode)} />
            <DetailItem label="Sort Code" value={asText(order.sort_code)} />
            <DetailItem label="EDD" value={asDate(order.edd)} />
            <DetailItem label="Delivery Location" value={asText(order.delivery_location)} />
            <DetailItem label="Delivery Message" value={asText(order.delivery_message)} />
            <DetailItem label="Pickup Status" value={asText(order.pickup_status)} />
            <DetailItem label="Pickup Error" value={asText(order.pickup_error)} />
          </DetailSection>

          <DetailSection title="Buyer">
            <DetailItem label="Name" value={order.buyer_name} />
            <DetailItem label="Phone" value={order.buyer_phone} />
            <DetailItem label="Email" value={asText(order.buyer_email)} />
            <DetailItem
              label="Address"
              value={getAddressLine([order.address, order.city, order.state, order.country, order.pincode])}
            />
          </DetailSection>

          <DetailSection title="Weight & Package">
            <DetailItem label="Declared Weight" value={asWeight(order.weight)} />
            <DetailItem label="Actual Weight" value={asWeight(order.actual_weight)} />
            <DetailItem label="Volumetric Weight" value={asWeight(order.volumetric_weight)} />
            <DetailItem label="Charged Weight" value={asWeight(order.charged_weight)} />
            <DetailItem label="Selected Slab" value={asWeight(order.selected_max_slab_weight)} />
            <DetailItem label="Charged Slabs" value={asText(order.charged_slabs)} />
            <DetailItem label="Dimensions" value={dimensions} />
            <DetailItem label="Weight Discrepancy" value={asText(order.weight_discrepancy)} />
            <DetailItem label="Insurance" value={asText(order.is_insurance)} />
          </DetailSection>

          <DetailSection title="Rates & Charges">
            <DetailItem label="Payment Type" value={asText(order.order_type)} />
            <DetailItem label="Order Amount" value={asMoney(order.order_amount)} />
            <DetailItem label="Customer Total" value={asMoney(totalCustomerCharge)} />
            <DetailItem label="Prepaid Amount" value={asMoney(order.prepaid_amount)} />
            <DetailItem label="Freight Charge" value={asMoney(order.freight_charges)} />
            <DetailItem label="Shipping Charge" value={asMoney(order.shipping_charges)} />
            <DetailItem label="Courier Cost" value={asMoney(order.courier_cost)} />
            <DetailItem label="COD Charge" value={asMoney(order.cod_charges)} />
            <DetailItem label="Other Charge" value={asMoney(order.other_charges)} />
            <DetailItem label="Transaction Fee" value={asMoney(order.transaction_fee)} />
            <DetailItem label="Gift Wrap" value={asMoney(order.gift_wrap)} />
            <DetailItem label="Discount" value={asMoney(order.discount)} />
          </DetailSection>

          <DetailSection title="Pickup & RTO">
            <DetailItem label="Pickup Location ID" value={asText(order.pickup_location_id)} />
            <DetailItem label="Pickup Warehouse" value={asText(pickup.warehouse_name || pickup.name)} />
            <DetailItem
              label="Pickup Address"
              value={getAddressLine([pickup.address, pickup.city, pickup.state, pickup.pincode])}
            />
            <DetailItem label="Pickup Phone" value={asText(pickup.phone)} />
            <DetailItem label="Pickup GST" value={asText(pickup.gst_number)} />
            <DetailItem label="RTO Different" value={asText(order.is_rto_different)} />
            <DetailItem label="RTO Warehouse" value={asText(rto.warehouse_name || rto.name)} />
            <DetailItem label="RTO Address" value={getAddressLine([rto.address, rto.city, rto.state, rto.pincode])} />
            <DetailItem label="RTO Phone" value={asText(rto.phone)} />
          </DetailSection>

          <Stack spacing={1.25}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#5D7E96', textTransform: 'uppercase' }}>
              Products
            </Typography>
            {products.length ? (
              <Stack spacing={0.75}>
                {products.map((product, index) => {
                  const item = product as Record<string, unknown>
                  return (
                    <Box
                      key={`${getProductName(item)}-${index}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1.8fr 0.6fr 0.8fr 1fr 0.8fr' },
                        gap: 1,
                        p: 1,
                        border: '1px solid rgba(13, 59, 142, 0.1)',
                        borderRadius: 1,
                      }}
                    >
                      <DetailItem label="Product" value={getProductName(item)} />
                      <DetailItem label="Qty" value={getProductQuantity(item)} />
                      <DetailItem label="Price" value={getProductPrice(item)} />
                      <DetailItem label="SKU" value={asText(item.sku)} />
                      <DetailItem label="HSN" value={asText(item.hsnCode ?? item.hsn)} />
                    </Box>
                  )
                })}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>No product details available.</Typography>
            )}
          </Stack>

          <DetailSection title="Documents">
            <DetailItem label="Label" value={asText(order.label || order.label_key || order.label_url)} />
            <DetailItem label="Manifest" value={asText(order.manifest || order.manifest_key || order.manifest_url)} />
            <DetailItem label="Invoice Link" value={asText(order.invoice_link || order.invoice_key || order.invoice_url)} />
            <DetailItem label="Invoice Number" value={asText(order.invoice_number)} />
            <DetailItem label="Invoice Date" value={asDate(order.invoice_date)} />
            <DetailItem label="Invoice Amount" value={asMoney(order.invoice_amount)} />
            <DetailItem label="Manifest Error" value={asText(order.manifest_error)} />
            <DetailItem label="Manifest Retry Count" value={asText(order.manifest_retry_count)} />
            <DetailItem label="Last Manifest Retry" value={asDateTime(order.manifest_last_retry_at)} />
          </DetailSection>

          <Divider />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#5D7E96', mb: 1 }}>
              Raw Available Order Data
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1.25,
                borderRadius: 1,
                bgcolor: '#F8FAFC',
                color: '#1f3559',
                fontSize: 11,
                maxHeight: 220,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(order, null, 2)}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        {order.awb_number && (
          <Button href={`/tracking?awb=${encodeURIComponent(order.awb_number)}`} variant="outlined">
            Track AWB
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const B2COrdersList = () => {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm')) // mobile
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')) // tablet
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')) // small desktop
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg')) // large desktop

  let drawerWidth: string | number = '100%' // default full width
  if (isXs) drawerWidth = '100%' // mobile full width
  else if (isSm) drawerWidth = '95%' // tablets
  else if (isMd) drawerWidth = '95%' // small desktops
  else if (isLgUp) drawerWidth = 1200 // large desktop fixed width
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Array<B2COrder['id']>>([])
  const [selectionResetToken, setSelectionResetToken] = useState(0)
  const [downloadingDocumentType, setDownloadingDocumentType] = useState<DocumentType | null>(null)
  const [bulkManifesting, setBulkManifesting] = useState(false)
  const [manifestingOrderId, setManifestingOrderId] = useState<string | number | null>(null)
  const [bulkFeedback, setBulkFeedback] = useState<BulkFeedback | null>(null)
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false)
  const [pickupDialogTitle, setPickupDialogTitle] = useState('Confirm pickup schedule')
  const [pickupDialogDescription, setPickupDialogDescription] = useState('')
  const [pickupDialogDate, setPickupDialogDate] = useState(getDefaultPickupDateInput())
  const [pickupDialogTime, setPickupDialogTime] = useState(getDefaultPickupTimeInput())
  const [shipNowDialogOpen, setShipNowDialogOpen] = useState(false)
  const [shipNowDialogTitle, setShipNowDialogTitle] = useState('Ship Now')
  const [shipNowDialogDescription, setShipNowDialogDescription] = useState('')
  const [shipNowCourierLabel, setShipNowCourierLabel] = useState('Courier')
  const [shipNowRequiresPickupSchedule, setShipNowRequiresPickupSchedule] = useState(false)
  const [shipNowPickupDate, setShipNowPickupDate] = useState(getDefaultPickupDateInput())
  const [shipNowPickupTime, setShipNowPickupTime] = useState(getDefaultPickupTimeInput())
  const [shipNowPackageCount, setShipNowPackageCount] = useState('1')
  const [shipNowPickupAddressId, setShipNowPickupAddressId] = useState('')
  const [shopifyOrderForCourier, setShopifyOrderForCourier] = useState<B2COrder | null>(null)
  const [detailOrder, setDetailOrder] = useState<B2COrder | null>(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null)
  const [actionMenuOrder, setActionMenuOrder] = useState<B2COrder | null>(null)
  const [documentActionKey, setDocumentActionKey] = useState<string | null>(null)
  const [syncingStatusOrderId, setSyncingStatusOrderId] = useState<string | number | null>(null)
  const pickupDialogResolverRef = useRef<((value: PickupSchedulePayload | null) => void) | null>(
    null,
  )
  const shipNowDialogResolverRef = useRef<((value: ShipNowPayload | null) => void) | null>(null)
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const [selectedTab, setSelectedTab] = useState<string>('')

  const effectiveFilters: OrderFilters = {
    ...filters,
    status: selectedTab || undefined,
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc',
  }

  const { data, isLoading, isError } = useB2COrdersByUser(page, rowsPerPage, effectiveFilters)
  const { mutateAsync: retryFailedManifest, isPending: retryingManifest } = useRetryFailedManifest()
  const { mutateAsync: regenerateDocuments, isPending: isRegeneratingDocuments } =
    useRegenerateOrderDocuments()
  const { mutateAsync: shipNowOrder, isPending: isShippingNow } = useShipNowOrder()
  const queryClient = useQueryClient()
  const { mutateAsync: presignDownloads } = usePresignedDownloadMutation()
  const { data: couriers } = useAllCouriersWithDetails()
  const { data: warehouses } = usePickupAddresses()
  const { mutate: cancelShipment } = useCancelShipment()
  const { mutate: createReverse } = useCreateReverseShipment()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reverseOrder, setReverseOrder] = useState<any | null>(null)
  const orders: B2COrder[] = data?.orders || []
  const selectedOrders: B2COrder[] = orders.filter((order) => selectedOrderIds.includes(order.id))
  const manifestValidationMessage =
    selectedOrders.length === 0
      ? 'Select orders to start a bulk action.'
      : selectedOrders.length > BULK_MANIFEST_LIMIT
        ? `You can manifest a maximum of ${BULK_MANIFEST_LIMIT} orders at a time.`
        : selectedOrders.some((order) => !isB2CManifestEligible(order))
          ? 'Some selected orders are not ready for manifest yet.'
          : ''

  const clearSelection = () => {
    setSelectedOrderIds([])
    setSelectionResetToken((current) => current + 1)
  }

  const requestDelhiveryPickupSchedule = (order: B2COrder, label: string) =>
    new Promise<PickupSchedulePayload | null>((resolve) => {
      const details = parsePickupDetails(order.pickup_details)
      const initialDate =
        typeof details?.pickup_date === 'string' && details.pickup_date.trim()
          ? details.pickup_date.slice(0, 10)
          : getDefaultPickupDateInput()
      const initialTimeRaw =
        typeof details?.pickup_time === 'string' && details.pickup_time.trim()
          ? details.pickup_time.trim()
          : getDefaultPickupTimeInput()

      pickupDialogResolverRef.current = resolve
      setPickupDialogTitle('Confirm Pickup Before Manifest')
      setPickupDialogDescription(label)
      setPickupDialogDate(initialDate)
      setPickupDialogTime(initialTimeRaw.slice(0, 5))
      setPickupDialogOpen(true)
    })

  const closePickupDialog = (value: PickupSchedulePayload | null) => {
    setPickupDialogOpen(false)
    pickupDialogResolverRef.current?.(value)
    pickupDialogResolverRef.current = null
  }

  const requestShipNowDetails = (order: B2COrder, label: string) =>
    new Promise<ShipNowPayload | null>((resolve) => {
      const details = parsePickupDetails(order.pickup_details)
      const initialDate =
        typeof details?.pickup_date === 'string' && details.pickup_date.trim()
          ? details.pickup_date.slice(0, 10)
          : getDefaultPickupDateInput()
      const initialTimeRaw =
        typeof details?.pickup_time === 'string' && details.pickup_time.trim()
          ? details.pickup_time.trim()
          : getDefaultPickupTimeInput()
      const initialCount = Number(details?.expected_package_count ?? 1)
      const initialPickupAddressId =
        String(order.pickup_location_id || details?.pickup_address_id || '').trim() || ''

      shipNowDialogResolverRef.current = resolve
      setShipNowDialogTitle('Ship Now')
      setShipNowDialogDescription(label)
      setShipNowCourierLabel(String(order.courier_partner || order.integration_type || 'Courier'))
      setShipNowRequiresPickupSchedule(true)
      setShipNowPickupDate(initialDate)
      setShipNowPickupTime(initialTimeRaw.slice(0, 5))
      setShipNowPackageCount(String(Number.isFinite(initialCount) && initialCount > 0 ? initialCount : 1))
      setShipNowPickupAddressId(initialPickupAddressId)
      setShipNowDialogOpen(true)
    })

  const closeShipNowDialog = (value: ShipNowPayload | null) => {
    setShipNowDialogOpen(false)
    setShipNowRequiresPickupSchedule(false)
    shipNowDialogResolverRef.current?.(value)
    shipNowDialogResolverRef.current = null
  }

  const getOrderProviderKey = (row: B2COrder) =>
    String(row.integration_type || row.courier_partner || '').trim().toLowerCase()

  const isDelhiveryShipNow = (row: B2COrder) => getOrderProviderKey(row) === 'delhivery'

  const canShipNow = (row: B2COrder) => {
    const status = String(row.order_status || '').trim().toLowerCase()
    if (['cancelled', 'delivered', 'rto_delivered'].includes(status)) return false
    return true
  }

  /* ───────────── Handlers ───────────── */
  const handleGenerateManifest = async (order: B2COrder) => {
    const manifestRef = getB2CManifestIdentifier(order)
    if (!manifestRef) {
      const message = `Manifest cannot be started for ${order.order_number} yet.`
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest unavailable',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }
    try {
      setManifestingOrderId(order.id)
      setBulkFeedback({
        severity: 'info',
        title: 'Manifest in progress',
        message: `Processing ${order.order_number}.`,
      })
      const providerKey = getB2CManifestProvider(order)
      const pickupSchedule =
        providerKey === 'delhivery'
          ? await requestDelhiveryPickupSchedule(
              order,
              `Set the pickup date and time for ${order.order_number} before manifesting.`,
            )
          : null

      if (providerKey === 'delhivery' && !pickupSchedule) {
        const cancelledMessage = `Manifest cancelled for ${order.order_number} before pickup confirmation.`
        setBulkFeedback({
          severity: 'warning',
          title: 'Manifest cancelled',
          message: cancelledMessage,
        })
        toast.open({ message: cancelledMessage, severity: 'info' })
        return
      }

      const response = await generateManifestService({
        awbs: [manifestRef],
        type: 'b2c',
        ...(pickupSchedule || {}),
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])
      const successMessage = `Manifest completed for ${order.order_number}.`
      const warningSummary = summarizeMessages(response.warnings || [])
      if (warningSummary) {
        const warningMessage = `${successMessage} ${warningSummary}`
        setBulkFeedback({
          severity: 'warning',
          title: 'Manifest completed with warnings',
          message: warningMessage,
        })
        toast.open({ message: warningMessage, severity: 'info' })
        return
      }
      setBulkFeedback({
        severity: 'success',
        title: 'Manifest completed',
        message: successMessage,
      })
      toast.open({ message: successMessage, severity: 'success' })
    } catch (error) {
      console.error('Manifest failed for order:', order.order_number, error)
      const errorMessage = getActionableErrorMessage(
        error,
        `Manifest failed for ${order.order_number}.`,
      )
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest failed',
        message: `${order.order_number}: ${errorMessage}`,
      })
      toast.open({
        message: `${order.order_number}: ${errorMessage}`,
        severity: 'error',
      })
    } finally {
      setManifestingOrderId((current) => (current === order.id ? null : current))
    }
  }

  const handleRetryManifest = async (order: B2COrder) => {
    if (!order.id) return
    const providerKey = String(order.integration_type || '').toLowerCase()
    const pickupSchedule =
      providerKey === 'delhivery'
        ? await requestDelhiveryPickupSchedule(
            order,
            `Update the pickup date and time for ${order.order_number} before retrying the manifest.`,
          )
        : null

    if (providerKey === 'delhivery' && !pickupSchedule) {
      toast.open({
        message: `Retry cancelled for ${order.order_number} before pickup confirmation.`,
        severity: 'info',
      })
      return
    }

    await retryFailedManifest({
      orderId: String(order.id),
      ...(pickupSchedule || {}),
    })
  }

  const handleShipNow = async (order: B2COrder) => {
    if (!order.id) return

    const providerKey = getOrderProviderKey(order)
    const requiresPickup = providerKey === 'delhivery'

    const shipNowDetails =
      requiresPickup
        ? await requestShipNowDetails(
            order,
            `Set pickup date, time, count, and pickup address before triggering Delhivery pickup for ${order.order_number}.`,
          )
        : ({ expected_package_count: 1 } as ShipNowPayload)

    if (requiresPickup && !shipNowDetails) {
      toast.open({
        message: `Ship Now cancelled for ${order.order_number} before pickup confirmation.`,
        severity: 'info',
      })
      return
    }

    try {
      await shipNowOrder({
        orderId: String(order.id),
        ...(shipNowDetails || { expected_package_count: 1 }),
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])

      toast.open({
        message: requiresPickup
          ? `Pickup request submitted for ${order.order_number} and documents regenerated.`
          : `Label regenerated for ${order.order_number}.`,
        severity: 'success',
      })
    } catch (error) {
      console.error('Ship now failed for order:', order.order_number, error)
      const message = getActionableErrorMessage(error, `Ship Now failed for ${order.order_number}.`)
      toast.open({ message, severity: 'error' })
    }
  }

  const handleApplyFilters = (appliedFilters: OrderFilters) => {
    // Merge while preserving current status unless explicitly set
    setFilters((prev) => ({
      ...prev,
      ...appliedFilters,
      status: appliedFilters.status !== undefined ? appliedFilters.status : prev.status,
      sortBy: appliedFilters.sortBy !== undefined ? appliedFilters.sortBy : prev.sortBy,
      sortOrder: appliedFilters.sortOrder !== undefined ? appliedFilters.sortOrder : prev.sortOrder,
    }))
    setPage(1)
    clearSelection()
    setBulkFeedback(null)
  }

  const { checkKycBeforeAction } = useKycVerification()

  const handleCreateB2COrder = () => {
    checkKycBeforeAction(() => {
      setDrawerOpen(true)
    })
  }

  const handleTabChange = (newValue: string) => {
    setSelectedTab(newValue)
    setPage(1)
    clearSelection()
    setBulkFeedback(null)
    setFilters((prev) => ({
      ...prev,
      sortBy: prev.sortBy || 'created_at',
      sortOrder: prev.sortOrder || 'desc',
    }))

    // Keep status filtering local; do not sync status to URL params.
  }

  const handleBulkManifest = async () => {
    if (!selectedOrders.length) {
      const message = 'Select up to 5 eligible orders to manifest.'
      setBulkFeedback({
        severity: 'error',
        title: 'No orders selected',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    if (manifestValidationMessage) {
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest unavailable',
        message: manifestValidationMessage,
      })
      toast.open({ message: manifestValidationMessage, severity: 'error' })
      return
    }

    setBulkManifesting(true)
    setBulkFeedback({
      severity: 'info',
      title: 'Manifest in progress',
      message: `Processing ${selectedOrders.length} selected order(s).`,
    })

    try {
      const manifestGroups = selectedOrders.reduce<Record<string, B2COrder[]>>((groups, order) => {
        const manifestIdentifier = getB2CManifestIdentifier(order)
        if (!manifestIdentifier) return groups

        const providerKey = getB2CManifestProvider(order)
        if (!groups[providerKey]) groups[providerKey] = []
        groups[providerKey].push(order)
        return groups
      }, {})

      const failedOrders: B2COrder[] = []
      const failureReasons: string[] = []
      const warningMessages: string[] = []
      let successCount = 0

      for (const [providerKey, providerOrders] of Object.entries(manifestGroups)) {
        const identifiers = providerOrders
          .map((order) => getB2CManifestIdentifier(order))
          .filter((value): value is string => Boolean(value))

        if (!identifiers.length) continue

        try {
          const response = await generateManifestService({ awbs: identifiers, type: 'b2c' })
          successCount += providerOrders.length
          if (response.warnings?.length) {
            warningMessages.push(...response.warnings)
          }
        } catch (error) {
          console.error('Bulk manifest provider batch failed:', error)
          failedOrders.push(...providerOrders)
          failureReasons.push(
            `${providerKey}: ${getActionableErrorMessage(
              error,
              'Manifest could not be completed for this batch.',
            )}`,
          )
        }
      }

      if (successCount > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
          queryClient.invalidateQueries({ queryKey: ['orders'] }),
        ])
      }

      if (failedOrders.length > 0) {
        const failedOrderIds = failedOrders.map((order) => order.id)
        const failedOrderNumbers = summarizeOrderNumbers(
          failedOrders.map((order) => order.order_number || order.id),
        )
        const message =
          successCount > 0
            ? `Completed ${successCount} order(s). Failed for ${failedOrders.length}: ${failedOrderNumbers}. ${failureReasons.join(' ')}`
            : `Failed for ${failedOrders.length} order(s): ${failedOrderNumbers}. ${failureReasons.join(' ')}`
        const warningSummary = summarizeMessages(warningMessages)
        const finalMessage = warningSummary ? `${message} ${warningSummary}` : message

        setSelectedOrderIds(failedOrderIds)
        setBulkFeedback({
          severity: successCount > 0 ? 'warning' : 'error',
          title: successCount > 0 ? 'Manifest partially completed' : 'Manifest failed',
          message: finalMessage,
        })
        toast.open({ message: finalMessage, severity: 'error' })
        return
      }

      const successMessage = `Manifest completed for ${successCount} order(s).`
      const warningSummary = summarizeMessages(warningMessages)
      if (warningSummary) {
        const warningMessage = `${successMessage} ${warningSummary}`
        setBulkFeedback({
          severity: 'warning',
          title: 'Manifest completed with warnings',
          message: warningMessage,
        })
        toast.open({ message: warningMessage, severity: 'info' })
        clearSelection()
        return
      }
      setBulkFeedback({
        severity: 'success',
        title: 'Manifest completed',
        message: successMessage,
      })
      toast.open({ message: successMessage, severity: 'success' })
      clearSelection()
    } finally {
      setBulkManifesting(false)
    }
  }

  const handleBulkDownload = async (type: DocumentType) => {
    if (!selectedOrders.length) {
      const message = 'Select at least one order to download documents.'
      setBulkFeedback({
        severity: 'error',
        title: 'No orders selected',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    setDownloadingDocumentType(type)
    setBulkFeedback({
      severity: 'info',
      title: `Downloading ${type}s`,
      message: `Preparing ${selectedOrders.length} selected order(s) for ${type} download.`,
    })

    try {
      const documentEntries = selectedOrders.reduce((entries: DocumentEntry[], order: B2COrder) => {
        const { key, url } = getDocumentReference(order, type)
        if (!key && !url) return entries

        const source = key || url
        entries.push({
          key,
          url,
          fileName: getDownloadFileName(order, type, source),
          orderLabel: getOrderDocumentLabel(order),
        })
        return entries
      }, [])

      if (!documentEntries.length) {
        const message = `No ${type} files are available for the selected orders.`
        setBulkFeedback({
          severity: 'error',
          title: `No ${type} files found`,
          message,
        })
        toast.open({ message, severity: 'error' })
        return
      }

      const uniqueEntries = Array.from(
        new Map<string, DocumentEntry>(
          documentEntries.map((entry) => [entry.key || entry.url || entry.fileName, entry]),
        ).values(),
      )

      const { resolvedEntries, unavailableOrders: unresolvedOrders } =
        await resolveDocumentEntriesForDownload(uniqueEntries, presignDownloads)

      let downloadedCount = 0
      let skippedCount = documentEntries.length - uniqueEntries.length
      const unavailableOrders = [...unresolvedOrders]
      skippedCount += unresolvedOrders.length

      if (type === 'label') {
        const mergedFileName = `bulk-labels-${Date.now()}.pdf`
        const mergeResult = await downloadMergedPdf(resolvedEntries, mergedFileName)
        downloadedCount = mergeResult.downloadedCount
        skippedCount += mergeResult.unavailableOrders.length
        unavailableOrders.push(...mergeResult.unavailableOrders)
      } else {
        for (const entry of resolvedEntries) {
          await downloadFile(entry.downloadUrl, entry.fileName)
          downloadedCount += 1
        }
      }

      if (!downloadedCount) {
        const unavailableSummary =
          unavailableOrders.length > 0
            ? ` Files are not ready for: ${summarizeOrderNumbers(unavailableOrders)}.`
            : ''
        const message = `No ${type} files could be downloaded for the selected orders.${unavailableSummary}`
        setBulkFeedback({
          severity: 'error',
          title: `${type[0].toUpperCase()}${type.slice(1)} download failed`,
          message,
        })
        toast.open({ message, severity: 'error' })
        return
      }

      const summaryMessage =
        skippedCount > 0
          ? `${
              type === 'label'
                ? `Merged ${downloadedCount} label file(s) into one PDF.`
                : `Downloaded ${downloadedCount} ${type} file(s).`
            } Skipped ${skippedCount} missing or duplicate file(s).${unavailableOrders.length ? ` Orders: ${summarizeOrderNumbers(unavailableOrders)}.` : ''}`
          : type === 'label'
            ? `Merged ${downloadedCount} label file(s) into one PDF.`
            : `Downloaded ${downloadedCount} ${type} file(s).`

      setBulkFeedback({
        severity: skippedCount > 0 ? 'warning' : 'success',
        title:
          skippedCount > 0
            ? `${type[0].toUpperCase()}${type.slice(1)} download completed with skips`
            : `${type[0].toUpperCase()}${type.slice(1)} download completed`,
        message: summaryMessage,
      })
      toast.open({ message: summaryMessage, severity: skippedCount > 0 ? 'info' : 'success' })
    } catch (error) {
      console.error(`Bulk ${type} download failed:`, error)
      const message = getActionableErrorMessage(
        error,
        `Failed to download selected ${type} files. Please try again.`,
      )
      setBulkFeedback({
        severity: 'error',
        title: `${type[0].toUpperCase()}${type.slice(1)} download failed`,
        message,
      })
      toast.open({ message, severity: 'error' })
    } finally {
      setDownloadingDocumentType(null)
    }
  }

  /* ───────────── Filter Fields ───────────── */
  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by customer, order # etc.',
    },
    {
      name: 'type',
      label: 'Order Type',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'COD', value: 'cod' },
        { label: 'Prepaid', value: 'prepaid' },
      ],
      isAdvanced: true,
    },
    {
      name: 'courier',
      label: 'Courier',
      type: 'select',
      options:
        couriers?.map((c: { name: string; id: string }) => ({ label: c.name, value: c.id })) ?? [],
      isAdvanced: true,
    },
    {
      name: 'warehouse',
      label: 'Warehouse',
      type: 'select',
      options:
        warehouses?.pickupAddresses?.map((w) => ({
          label: w.pickup?.addressNickname,
          value: w.pickup?.addressNickname,
        })) ?? [],
      isAdvanced: true,
    },
    { name: 'fromDate', label: 'From Date', type: 'date', placeholder: 'From' },
    { name: 'toDate', label: 'To Date', type: 'date', placeholder: 'To' },
  ]

  const defaultFilterValues: Record<string, unknown> = {
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...filters,
  }

  /* ───────────── Columns ───────────── */
  const isCancellable = (row: B2COrder) => {
    const status = (row.order_status || '').toLowerCase()
    const cancellableStatuses = new Set(['pending', 'booked', 'pickup_initiated'])
    const provider = (row.integration_type || '').toLowerCase()
    const providerSupports = ['delhivery', 'ekart', 'xpressbees'].includes(provider)
    return providerSupports && cancellableStatuses.has(status)
  }

  const hasLabelGenerated = (row: B2COrder) =>
    Boolean(String(row.label_url || row.label_key || row.label || '').trim())

  const hasInvoiceGenerated = (row: B2COrder) =>
    Boolean(String(row.invoice_url || row.invoice_key || row.invoice_link || '').trim())

  const hasManifestGenerated = (row: B2COrder) =>
    Boolean(String(row.manifest_url || row.manifest_key || row.manifest || '').trim())

  const isDocumentOperational = (row: B2COrder) => {
    const normalizedStatus = String(row.order_status || '').trim().toLowerCase()
    return (
      Boolean(String(row.manifest_key || row.manifest || row.awb_number || '').trim()) ||
      [
        'booked',
        'shipment_created',
        'pickup_initiated',
        'in_transit',
        'out_for_delivery',
        'on_hold',
        'delivered',
        'ndr',
        'undelivered',
        'rto',
        'rto_in_transit',
        'rto_delivered',
      ].includes(normalizedStatus)
    )
  }

  const handleOpenActionMenu = (
    event: ReactMouseEvent<HTMLButtonElement>,
    row: B2COrder,
  ) => {
    event.stopPropagation()
    setActionMenuAnchor(event.currentTarget)
    setActionMenuOrder(row)
  }

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null)
    setActionMenuOrder(null)
  }

  const handleSingleDocumentDownload = async (row: B2COrder, type: DocumentType) => {
    const actionKey = `${row.id}-${type}`
    const { key, url } = getDocumentReference(row, type)
    const source = key || url

    if (!source) {
      toast.open({
        message: `${type[0].toUpperCase()}${type.slice(1)} is not available yet.`,
        severity: 'error',
      })
      return
    }

    setDocumentActionKey(actionKey)
    try {
      let downloadUrl = url || null
      if (!downloadUrl && key) {
        const presignedUrls = await presignDownloads({ keys: [key] })
        downloadUrl = Array.isArray(presignedUrls) ? presignedUrls[0] : null
      }

      if (!downloadUrl) {
        throw new Error(`${type} file not found`)
      }

      await downloadFile(downloadUrl, getDownloadFileName(row, type, source))
    } catch (error) {
      const message = getActionableErrorMessage(
        error,
        `Failed to download ${type}. Please try again.`,
      )
      toast.open({ message, severity: 'error' })
    } finally {
      setDocumentActionKey((current) => (current === actionKey ? null : current))
    }
  }

  const handleRegenerateDocument = async (row: B2COrder, type: 'label' | 'invoice') => {
    if (!isDocumentOperational(row)) {
      toast.open({
        message: `${type === 'label' ? 'Label' : 'Invoice'} can be regenerated after the shipment is booked.`,
        severity: 'info',
      })
      return
    }

    const actionKey = `${row.id}-regenerate-${type}`
    setDocumentActionKey(actionKey)
    try {
      await regenerateDocuments({
        orderId: String(row.id),
        regenerateLabel: type === 'label',
        regenerateInvoice: type === 'invoice',
      })
    } finally {
      setDocumentActionKey((current) => (current === actionKey ? null : current))
    }
  }

  const handleTrackShipment = (row: B2COrder) => {
    const awb = String(row.awb_number || '').trim()
    if (!awb) {
      toast.open({ message: 'Tracking is unavailable until an AWB is assigned.', severity: 'info' })
      return
    }

    window.open(`/tracking?awb=${encodeURIComponent(awb)}`, '_blank', 'noopener,noreferrer')
  }

  const handleSyncLiveStatus = async (row: B2COrder) => {
    const awb = String(row.awb_number || '').trim()
    if (!awb) {
      toast.open({ message: 'Live status sync needs an AWB number.', severity: 'info' })
      return
    }

    setSyncingStatusOrderId(row.id)
    try {
      const tracking = await fetchTracking({ awb })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])
      toast.open({
        message: `Live status checked: ${tracking.status || 'status available'}.`,
        severity: 'success',
      })
    } catch (error) {
      const message = getActionableErrorMessage(
        error,
        'Failed to sync live status. Please try again.',
      )
      toast.open({ message, severity: 'error' })
    } finally {
      setSyncingStatusOrderId((current) => (current === row.id ? null : current))
    }
  }

  const runActionMenuAction = async (action: ActionMenuAction) => {
    const row = actionMenuOrder
    if (!row) return
    handleCloseActionMenu()

    if (action === 'generate-manifest') {
      await handleGenerateManifest(row)
      return
    }

    if (action === 'regenerate-label') {
      await handleRegenerateDocument(row, 'label')
      return
    }

    if (action === 'regenerate-invoice') {
      await handleRegenerateDocument(row, 'invoice')
      return
    }

    if (action === 'download-label') {
      await handleSingleDocumentDownload(row, 'label')
      return
    }

    if (action === 'download-invoice') {
      await handleSingleDocumentDownload(row, 'invoice')
      return
    }

    if (action === 'download-manifest') {
      await handleSingleDocumentDownload(row, 'manifest')
      return
    }

    if (action === 'view-details') {
      setDetailOrder(row)
      return
    }

    if (action === 'cancel-shipment') {
      cancelShipment(String(row.id))
      return
    }

    if (action === 'track-shipment') {
      handleTrackShipment(row)
      return
    }

    if (action === 'sync-live-status') {
      await handleSyncLiveStatus(row)
      return
    }

    if (action === 'ship-now') {
      await handleShipNow(row)
      return
    }

    if (action === 'select-courier') {
      setShopifyOrderForCourier(row)
      return
    }

    if (action === 'reverse-shipment') {
      setReverseOrder(row)
      return
    }

    if (action === 'retry-manifest') {
      await handleRetryManifest(row)
    }
  }

  const columns: Column<B2COrder>[] = [
    {
      label: 'Order',
      id: 'order_number',
      minWidth: 150,
      truncate: false,
      render: (_v, row) => (
        <Stack spacing={0.35}>
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => setDetailOrder(row)}
            sx={{
              alignSelf: 'flex-start',
              border: 0,
              bgcolor: 'transparent',
              p: 0,
              color: '#5D7E96',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {compactId(row.order_number, 20)}
          </Link>
          <StatusChip label={getSourceLabel(row)} status={getSourceStatus(row)} />
          <Typography sx={{ fontSize: 11, color: '#6B7280' }}>{asDate(row.order_date)}</Typography>
        </Stack>
      ),
    },
    {
      label: 'AWB',
      id: 'awb_number',
      minWidth: 140,
      truncate: false,
      render: (_v, row) =>
        row.awb_number ? (
          <Link
            href={`/tracking?awb=${encodeURIComponent(row.awb_number)}`}
            underline="hover"
            sx={{ fontWeight: 800, color: '#5D7E96', fontSize: 13 }}
          >
            {compactId(row.awb_number, 18)}
          </Link>
        ) : (
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>Pending</Typography>
        ),
    },
    {
      label: 'Buyer',
      id: 'buyer_name',
      minWidth: 170,
      truncate: false,
      render: (_v, row) => (
        <Stack spacing={0.25}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{row.buyer_name}</Typography>
          <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
            {row.city}, {row.pincode}
          </Typography>
        </Stack>
      ),
    },
    {
      label: 'Charges',
      id: 'order_amount',
      minWidth: 150,
      truncate: false,
      render: (_v, row) => {
        const customerTotal = Math.max(
          Number(row.order_amount ?? 0) +
            Number(row.shipping_charges ?? 0) +
            Number(row.transaction_fee ?? 0) +
            Number(row.gift_wrap ?? 0) -
            (Number(row.discount ?? 0) + Number(row.prepaid_amount ?? 0)),
          0,
        )
        return (
          <Stack spacing={0.25}>
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{asMoney(customerTotal)}</Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
              Ship {asMoney(row.shipping_charges)} | Fee {asMoney(row.transaction_fee)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
              Gift {asMoney(row.gift_wrap)} | Disc {asMoney(row.discount)}
            </Typography>
          </Stack>
        )
      },
    },
    {
      label: 'Courier / Docs',
      id: 'courier_partner',
      minWidth: 190,
      truncate: false,
      render: (_v, row) => (
        <Stack spacing={0.5}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {row.courier_partner || row.integration_type || empty}
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={hasLabelGenerated(row) ? 'Label' : 'No Label'}
              color={hasLabelGenerated(row) ? 'success' : 'default'}
              sx={{ height: 20, fontSize: 10 }}
            />
            <Chip
              size="small"
              label={hasInvoiceGenerated(row) ? 'Invoice' : 'No Invoice'}
              color={hasInvoiceGenerated(row) ? 'success' : 'default'}
              sx={{ height: 20, fontSize: 10 }}
            />
          </Stack>
        </Stack>
      ),
    },
    {
      label: 'Status / Updated',
      id: 'order_status',
      minWidth: 150,
      truncate: false,
      render: (v, row) => (
        <Stack spacing={0.35}>
          <StatusChip
            label={shippingStatusMap[String(v)] || String(v || 'Unknown')}
            status={statusColorMap[String(v)] || 'info'}
          />
          <Typography sx={{ fontSize: 11, color: '#6B7280' }}>{asDateTime(row.updated_at)}</Typography>
        </Stack>
      ),
    },
    {
      label: 'Actions',
      id: 'id',
      minWidth: 132,
      sticky: 'right',
      stickyOffset: 0,
      render: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<MdMoreVert />}
          endIcon={<MdArrowDropDown />}
          aria-label={`Actions for ${row.order_number || row.awb_number || 'order'}`}
          onClick={(event) => handleOpenActionMenu(event, row)}
          sx={{
            minWidth: 112,
            px: 1.25,
            textTransform: 'none',
            borderRadius: 1.5,
            whiteSpace: 'nowrap',
          }}
        >
          Actions
        </Button>
      ),
    },
  ]

  /* ───────────── Tabs ───────────── */
  const tabs = [
    { label: 'All', value: '' },
    ...Object.entries(shippingStatusMap).map(([value, label]) => ({
      label,
      value,
    })),
  ]

  if (isError) {
    return (
      <Typography color="error" textAlign="center" py={4}>
        Failed to fetch orders
      </Typography>
    )
  }

  return (
    <Stack spacing={2}>
      {/* Top row: Create button */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" gap={2}>
        <Box sx={{ width: { xs: '100%', sm: 220 } }}>
          <CustomSelect
            label="Sort by Created At"
            value={filters.sortOrder || 'desc'}
            onSelect={(value) => {
              const sortOrder = (value as 'asc' | 'desc') || 'desc'
              setFilters((prev) => ({ ...prev, sortBy: 'created_at', sortOrder }))
              setPage(1)
              clearSelection()
              setBulkFeedback(null)
            }}
            items={[
              { key: 'asc', label: 'Newest first' },
              { key: 'desc', label: 'Oldest first' },
            ]}
          />
        </Box>
        <Button variant="contained" color="primary" onClick={handleCreateB2COrder}>
          Create B2C Order
        </Button>
      </Stack>

      {/* 🔹 Status Tabs Row */}
      <SmartTabs tabs={tabs} value={selectedTab} onChange={handleTabChange} />

      {/* 🔹 Advanced Filter Bar */}
      <FilterBar
        fields={filterFields}
        onApply={handleApplyFilters}
        defaultValues={defaultFilterValues}
        appliedCount={Object.values(filters).filter(Boolean).length}
      />

      {bulkFeedback && (
        <Alert
          severity={bulkFeedback.severity}
          onClose={() => setBulkFeedback(null)}
          sx={{ alignItems: 'flex-start' }}
        >
          <AlertTitle>{bulkFeedback.title}</AlertTitle>
          {bulkFeedback.message}
        </Alert>
      )}

      {selectedOrders.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderRadius: '10px',
            border: '1px solid rgba(51, 51, 105, 0.14)',
            backgroundColor: 'rgba(51, 51, 105, 0.04)',
          }}
        >
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            alignItems={{ xs: 'flex-start', lg: 'center' }}
            justifyContent="space-between"
            gap={2}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#333369', fontSize: '15px' }}>
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '13px', mt: 0.5 }}>
                Manifest up to {BULK_MANIFEST_LIMIT} eligible orders at once. Bulk label, invoice,
                and manifest downloads have no selection limit.
              </Typography>
              {manifestValidationMessage && (
                <Typography sx={{ color: '#C0392B', fontSize: '12px', mt: 0.75 }}>
                  {manifestValidationMessage}
                </Typography>
              )}
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={handleBulkManifest}
                loading={bulkManifesting}
                disabled={bulkManifesting || Boolean(manifestValidationMessage)}
                sx={{ textTransform: 'none', minWidth: 170 }}
              >
                {bulkManifesting ? 'Manifesting...' : 'Manifest Selected'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleBulkDownload('label')}
                disabled={downloadingDocumentType !== null}
                sx={{ textTransform: 'none' }}
              >
                {downloadingDocumentType === 'label' ? 'Downloading...' : 'Download Labels'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleBulkDownload('invoice')}
                disabled={downloadingDocumentType !== null}
                sx={{ textTransform: 'none' }}
              >
                {downloadingDocumentType === 'invoice' ? 'Downloading...' : 'Download Invoices'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleBulkDownload('manifest')}
                disabled={downloadingDocumentType !== null}
                sx={{ textTransform: 'none' }}
              >
                {downloadingDocumentType === 'manifest' ? 'Downloading...' : 'Download Manifests'}
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  clearSelection()
                  setBulkFeedback(null)
                }}
                sx={{ textTransform: 'none' }}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* 🔹 Data Table */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        PaperProps={{
          sx: {
            minWidth: 250,
            borderRadius: 1.5,
            border: '1px solid rgba(13, 59, 142, 0.1)',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
            '& .MuiMenuItem-root': {
              minHeight: 40,
              fontSize: 13,
              fontWeight: 650,
              color: '#374151',
            },
          },
        }}
      >
        {actionMenuOrder && (
          <>
            <MenuItem onClick={() => void runActionMenuAction('view-details')}>
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdVisibility size={18} />
              </ListItemIcon>
              View Details
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              disabled={
                !isB2CManifestEligible(actionMenuOrder) ||
                hasManifestGenerated(actionMenuOrder) ||
                bulkManifesting ||
                manifestingOrderId === actionMenuOrder.id
              }
              onClick={() => void runActionMenuAction('generate-manifest')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdReceipt size={18} />
              </ListItemIcon>
              {manifestingOrderId === actionMenuOrder.id ? 'Generating Manifest...' : 'Generate Manifest'}
            </MenuItem>
            <MenuItem
              disabled={
                !isDocumentOperational(actionMenuOrder) ||
                isRegeneratingDocuments ||
                documentActionKey === `${actionMenuOrder.id}-regenerate-label`
              }
              onClick={() => void runActionMenuAction('regenerate-label')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdDescription size={18} />
              </ListItemIcon>
              Regenerate Label
            </MenuItem>
            <MenuItem
              disabled={
                !isDocumentOperational(actionMenuOrder) ||
                isRegeneratingDocuments ||
                documentActionKey === `${actionMenuOrder.id}-regenerate-invoice`
              }
              onClick={() => void runActionMenuAction('regenerate-invoice')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdReceipt size={18} />
              </ListItemIcon>
              Regenerate Invoice
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              disabled={
                (!getDocumentReference(actionMenuOrder, 'label').key &&
                  !getDocumentReference(actionMenuOrder, 'label').url) ||
                documentActionKey === `${actionMenuOrder.id}-label`
              }
              onClick={() => void runActionMenuAction('download-label')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdFileDownload size={18} />
              </ListItemIcon>
              Download Label
            </MenuItem>
            <MenuItem
              disabled={
                (!getDocumentReference(actionMenuOrder, 'invoice').key &&
                  !getDocumentReference(actionMenuOrder, 'invoice').url) ||
                documentActionKey === `${actionMenuOrder.id}-invoice`
              }
              onClick={() => void runActionMenuAction('download-invoice')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdFileDownload size={18} />
              </ListItemIcon>
              Download Invoice
            </MenuItem>
            <MenuItem
              disabled={
                (!getDocumentReference(actionMenuOrder, 'manifest').key &&
                  !getDocumentReference(actionMenuOrder, 'manifest').url) ||
                documentActionKey === `${actionMenuOrder.id}-manifest`
              }
              onClick={() => void runActionMenuAction('download-manifest')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdFileDownload size={18} />
              </ListItemIcon>
              Download Manifest
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              disabled={!isCancellable(actionMenuOrder)}
              onClick={() => void runActionMenuAction('cancel-shipment')}
              sx={{ color: '#B42318 !important' }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: '#B42318' }}>
                <MdCancel size={18} />
              </ListItemIcon>
              Cancel Shipment
            </MenuItem>
            <MenuItem
              disabled={!String(actionMenuOrder.awb_number || '').trim()}
              onClick={() => void runActionMenuAction('track-shipment')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdLocalShipping size={18} />
              </ListItemIcon>
              Track Shipment
            </MenuItem>
            <MenuItem
              disabled={
                !String(actionMenuOrder.awb_number || '').trim() ||
                syncingStatusOrderId === actionMenuOrder.id
              }
              onClick={() => void runActionMenuAction('sync-live-status')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdSync size={18} />
              </ListItemIcon>
              {syncingStatusOrderId === actionMenuOrder.id ? 'Syncing Live Status...' : 'Sync Live Status'}
            </MenuItem>
            <MenuItem
              disabled={
                !canShipNow(actionMenuOrder) ||
                (isDelhiveryShipNow(actionMenuOrder) && !String(actionMenuOrder.awb_number || '').trim()) ||
                isShippingNow
              }
              onClick={() => void runActionMenuAction('ship-now')}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <MdLocalShipping size={18} />
              </ListItemIcon>
              {isShippingNow ? 'Shipping Now...' : 'Ship Now'}
            </MenuItem>
            {(isShopifySyncedOrderReadyForCourier(actionMenuOrder) ||
              (actionMenuOrder.order_status || '').toLowerCase() === 'delivered' ||
              (String(actionMenuOrder.order_status || '').toLowerCase() === 'manifest_failed' &&
                actionMenuOrder.can_retry_manifest === true &&
                String(actionMenuOrder.integration_type || '').toLowerCase() === 'delhivery')) && (
              <Divider sx={{ my: 0.5 }} />
            )}
            {isShopifySyncedOrderReadyForCourier(actionMenuOrder) && (
              <MenuItem onClick={() => void runActionMenuAction('select-courier')}>
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <MdLocalShipping size={18} />
                </ListItemIcon>
                Select Courier
              </MenuItem>
            )}
            {(actionMenuOrder.order_status || '').toLowerCase() === 'delivered' && (
              <MenuItem onClick={() => void runActionMenuAction('reverse-shipment')}>
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <MdLocalShipping size={18} />
                </ListItemIcon>
                Reverse Shipment
              </MenuItem>
            )}
            {String(actionMenuOrder.order_status || '').toLowerCase() === 'manifest_failed' &&
              actionMenuOrder.can_retry_manifest === true &&
              String(actionMenuOrder.integration_type || '').toLowerCase() === 'delhivery' && (
                <MenuItem
                  disabled={retryingManifest}
                  onClick={() => void runActionMenuAction('retry-manifest')}
                >
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    <MdSync size={18} />
                  </ListItemIcon>
                  {retryingManifest
                    ? 'Retrying Manifest...'
                    : `Retry Manifest (${Number(actionMenuOrder.manifest_retries_remaining ?? 0)} left)`}
                </MenuItem>
              )}
          </>
        )}
      </Menu>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable<B2COrder>
          rows={orders}
          columns={columns}
          title="My B2C Orders"
          pagination
          selectable
          currentPage={page}
          defaultRowsPerPage={rowsPerPage}
          totalCount={data?.totalCount || 0}
          onPageChange={(newPage) => {
            setPage(newPage + 1)
            clearSelection()
            setBulkFeedback(null)
          }}
          bgOverlayImg="/images/orders-bg.png"
          onRowsPerPageChange={(newLimit) => {
            setRowsPerPage(newLimit)
            setPage(1)
            clearSelection()
            setBulkFeedback(null)
          }}
          onSelectRows={(ids) => setSelectedOrderIds(ids)}
          selectedRowIds={selectedOrderIds}
          selectionResetToken={selectionResetToken}
        />
      )}

      <ShipmentDetailsDialog
        open={Boolean(detailOrder)}
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
      />

      <ReverseModal
        open={Boolean(reverseOrder)}
        order={reverseOrder}
        onClose={() => setReverseOrder(null)}
        onConfirm={(payload) => {
          createReverse(payload)
          setReverseOrder(null)
        }}
      />

      <ManifestPickupScheduleDialog
        open={pickupDialogOpen}
        title={pickupDialogTitle}
        description={pickupDialogDescription}
        pickupDate={pickupDialogDate}
        pickupTime={pickupDialogTime}
        minDate={getDefaultPickupDateInput()}
        onPickupDateChange={setPickupDialogDate}
        onPickupTimeChange={setPickupDialogTime}
        onCancel={() => closePickupDialog(null)}
        onConfirm={() =>
          closePickupDialog({
            pickup_date: pickupDialogDate,
            pickup_time: normalizePickupTime(pickupDialogTime),
          })
        }
      />

      <ShipNowDialog
        open={shipNowDialogOpen}
        title={shipNowDialogTitle}
        courierLabel={shipNowCourierLabel}
        description={shipNowDialogDescription}
        requiresPickupSchedule={shipNowRequiresPickupSchedule}
        pickupDate={shipNowPickupDate}
        pickupTime={shipNowPickupTime}
        packageCount={shipNowPackageCount}
        pickupAddressId={shipNowPickupAddressId}
        pickupAddresses={warehouses?.pickupAddresses || []}
        onPickupDateChange={setShipNowPickupDate}
        onPickupTimeChange={setShipNowPickupTime}
        onPackageCountChange={setShipNowPackageCount}
        onPickupAddressIdChange={setShipNowPickupAddressId}
        onCancel={() => closeShipNowDialog(null)}
        onConfirm={() =>
          closeShipNowDialog({
            pickup_date: shipNowPickupDate,
            pickup_time: normalizePickupTime(shipNowPickupTime),
            expected_package_count: Math.max(1, Number(shipNowPackageCount) || 1),
            pickup_address_id: shipNowPickupAddressId || undefined,
          })
        }
      />

      <CustomDrawer
        width={drawerWidth}
        open={drawerOpen || Boolean(shopifyOrderForCourier)}
        onClose={() => {
          setDrawerOpen(false)
          setShopifyOrderForCourier(null)
        }}
        title={shopifyOrderForCourier ? 'Select Courier' : 'Create New B2C Order'}
      >
        {shopifyOrderForCourier ? (
          <B2COrderFormSteps
            sourceOrder={shopifyOrderForCourier}
            onClose={() => setShopifyOrderForCourier(null)}
          />
        ) : (
          <B2COrderFormSteps onClose={() => setDrawerOpen(false)} />
        )}
      </CustomDrawer>
    </Stack>
  )
}

export default B2COrdersList
