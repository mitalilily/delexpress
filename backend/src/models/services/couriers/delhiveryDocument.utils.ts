export type DelhiveryDocumentType = 'POD' | 'SorterImage' | 'QCImage' | 'EPOD'

const normalizeType = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const matchesAny = (value: unknown, aliases: string[]) => {
  const normalized = normalizeType(value)
  if (!normalized) return false
  return aliases.some((alias) => normalized === normalizeType(alias))
}

export const normalizeDelhiveryDocumentType = (
  value?: unknown,
): DelhiveryDocumentType | null => {
  if (matchesAny(value, ['pod', 'poddocument'])) return 'POD'
  if (matchesAny(value, ['sorterimage', 'sorter', 'sorterimagepush'])) return 'SorterImage'
  if (matchesAny(value, ['qcimage', 'qc', 'qcimagepush'])) return 'QCImage'
  if (matchesAny(value, ['epod', 'epoddocument', 'epodimage', 'epodpush'])) return 'EPOD'
  return null
}

const readFirstString = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

export const detectDelhiveryDocumentType = (
  payload: any,
  fallback: DelhiveryDocumentType | null = null,
): DelhiveryDocumentType | null => {
  const explicitType = normalizeDelhiveryDocumentType(
    payload?.DocumentType ||
      payload?.documentType ||
      payload?.DocumentKind ||
      payload?.documentKind ||
      payload?.type ||
      payload?.docType,
  )
  if (explicitType) return explicitType

  const shipment = payload?.Shipment || payload?.shipment || payload || {}
  if (shipment?.PODDocument || payload?.PODDocument || shipment?.POD?.DocumentURL || payload?.POD?.DocumentURL) {
    return 'POD'
  }
  if (shipment?.SorterImage || payload?.SorterImage || shipment?.Sorter?.ImageURL || payload?.Sorter?.ImageURL) {
    return 'SorterImage'
  }
  if (shipment?.QCImage || payload?.QCImage || shipment?.QC?.ImageURL || payload?.QC?.ImageURL) {
    return 'QCImage'
  }
  if (
    shipment?.EPOD ||
    payload?.EPOD ||
    shipment?.Epod ||
    payload?.Epod ||
    shipment?.EPODDocument ||
    payload?.EPODDocument ||
    shipment?.EPODURL ||
    payload?.EPODURL
  ) {
    return 'EPOD'
  }

  return fallback
}

export const extractDelhiveryDocumentReference = (
  payload: any,
  documentType: DelhiveryDocumentType | null,
): string | null => {
  const shipment = payload?.Shipment || payload?.shipment || payload || {}
  const docType = documentType || detectDelhiveryDocumentType(payload)

  const candidateValues = (() => {
    switch (docType) {
      case 'POD':
        return [
          shipment?.PODDocument,
          payload?.PODDocument,
          shipment?.POD?.DocumentURL,
          payload?.POD?.DocumentURL,
          shipment?.DocumentURL,
          payload?.DocumentURL,
          shipment?.URL,
          payload?.URL,
        ]
      case 'SorterImage':
        return [
          shipment?.SorterImage,
          payload?.SorterImage,
          shipment?.Sorter?.ImageURL,
          payload?.Sorter?.ImageURL,
          shipment?.ImageURL,
          payload?.ImageURL,
          shipment?.URL,
          payload?.URL,
        ]
      case 'QCImage':
        return [
          shipment?.QCImage,
          payload?.QCImage,
          shipment?.QC?.ImageURL,
          payload?.QC?.ImageURL,
          shipment?.ImageURL,
          payload?.ImageURL,
          shipment?.URL,
          payload?.URL,
        ]
      case 'EPOD':
        return [
          shipment?.EPOD,
          payload?.EPOD,
          shipment?.Epod,
          payload?.Epod,
          shipment?.EPODDocument,
          payload?.EPODDocument,
          shipment?.EPODURL,
          payload?.EPODURL,
          shipment?.DocumentURL,
          payload?.DocumentURL,
          shipment?.ImageURL,
          payload?.ImageURL,
          shipment?.URL,
          payload?.URL,
        ]
      default:
        return [
          shipment?.DocumentURL,
          payload?.DocumentURL,
          shipment?.ImageURL,
          payload?.ImageURL,
          shipment?.URL,
          payload?.URL,
        ]
    }
  })()

  return readFirstString(...candidateValues) || null
}

export const isDelhiveryDocumentWebhookPayload = (payload: any) =>
  Boolean(detectDelhiveryDocumentType(payload))
