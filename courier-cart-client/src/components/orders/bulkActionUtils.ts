import { saveAs } from 'file-saver'
import { PDFDocument } from 'pdf-lib'

export type DocumentType = 'label' | 'invoice' | 'manifest'

export type BulkOrderDocumentShape = {
  id: string | number
  type?: 'b2c' | 'b2b'
  order_number?: string | null
  awb_number?: string | null
  order_status?: string | null
  integration_type?: string | null
  courier_partner?: string | null
  label?: string | null
  label_key?: string | null
  label_url?: string | null
  manifest?: string | null
  manifest_key?: string | null
  manifest_url?: string | null
  invoice_link?: string | null
  invoice_key?: string | null
  invoice_url?: string | null
}

export type DocumentEntry = {
  key?: string | null
  url?: string | null
  fileName: string
  orderLabel: string
}

export type ResolvedDocumentEntry = DocumentEntry & {
  downloadUrl: string
}

type ApiLikeError = {
  code?: string
  request?: unknown
  response?: {
    data?: {
      message?: string
      error?: string
    }
  }
  message?: string
}

export const BULK_MANIFEST_LIMIT = 5

const B2C_MANIFESTABLE_STATUSES = new Set([
  'booked',
  'shipment_created',
  'manifest_failed',
  'pickup_initiated',
  'manifest_generated',
])

export const isHttpUrl = (value?: string | null) => typeof value === 'string' && /^https?:\/\//i.test(value)

export const getB2CManifestIdentifier = (order: BulkOrderDocumentShape) => {
  const provider = getB2CManifestProvider(order)

  if (provider === 'ekart' || provider === 'xpressbees') {
    return order.awb_number || null
  }

  return order.order_number || order.awb_number || null
}

export const getB2CManifestProvider = (order: BulkOrderDocumentShape) => {
  const integrationType = String(order.integration_type || '').trim().toLowerCase()
  const courierPartner = String(order.courier_partner || '').trim().toLowerCase()

  if (integrationType.includes('xpressbees') || courierPartner.includes('xpressbees')) {
    return 'xpressbees'
  }

  if (integrationType.includes('ekart') || courierPartner.includes('ekart')) {
    return 'ekart'
  }

  return 'delhivery'
}

export const isB2CManifestEligible = (order: BulkOrderDocumentShape) => {
  const status = String(order.order_status || '').toLowerCase()
  const hasManifest = Boolean(order.manifest || order.manifest_key || order.manifest_url)
  return Boolean(getB2CManifestIdentifier(order)) && B2C_MANIFESTABLE_STATUSES.has(status) && !hasManifest
}

export const isShopifySyncedOrderReadyForCourier = (order: BulkOrderDocumentShape) => {
  const provider = String(order.integration_type || '').trim().toLowerCase()
  const status = String(order.order_status || '').trim().toLowerCase()
  const hasAwb = Boolean(String(order.awb_number || '').trim())

  return provider === 'shopify' && !hasAwb && !['cancelled', 'delivered', 'rto'].includes(status)
}

const sanitizeFileNameSegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const getFileExtension = (value?: string | null) => {
  if (!value) return '.pdf'

  const path = isHttpUrl(value)
    ? (() => {
        try {
          return new URL(value).pathname
        } catch {
          return value
        }
      })()
    : value

  const match = path.match(/\.[a-z0-9]+$/i)
  return match?.[0] || '.pdf'
}

const triggerBrowserDownload = (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const downloadFile = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`)
    }

    const blob = await response.blob()
    saveAs(blob, fileName)
  } catch (error) {
    console.warn('Falling back to browser download for bulk file:', error)
    triggerBrowserDownload(url, fileName)
  }
}

type PresignDownloadsFn = (payload: { keys: string[] }) => Promise<string | string[]>

export const resolveDocumentEntriesForDownload = async (
  entries: DocumentEntry[],
  presignDownloads: PresignDownloadsFn,
) => {
  const keyEntries = entries.filter(
    (entry): entry is DocumentEntry & { key: string } => Boolean(entry.key),
  )
  const directEntries = entries.filter(
    (entry): entry is DocumentEntry & { url: string } => !entry.key && Boolean(entry.url),
  )

  const presignedResult = keyEntries.length
    ? await presignDownloads({ keys: keyEntries.map((entry) => String(entry.key)) })
    : []
  const presignedUrls = Array.isArray(presignedResult) ? presignedResult : [presignedResult]

  const resolvedEntries: ResolvedDocumentEntry[] = []
  const unavailableOrders: string[] = []

  directEntries.forEach((entry) => {
    resolvedEntries.push({
      ...entry,
      downloadUrl: String(entry.url),
    })
  })

  keyEntries.forEach((entry, index) => {
    const resolvedUrl = Array.isArray(presignedUrls) ? presignedUrls[index] : null
    const downloadUrl = resolvedUrl || (entry.url ? String(entry.url) : null)

    if (!downloadUrl) {
      unavailableOrders.push(entry.orderLabel)
      return
    }

    resolvedEntries.push({
      ...entry,
      downloadUrl,
    })
  })

  return { resolvedEntries, unavailableOrders }
}

export const downloadMergedPdf = async (
  entries: ResolvedDocumentEntry[],
  fileName: string,
) => {
  const mergedPdf = await PDFDocument.create()
  const unavailableOrders: string[] = []
  let downloadedCount = 0

  for (const entry of entries) {
    try {
      const response = await fetch(entry.downloadUrl)
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`)
      }

      const sourceBytes = await response.arrayBuffer()
      const sourcePdf = await PDFDocument.load(sourceBytes)
      const pageIndices = sourcePdf.getPageIndices()
      const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices)

      copiedPages.forEach((page) => mergedPdf.addPage(page))
      downloadedCount += 1
    } catch (error) {
      unavailableOrders.push(entry.orderLabel)
      console.warn(`Skipping unavailable label for order ${entry.orderLabel}:`, error)
    }
  }

  if (!downloadedCount || mergedPdf.getPageCount() === 0) {
    return {
      downloadedCount: 0,
      unavailableOrders,
    }
  }

  const mergedBytes = await mergedPdf.save()
  saveAs(new Blob([mergedBytes], { type: 'application/pdf' }), fileName)

  return {
    downloadedCount,
    unavailableOrders,
  }
}

export const getDocumentReference = (order: BulkOrderDocumentShape, type: DocumentType) => {
  if (type === 'label') {
    return {
      key:
        typeof order.label_key === 'string'
          ? order.label_key
          : typeof order.label === 'string' && !isHttpUrl(order.label)
            ? order.label
            : null,
      url: isHttpUrl(order.label_url)
        ? order.label_url
        : isHttpUrl(order.label)
          ? order.label
          : null,
    }
  }

  if (type === 'manifest') {
    return {
      key:
        typeof order.manifest_key === 'string'
          ? order.manifest_key
          : typeof order.manifest === 'string' && !isHttpUrl(order.manifest)
            ? order.manifest
            : null,
      url: isHttpUrl(order.manifest_url)
        ? order.manifest_url
        : isHttpUrl(order.manifest)
          ? order.manifest
          : null,
    }
  }

  return {
    key:
      typeof order.invoice_key === 'string'
        ? order.invoice_key
        : typeof order.invoice_link === 'string' && !isHttpUrl(order.invoice_link)
          ? order.invoice_link
          : null,
    url: isHttpUrl(order.invoice_url)
      ? order.invoice_url
      : isHttpUrl(order.invoice_link)
        ? order.invoice_link
        : null,
  }
}

export const getDownloadFileName = (
  order: BulkOrderDocumentShape,
  type: DocumentType,
  source?: string | null,
) => {
  const baseName =
    sanitizeFileNameSegment(
      String(order.order_number || order.awb_number || `${order.type || 'order'}-${order.id}`),
    ) || `order-${order.id}`

  return `${baseName}-${type}${getFileExtension(source)}`
}

export const getOrderDocumentLabel = (order: BulkOrderDocumentShape) =>
  String(order.order_number || order.awb_number || `${order.type || 'order'}-${order.id}`)

export const getActionableErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiLikeError
  const rawMessage = typeof apiError?.message === 'string' ? apiError.message.trim() : ''
  const responseMessage = apiError?.response?.data?.message
  const responseError = apiError?.response?.data?.error

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage.trim()
  }

  if (typeof responseError === 'string' && responseError.trim()) {
    return responseError.trim()
  }

  if (apiError?.code === 'ECONNABORTED' || /timeout/i.test(rawMessage)) {
    return 'The request is taking longer than expected. Please try again shortly.'
  }

  if (!apiError?.response && (/network error/i.test(rawMessage) || /failed to fetch/i.test(rawMessage))) {
    return 'Could not reach the server. Please check your connection and try again.'
  }

  return (
    rawMessage ||
    fallback
  )
}

export const summarizeOrderNumbers = (
  values: Array<string | number>,
  maxVisible = 5,
) => {
  const normalized = values.map((value) => String(value)).filter(Boolean)
  if (normalized.length <= maxVisible) return normalized.join(', ')

  const visible = normalized.slice(0, maxVisible).join(', ')
  return `${visible} +${normalized.length - maxVisible} more`
}

export const summarizeMessages = (
  values: Array<string | number>,
  maxVisible = 2,
) => {
  const normalized = values.map((value) => String(value).trim()).filter(Boolean)
  if (normalized.length === 0) return ''
  if (normalized.length <= maxVisible) return normalized.join(' ')

  return `${normalized.slice(0, maxVisible).join(' ')} +${normalized.length - maxVisible} more issue(s).`
}
