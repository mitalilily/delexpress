import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import { EkartConfig, getEffectiveCourierConfig } from '../courierCredentials.service'
import { reserveEkartWaybill, resolveEkartWaybillBucket } from '../ekartWaybill.service'

export type EkartServiceabilityDetail = {
  status: boolean
  pincode: number
  remark?: string
  details?: {
    cod?: boolean
    max_cod_amount?: number
    forward_pickup?: boolean
    forward_drop?: boolean
    reverse_pickup?: boolean
    reverse_drop?: boolean
    city?: string
    state?: string
  }
}

export type EkartCreateShipmentResponse = {
  status: boolean
  remark?: string
  tracking_id?: string
  vendor?: string
  barcodes?: {
    wbn?: string
    order?: string
    cod?: string
  }
}

export type EkartPairServiceabilityResponse = {
  serviceable: boolean
  availability: Record<string, any> | null
  records: any[]
  codAvailable: boolean
  prepaidAvailable: boolean
  tat: number | null
  raw: any
}

export type EkartTrackResponse = {
  _id: string
  track: {
    status: string
    ctime: number
    pickupTime?: number
    desc?: string
    location?: string
    ndrStatus?: string
    attempts?: number
    ndrActions?: string[]
    details?: any[]
  }
  edd?: number
  order_number?: string
}

export type EkartRawTrackResponse = Record<
  string,
  {
    shipment_type?: string
    cod_amount?: string
    shipment_id?: string
    shipment_value?: string
    order_id?: string
    external_tracking_id?: string
    delivery_type?: string
    weight?: string
    delivered?: boolean
    merchant_name?: string
    history?: any[]
    receiver?: Record<string, any>
    current_hub?: Record<string, any>
    assigned_hub?: Record<string, any>
    sender?: Record<string, any>
    customer?: Record<string, any>
    items?: any[]
    vendor?: string
    mh_inscanned?: boolean
    rto_detail?: any
    slotted_delivery?: boolean
    expected_delivery_slot?: Record<string, any>
    expected_delivery_date?: string
    rto?: boolean
    shipment_notes?: any[]
    shipment_tickets?: any
    [key: string]: any
  }
>

type EkartAuthResponse = {
  access_token?: string
  scope?: string
  expires_in?: number | string
  token_type?: string
}

export type EkartUpdateDispatchDateResponse = {
  data?: Record<string, any>[]
  [key: string]: any
}

export type EkartUpdateEwbnResponse = {
  status?: boolean
  remark?: string
  tracking_id?: string
  [key: string]: any
}

export type EkartLabelJsonResponse = {
  status?: boolean
  data?: any[]
  [key: string]: any
}

export type EkartLabelResponse = EkartLabelJsonResponse | ArrayBuffer

export type EkartShippingRateEstimateRequest = {
  pickupPincode: number | string
  dropPincode: number | string
  invoiceAmount?: number | string
  weight: number | string
  length: number | string
  height: number | string
  width: number | string
  serviceType: 'SURFACE' | 'EXPRESS'
  codAmount?: number | string
  packages?: Record<string, any>[]
}

export type EkartShippingRateEstimateResponse = {
  type?: string
  zone?: string
  volumetricWeight?: string
  billingWeight?: string
  shippingCharge?: string
  rtoCharge?: string
  fuelSurcharge?: string
  codCharge?: string
  qcCharge?: string
  taxes?: string
  total?: string
  rid?: string
  rSnapshotId?: string
  [key: string]: any
}

export type EkartGenerateManifestResponse = {
  ctime?: number
  manifestNumber?: number | string
  manifestDownloadUrl?: string
  [key: string]: any
}

export type EkartAddressRequest = {
  alias: string
  phone: string | number
  address_line1: string
  address_line2?: string | null
  pincode: string | number
  city?: string | null
  state: string
  country?: 'India' | 'IN' | string
  geo?: { lat?: number; lon?: number }
}

export type EkartAddressResponse = {
  status?: boolean
  alias?: string
  remark?: string
  [key: string]: any
}

export type EkartSavedAddress = {
  alias?: string
  phone?: number
  address_line1?: string
  address_line2?: string | null
  pincode?: number
  city?: string | null
  state?: string
  country?: string
  geo?: Record<string, any>
  [key: string]: any
}

export type EkartNdrActionRequest = {
  action: 'Re-Attempt' | 'RTO'
  wbn: string
  date?: number
  phone?: string
  address?: string
  instructions?: string
  links?: string[]
}

export type EkartNdrActionResponse = {
  status?: boolean
  remark?: string
  tracking_id?: string
  [key: string]: any
}

export type EkartWebhook = {
  url?: string
  secret?: string
  topics?: EkartWebhookTopic[]
  active?: boolean
  id?: string
  [key: string]: any
}

export type EkartWebhookTopic = 'track_updated' | 'shipment_created' | 'shipment_recreated'

export type EkartWebhookRequest = {
  url?: string
  secret?: string
  topics?: EkartWebhookTopic[]
  active?: boolean
}

export type EkartBulkServiceabilityType = 'NON_LARGE' | 'LARGE'

export type EkartBulkServiceabilityFormat = 'JSON' | 'EXCEL'

export type EkartBulkServiceabilityResponse = {
  serviceability?: any[]
  [key: string]: any
} | ArrayBuffer

export class EkartService {
  private baseApi: string = process.env.EKART_BASE_API || 'https://app.elite.ekartlogistics.in'
  private baseAuth: string = process.env.EKART_BASE_AUTH || 'https://app.elite.ekartlogistics.in'
  private clientId = process.env.EKART_CLIENT_ID || ''
  private username = process.env.EKART_USERNAME || ''
  private password = process.env.EKART_PASSWORD || ''

  private token: string | null = null
  private tokenType: string = 'Bearer'
  private tokenExpiry: number | null = null
  private static cachedConfig: EkartConfig | null | undefined

  private log(prefix: string, details: any) {
    console.log(`[Ekart] ${prefix}`, details)
  }

  private maskPhone(value: any) {
    const normalized = String(value ?? '').replace(/\D/g, '')
    if (!normalized) return ''
    if (normalized.length <= 4) return normalized
    return `${normalized.slice(0, 2)}****${normalized.slice(-2)}`
  }

  private sanitizeShipmentPayload(payload: any) {
    return {
      payload_keys: payload && typeof payload === 'object' ? Object.keys(payload).sort() : [],
      order_number: payload?.order_number,
      wbn: payload?.wbn ?? payload?.awb_number ?? payload?.tracking_id ?? null,
      waybill_number: payload?.waybill_number ?? null,
      awb_number: payload?.awb_number ?? null,
      user_input_wbn: payload?.user_input?.wbn ?? payload?.userInput?.wbn ?? null,
      package_wbn: payload?.package?.wbn ?? null,
      packages_wbns: Array.isArray(payload?.packages)
        ? payload.packages.map(
            (pkg: any) => pkg?.wbn ?? pkg?.waybill_number ?? pkg?.awb_number ?? null,
          )
        : [],
      shipment_wbn: payload?.shipment?.wbn ?? null,
      shipments_wbns: Array.isArray(payload?.shipments)
        ? payload.shipments.map((shipment: any) =>
            shipment?.wbn ?? shipment?.waybill_number ?? shipment?.awb_number ?? null,
          )
        : [],
      ewbn: payload?.ewbn ?? null,
      payment_type: payload?.payment_type ?? payload?.payment_mode ?? null,
      courier_id: payload?.courier_id ?? null,
      package_weight:
        payload?.package_weight ?? payload?.package?.weight ?? payload?.weight ?? null,
      package_length:
        payload?.package_length ?? payload?.package?.length ?? payload?.length ?? null,
      package_breadth:
        payload?.package_breadth ?? payload?.package?.breadth ?? payload?.width ?? null,
      package_height:
        payload?.package_height ?? payload?.package?.height ?? payload?.height ?? null,
      order_amount: payload?.order_amount ?? payload?.total_amount ?? null,
      collectable_amount: payload?.collectable_amount ?? payload?.cod_amount ?? null,
      tax_value: payload?.tax_value ?? payload?.taxValue ?? null,
      consignee_gst_amount: payload?.consignee_gst_amount ?? payload?.consigneeGstAmount ?? null,
      invoice_number: payload?.invoice_number ?? null,
      invoice_date: payload?.invoice_date ?? null,
      invoice_amount: payload?.invoice_amount ?? payload?.total_amount ?? null,
      seller_name: payload?.seller_name ?? null,
      consignee_name:
        payload?.consignee_name ?? payload?.drop?.name ?? payload?.drop_location?.name ?? null,
      consignee_phone: this.maskPhone(
        payload?.consignee_phone ??
          payload?.consignee_alternate_phone ??
          payload?.drop?.phone ??
          payload?.drop_location?.phone,
      ),
      payment_mode: payload?.payment_mode ?? null,
      products_desc: payload?.products_desc ?? null,
      category_of_goods: payload?.category_of_goods ?? null,
      hsn_code: payload?.hsn_code ?? null,
      quantity: payload?.quantity ?? null,
      weight: payload?.weight ?? null,
      length: payload?.length ?? null,
      width: payload?.width ?? null,
      height: payload?.height ?? null,
      taxable_amount: payload?.taxable_amount ?? null,
      commodity_value: payload?.commodity_value ?? null,
      cod_amount: payload?.cod_amount ?? payload?.collectable_amount ?? null,
      pickup: payload?.pickup
        ? {
            name: payload.pickup.name ?? payload.seller_name ?? null,
            city: payload.pickup.city,
            state: payload.pickup.state,
            pincode: payload.pickup.pincode,
            phone: this.maskPhone(payload.pickup.phone),
          }
        : payload?.pickup_location
          ? {
              name: payload.pickup_location.name ?? payload.seller_name ?? null,
              city: payload.pickup_location.city ?? null,
              state: payload.pickup_location.state ?? null,
              pincode: payload.pickup_location.pin ?? null,
              phone: this.maskPhone(payload.pickup_location.phone),
            }
          : null,
      consignee:
        payload?.drop || payload?.drop_location
          ? {
              name: payload?.drop?.name ?? payload?.drop_location?.name ?? null,
              city: payload?.drop?.city ?? payload?.drop_location?.city ?? null,
              state: payload?.drop?.state ?? payload?.drop_location?.state ?? null,
              pincode: payload?.drop?.pincode ?? payload?.drop_location?.pin ?? null,
              phone: this.maskPhone(payload?.drop?.phone ?? payload?.drop_location?.phone),
            }
          : null,
      pickup_location: payload?.pickup_location
        ? {
            name: payload.pickup_location.name ?? null,
            location_type: payload.pickup_location.location_type ?? null,
            city: payload.pickup_location.city ?? null,
            state: payload.pickup_location.state ?? null,
            pin: payload.pickup_location.pin ?? null,
            phone: this.maskPhone(payload.pickup_location.phone),
          }
        : null,
      drop_location: payload?.drop_location
        ? {
            name: payload.drop_location.name ?? null,
            location_type: payload.drop_location.location_type ?? null,
            city: payload.drop_location.city ?? null,
            state: payload.drop_location.state ?? null,
            pin: payload.drop_location.pin ?? null,
            phone: this.maskPhone(payload.drop_location.phone),
          }
        : null,
      return_location: payload?.return_location
        ? {
            name: payload.return_location.name ?? null,
            location_type: payload.return_location.location_type ?? null,
            city: payload.return_location.city ?? null,
            state: payload.return_location.state ?? null,
            pin: payload.return_location.pin ?? null,
            phone: this.maskPhone(payload.return_location.phone),
          }
        : null,
      order_items_count: Array.isArray(payload?.items)
        ? payload.items.length
        : Array.isArray(payload?.order_items)
          ? payload.order_items.length
          : 0,
    }
  }

  private toNumber(value: any, fallback = 0) {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : fallback
  }

  private deriveTaxValue(payload: any) {
    const directTaxValue = this.toNumber(payload?.tax_value ?? payload?.taxValue, NaN)
    if (Number.isFinite(directTaxValue) && directTaxValue >= 0) {
      return Number(directTaxValue.toFixed(2))
    }

    const items = Array.isArray(payload?.order_items) ? payload.order_items : []
    const computed = items.reduce((sum: number, item: any) => {
      const qty = this.toNumber(item?.qty ?? item?.quantity, 1)
      const price = this.toNumber(item?.price, 0)
      const discount = this.toNumber(item?.discount, 0)
      const taxRate = this.toNumber(item?.tax_rate ?? item?.taxRate, 0)
      const lineTaxableValue = Math.max(0, price * qty - discount)
      return sum + lineTaxableValue * (taxRate / 100)
    }, 0)

    return Number(Math.max(0, computed).toFixed(2))
  }

  private getNormalizedInvoiceDate(payload: any) {
    const rawValue = String(payload?.invoice_date ?? '').trim()
    if (rawValue) {
      const isoDateMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})/)
      if (isoDateMatch) return isoDateMatch[1]

      const parsed = new Date(rawValue)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10)
      }
    }

    return new Date().toISOString().slice(0, 10)
  }

  private sanitizeText(value: any, fallback = '') {
    const normalized = String(value ?? '').trim()
    return normalized || fallback
  }

  private sanitizePhoneNumber(value: any, fallback = '') {
    const digits = String(value ?? '').replace(/\D/g, '')
    if (!digits) return fallback
    return digits.length <= 10 ? digits : digits.slice(-10)
  }

  private normalizeWeightToGrams(value: any, fallbackGrams = 500) {
    const numeric = this.toNumber(value, NaN)
    if (!Number.isFinite(numeric) || numeric <= 0) return fallbackGrams
    // Order forms in our app store package_weight in kg; API rate checks may already use grams.
    return Math.max(1, Math.round(numeric <= 50 ? numeric * 1000 : numeric))
  }

  private normalizeWeightToKilograms(value: any, fallbackKg = 0.5) {
    const numeric = this.toNumber(value, NaN)
    if (!Number.isFinite(numeric) || numeric <= 0) return fallbackKg
    return numeric <= 50 ? numeric : numeric / 1000
  }

  private normalizeDimensionCm(value: any, fallbackCm = 10) {
    const numeric = this.toNumber(value, NaN)
    if (!Number.isFinite(numeric) || numeric <= 0) return fallbackCm
    return Math.max(1, Math.round(numeric))
  }

  private normalizePin(value: any, fallback = 0) {
    const digits = String(value ?? '').replace(/\D/g, '')
    if (!digits) return fallback
    return Number(digits.slice(0, 6))
  }

  private normalizePhoneInt(value: any, fallback = 1000000000) {
    const digits = this.sanitizePhoneNumber(value)
    const phone = Number(digits)
    return Number.isInteger(phone) && phone >= 1000000000 ? phone : fallback
  }

  private normalizeCountry(value: any) {
    const country = this.sanitizeText(value, 'India')
    return country.toLowerCase() === 'in' ? 'IN' : country
  }

  private buildEkartLocation(
    contact: {
      name?: string
      phone?: string
      address1?: string
      address2?: string
      city?: string
      state?: string
      pincode?: number
    },
    fallbackAlias?: string,
    locationType?: string,
    country?: string,
    options?: {
      preferAliasName?: boolean
    },
  ) {
    const aliasName = this.sanitizeText(fallbackAlias)
    const contactName = this.sanitizeText(contact?.name)
    const name =
      options?.preferAliasName && aliasName
        ? aliasName
        : this.sanitizeText(contactName, aliasName || 'Location')
    const address = this.sanitizeText(contact?.address1)
    const address2 = this.sanitizeText(contact?.address2)
    const city = this.sanitizeText(contact?.city)
    const state = this.sanitizeText(contact?.state)
    const pin = this.normalizePin(contact?.pincode)
    const phone = this.normalizePhoneInt(contact?.phone)
    const normalizedCountry = this.normalizeCountry(country)
    const normalizedLocationType = this.sanitizeText(locationType, 'Office')

    const hasFullAddress = Boolean(address && city && state && pin)

    if (!hasFullAddress && fallbackAlias) {
      return {
        name,
      }
    }

    return {
      location_type: normalizedLocationType,
      name,
      address,
      city,
      state,
      country: normalizedCountry,
      phone,
      pin,
      ...(address2 ? { address_2: address2 } : {}),
    }
  }

  private getEkartDimensions(payload: any) {
    if (this.sanitizeText(payload?.templateName)) {
      return {}
    }

    return {
      length: this.normalizeDimensionCm(payload?.package_length),
      height: this.normalizeDimensionCm(payload?.package_height),
      width: this.normalizeDimensionCm(payload?.package_breadth ?? payload?.package_width),
    }
  }

  private async buildEkartShipmentPayload(payload: any) {
    const paymentMode =
      String(payload?.payment_type || '').toLowerCase() === 'cod'
        ? 'COD'
        : String(payload?.payment_type || '').toLowerCase() === 'reverse'
          ? 'Pickup'
          : 'Prepaid'

    const rawItems = Array.isArray(payload?.order_items) ? payload.order_items : []
    const normalizedItems = rawItems
      .map((item: any) => {
        const quantity = this.toNumber(item?.qty ?? item?.quantity, 1)
        const price = this.toNumber(item?.price, 0)
        const discount = this.toNumber(item?.discount, 0)
        const taxRate = this.toNumber(item?.tax_rate ?? item?.taxRate, 0)
        const directTaxValue = this.toNumber(item?.tax_value ?? item?.taxValue, NaN)
        const taxableAmount = Math.max(0, price * quantity - discount)
        const taxValue = Number.isFinite(directTaxValue)
          ? directTaxValue
          : Number((taxableAmount * (taxRate / 100)).toFixed(2))

        const itemQuantity = quantity > 0 ? quantity : 1
        const productName = this.sanitizeText(item?.product_name || item?.name, 'Product')
        const productSku = this.sanitizeText(item?.product_sku || item?.sku, 'SKU')
        const hsn = this.sanitizeText(item?.hsn ?? item?.hsnCode)
        const itemTaxValue = Math.max(0, taxValue)

        return {
          product_name: productName,
          product_sku: productSku,
          product_desc: this.sanitizeText(item?.product_desc || item?.description, productName),
          quantity: itemQuantity,
          product_quantity: itemQuantity,
          price,
          product_price: price,
          product_value: Math.max(1, Number((price * itemQuantity).toFixed(2))),
          hsn,
          hsn_code: hsn || undefined,
          tax_value: itemTaxValue,
        }
      })
      .filter((item: any) => item.quantity > 0)

    if (!normalizedItems.length) {
      normalizedItems.push({
        product_name: 'Package',
        product_sku: 'PKG',
        product_desc: 'Package',
        quantity: 1,
        product_quantity: 1,
        price: this.toNumber(payload?.order_amount, 0),
        product_price: this.toNumber(payload?.order_amount, 0),
        product_value: Math.max(1, this.toNumber(payload?.order_amount, 0)),
        hsn: '',
        hsn_code: undefined,
        tax_value: 0,
      })
    }

    const totalQuantity = normalizedItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
    const itemSubtotal = normalizedItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    )
    const totalTaxValue = Number(
      normalizedItems
        .reduce((sum: number, item: any) => sum + this.toNumber(item.tax_value, 0), 0)
        .toFixed(2),
    )
    const orderAmount = this.toNumber(payload?.order_amount ?? payload?.invoice_amount, 0)
    const computedTotalAmount = orderAmount > 0 ? orderAmount : itemSubtotal + totalTaxValue
    const taxableAmount = Math.max(1, Number((computedTotalAmount - totalTaxValue).toFixed(2)))
    const codAmount = paymentMode === 'COD' ? computedTotalAmount : 0
    const packageWeightGrams = this.normalizeWeightToGrams(payload?.package_weight)
    const packageWeightKg = this.normalizeWeightToKilograms(payload?.package_weight)
    const packageDimensions = this.getEkartDimensions(payload)
    const providedWaybill = this.sanitizeText(
      payload?.wbn || payload?.waybill_number || payload?.awb_number,
    )
    const generatedWaybill =
      paymentMode === 'Pickup'
        ? ''
        : await reserveEkartWaybill(
            resolveEkartWaybillBucket(payload?.payment_type, packageWeightKg),
          )
    const resolvedWaybill = providedWaybill || generatedWaybill
    if (paymentMode !== 'Pickup' && !resolvedWaybill) {
      throw new HttpError(500, 'Ekart waybill could not be reserved for shipment manifestation')
    }
    const resolvedEwbn = this.sanitizeText(
      payload?.ewbn || payload?.ewaybill_number || payload?.ewb || payload?.ewbn_number,
    )

    const sellerName = this.sanitizeText(
      payload?.company?.name || payload?.pickup?.name,
      'ExpressoPro',
    )
    const sellerAddress = [
      this.sanitizeText(payload?.pickup?.address),
      this.sanitizeText(payload?.pickup?.address_2),
      this.sanitizeText(payload?.pickup?.city),
      this.sanitizeText(payload?.pickup?.state),
    ]
      .filter(Boolean)
      .join(', ')

    const consigneeName = this.sanitizeText(payload?.consignee?.name, 'Consignee')
    const consigneePhone = this.sanitizePhoneNumber(payload?.consignee?.phone)
    const consigneePhoneInt = this.normalizePhoneInt(payload?.consignee?.phone)
    const pickupPhone = this.sanitizePhoneNumber(payload?.pickup?.phone)
    const returnPhone = this.sanitizePhoneNumber(payload?.rto?.phone || payload?.pickup?.phone)

    const pickupContact = {
      name: this.sanitizeText(payload?.pickup?.name, sellerName),
      phone: pickupPhone,
      address1: this.sanitizeText(payload?.pickup?.address),
      address2: this.sanitizeText(payload?.pickup?.address_2),
      city: this.sanitizeText(payload?.pickup?.city),
      state: this.sanitizeText(payload?.pickup?.state),
      pincode: this.normalizePin(payload?.pickup?.pincode),
    }

    const dropContact = {
      name: consigneeName,
      phone: consigneePhone,
      address1: this.sanitizeText(payload?.consignee?.address),
      address2: this.sanitizeText(payload?.consignee?.address_2),
      city: this.sanitizeText(payload?.consignee?.city),
      state: this.sanitizeText(payload?.consignee?.state),
      pincode: this.normalizePin(payload?.consignee?.pincode),
    }

    const returnContact = {
      name: this.sanitizeText(payload?.rto?.name, pickupContact.name),
      phone: returnPhone,
      address1: this.sanitizeText(payload?.rto?.address, pickupContact.address1),
      address2: this.sanitizeText(payload?.rto?.address_2, pickupContact.address2),
      city: this.sanitizeText(payload?.rto?.city, pickupContact.city),
      state: this.sanitizeText(payload?.rto?.state, pickupContact.state),
      pincode: this.normalizePin(payload?.rto?.pincode || payload?.pickup?.pincode),
    }

    const invoiceDate = this.getNormalizedInvoiceDate(payload)
    const invoiceNumber = this.sanitizeText(payload?.invoice_number || payload?.order_number)
    const categoryOfGoods = this.sanitizeText(
      payload?.category_of_goods ||
        normalizedItems.map((item: any) => item.product_name).join(', '),
      'General Merchandise',
    )
    const hsnCode = this.sanitizeText(
      payload?.hsn_code || normalizedItems.map((item: any) => item.hsn).find(Boolean),
    )
    const templateName = this.sanitizeText(payload?.templateName)
    const pickupLocationAlias = this.sanitizeText(
      payload?.pickup_location_alias || payload?.pickup?.warehouse_name || payload?.pickup?.name,
      pickupContact.name,
    )
    const returnLocationAlias = this.sanitizeText(
      payload?.return_location_alias || payload?.rto?.warehouse_name || returnContact.name,
      returnContact.name,
    )
    const pickupLocation = this.buildEkartLocation(
      pickupContact,
      pickupLocationAlias,
      payload?.pickup_location?.location_type || payload?.pickup?.location_type,
      payload?.pickup?.country,
      { preferAliasName: true },
    )
    const dropLocation = this.buildEkartLocation(
      dropContact,
      consigneeName,
      payload?.drop_location?.location_type || payload?.consignee?.location_type,
      payload?.consignee?.country,
    )
    const returnLocation = this.buildEkartLocation(
      returnContact,
      returnLocationAlias || pickupLocationAlias,
      payload?.return_location?.location_type || payload?.rto?.location_type,
      payload?.rto?.country || payload?.pickup?.country,
      { preferAliasName: true },
    )

    const itemsWithWaybill = normalizedItems.map((item: any) => ({
      ...item,
      ...(resolvedWaybill
        ? {
            wbn: resolvedWaybill,
            waybill_number: resolvedWaybill,
            awb_number: resolvedWaybill,
          }
        : {}),
    }))

    const packagePayload = {
      ...(resolvedWaybill
        ? {
            wbn: resolvedWaybill,
            waybill_number: resolvedWaybill,
            awb_number: resolvedWaybill,
          }
        : {}),
      count: totalQuantity || 1,
      weight: packageWeightGrams,
      ...packageDimensions,
      items: itemsWithWaybill,
    }

    return {
      order_number: payload?.order_number,
      ...(resolvedWaybill
        ? {
            wbn: resolvedWaybill,
            waybill_number: resolvedWaybill,
            awb_number: resolvedWaybill,
            user_input: {
              wbn: resolvedWaybill,
            },
            userInput: {
              wbn: resolvedWaybill,
            },
          }
        : {}),
      ...(resolvedEwbn
        ? {
            ewbn: resolvedEwbn,
          }
        : {}),
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      document_number: this.sanitizeText(payload?.document_number) || undefined,
      document_date: this.sanitizeText(payload?.document_date) || undefined,
      seller_name: sellerName,
      seller_address: sellerAddress || this.sanitizeText(payload?.pickup?.address, pickupLocationAlias),
      seller_gst_tin: this.sanitizeText(
        payload?.company?.gst || payload?.pickup?.gst_number,
        'URP',
      ),
      seller_gst_amount: totalTaxValue,
      consignee_name: consigneeName,
      consignee_phone: consigneePhone,
      consignee_alternate_phone: consigneePhone || '9999999999',
      consignee_gst_tin: this.sanitizeText(payload?.consignee?.gstin),
      consignee_gst_amount: totalTaxValue,
      integrated_gst_amount: 0,
      category_of_goods: categoryOfGoods,
      hsn_code: hsnCode || undefined,
      products_desc: normalizedItems.map((item: any) => item.product_name).join(', '),
      payment_mode: paymentMode,
      return_reason:
        paymentMode === 'Pickup'
          ? this.sanitizeText(payload?.return_reason, 'Reverse pickup')
          : undefined,
      cod_amount: codAmount,
      total_amount: computedTotalAmount,
      tax_value: totalTaxValue,
      taxable_amount: taxableAmount,
      commodity_value: String(taxableAmount),
      quantity: totalQuantity || 1,
      templateName: templateName || undefined,
      weight: packageWeightGrams,
      ...packageDimensions,
      pickup_location: pickupLocation,
      drop_location: dropLocation,
      return_location: returnLocation,
      preferred_dispatch_date: this.sanitizeText(payload?.preferred_dispatch_date) || undefined,
      delayed_dispatch:
        typeof payload?.delayed_dispatch === 'boolean' ? payload.delayed_dispatch : undefined,
      obd_shipment: typeof payload?.obd_shipment === 'boolean' ? payload.obd_shipment : undefined,
      mps: typeof payload?.mps === 'boolean' ? payload.mps : undefined,
      qc_details: payload?.qc_details || undefined,
      what3words_address: this.sanitizeText(payload?.what3words_address) || undefined,
      package: packagePayload,
      packages: [packagePayload],
      shipment: {
        ...(resolvedWaybill
          ? {
              wbn: resolvedWaybill,
              waybill_number: resolvedWaybill,
              awb_number: resolvedWaybill,
            }
          : {}),
      },
      shipments: [
        {
          ...(resolvedWaybill
            ? {
                wbn: resolvedWaybill,
                waybill_number: resolvedWaybill,
                awb_number: resolvedWaybill,
              }
            : {}),
        },
      ],
      items: itemsWithWaybill,
    }
  }

  private extractErrorMessage(err: any, fallback: string) {
    const candidates = [
      err?.response?.data?.description,
      err?.response?.data?.message,
      err?.response?.data?.remark,
      err?.response?.data?.error,
      err?.response?.data?.details?.message,
      err?.message,
    ]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }

    return fallback
  }

  private async ensureConfigLoaded() {
    if (EkartService.cachedConfig === undefined) {
      EkartService.cachedConfig = await getEffectiveCourierConfig<EkartConfig>('ekart', 'b2c')
    }
    const cfg = EkartService.cachedConfig
    if (cfg) {
      this.clientId = cfg.clientId || this.clientId
      this.username = cfg.username || this.username
      this.password = cfg.password || this.password
      this.baseApi = cfg.baseApi || this.baseApi
      this.baseAuth = cfg.baseAuth || this.baseAuth
    }
  }

  private async getHttp(): Promise<AxiosInstance> {
    const token = await this.getAccessToken()
    return axios.create({
      baseURL: this.baseApi,
      headers: {
        Authorization: `${this.tokenType} ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    })
  }

  private async getOpenHttp(): Promise<AxiosInstance> {
    await this.ensureConfigLoaded()
    return axios.create({
      baseURL: this.baseApi,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    })
  }

  private async getAccessToken(): Promise<string> {
    await this.ensureConfigLoaded()

    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) return this.token

    if (!this.clientId || !this.username || !this.password) {
      throw new HttpError(500, 'Ekart credentials are not configured')
    }

    const url = `${this.baseAuth}/integrations/v2/auth/token/${this.clientId}`
    this.log('Auth attempt', {
      url,
      clientId: this.clientId,
      username: this.username,
    })

    let res
    try {
      res = await axios.post<EkartAuthResponse>(
        url,
        { username: this.username, password: this.password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000,
        },
      )
    } catch (err: any) {
      this.log('Auth failed', {
        url,
        status: err?.response?.status || null,
        statusText: err?.response?.statusText || null,
        response: err?.response?.data || null,
        message: err?.message || err,
      })
      throw new HttpError(
        Number(err?.response?.status || 502),
        this.extractErrorMessage(err, 'Ekart authentication failed'),
      )
    }

    const { access_token, expires_in, token_type } = res.data || {}

    if (!access_token || !token_type) {
      throw new Error('Invalid Ekart auth response')
    }

    this.token = access_token
    this.tokenType = token_type
    this.tokenExpiry = Date.now() + (expires_in ? Number(expires_in) * 1000 : 23 * 60 * 60 * 1000)
    return this.token || ''
  }

  // ---------- Serviceability ----------
  async checkPincodeServiceability(pincode: string | number): Promise<EkartServiceabilityDetail> {
    const normalizedPincode = Number(pincode)

    if (!Number.isInteger(normalizedPincode) || normalizedPincode <= 0) {
      throw new HttpError(400, 'Ekart serviceability pincode must be a positive integer')
    }

    const http = await this.getHttp()
    const res = await http.get(`/api/v2/serviceability/${normalizedPincode}`)
    return res.data
  }

  async estimateShippingRates(
    payload: EkartShippingRateEstimateRequest,
  ): Promise<EkartShippingRateEstimateResponse> {
    const toRequiredInteger = (value: number | string | undefined, field: string) => {
      const normalized = Number(value)
      if (!Number.isInteger(normalized) || normalized <= 0) {
        throw new HttpError(400, `Ekart ${field} must be a positive integer`)
      }
      return normalized
    }

    const toOptionalNumber = (value: number | string | undefined, field: string) => {
      if (value === undefined || value === null || value === '') return undefined
      const normalized = Number(value)
      if (!Number.isFinite(normalized) || normalized < 0) {
        throw new HttpError(400, `Ekart ${field} must be a non-negative number`)
      }
      return normalized
    }

    if (!['SURFACE', 'EXPRESS'].includes(payload.serviceType)) {
      throw new HttpError(400, 'Ekart serviceType must be SURFACE or EXPRESS')
    }

    const requestPayload = {
      pickupPincode: toRequiredInteger(payload.pickupPincode, 'pickupPincode'),
      dropPincode: toRequiredInteger(payload.dropPincode, 'dropPincode'),
      invoiceAmount: toOptionalNumber(payload.invoiceAmount, 'invoiceAmount'),
      weight: toRequiredInteger(payload.weight, 'weight'),
      length: toRequiredInteger(payload.length, 'length'),
      height: toRequiredInteger(payload.height, 'height'),
      width: toRequiredInteger(payload.width, 'width'),
      serviceType: payload.serviceType,
      codAmount: toOptionalNumber(payload.codAmount, 'codAmount'),
      packages: Array.isArray(payload.packages) ? payload.packages : undefined,
    }

    const http = await this.getHttp()
    const res = await http.post('/data/pricing/estimate', requestPayload)
    return res.data
  }

  async checkPairServiceability(payload: {
    pickupPincode: string
    dropPincode: string
    length: string
    height: string
    width: string
    weight: string
    paymentType: 'COD' | 'Prepaid'
    serviceType?: 'SURFACE' | 'EXPRESS'
    codAmount?: string
    invoiceAmount: string
  }) {
    const toRequiredPositiveString = (value: any, field: string) => {
      const normalized = this.sanitizeText(value)
      const numericValue = Number(normalized)
      if (!normalized || !Number.isFinite(numericValue) || numericValue < 1) {
        throw new HttpError(400, `Ekart ${field} must be greater than or equal to 1`)
      }
      return normalized
    }

    const pickupPincode = this.sanitizeText(payload.pickupPincode)
    const dropPincode = this.sanitizeText(payload.dropPincode)
    const paymentType = payload.paymentType
    const serviceType = payload.serviceType
    const invoiceAmount = this.sanitizeText(payload.invoiceAmount)

    if (!pickupPincode) {
      throw new HttpError(400, 'Ekart pickupPincode is required')
    }

    if (!dropPincode) {
      throw new HttpError(400, 'Ekart dropPincode is required')
    }

    if (!['COD', 'Prepaid'].includes(paymentType)) {
      throw new HttpError(400, 'Ekart paymentType must be COD or Prepaid')
    }

    if (serviceType && !['SURFACE', 'EXPRESS'].includes(serviceType)) {
      throw new HttpError(400, 'Ekart serviceType must be SURFACE or EXPRESS')
    }

    if (!invoiceAmount) {
      throw new HttpError(400, 'Ekart invoiceAmount is required')
    }

    const codAmount = payload.codAmount !== undefined ? this.sanitizeText(payload.codAmount) : undefined
    if (paymentType === 'COD') {
      const normalizedCodAmount = Number(codAmount)
      if (!codAmount || !Number.isFinite(normalizedCodAmount) || normalizedCodAmount < 0 || normalizedCodAmount > 49999) {
        throw new HttpError(400, 'Ekart codAmount is required for COD and must be between 0 and 49999')
      }
    }

    const requestPayload = {
      pickupPincode,
      dropPincode,
      length: toRequiredPositiveString(payload.length, 'length'),
      height: toRequiredPositiveString(payload.height, 'height'),
      width: toRequiredPositiveString(payload.width, 'width'),
      weight: toRequiredPositiveString(payload.weight, 'weight'),
      paymentType,
      ...(serviceType ? { serviceType } : {}),
      ...(codAmount !== undefined ? { codAmount } : {}),
      invoiceAmount,
    }

    const http = await this.getHttp()
    const res = await http.post('/data/v3/serviceability', requestPayload)
    this.log('Serviceability v3', {
      pickup: pickupPincode,
      drop: dropPincode,
      status: res.status,
    })
    const raw = res.data
    const records = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.records)
        ? raw.records
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.serviceability)
            ? raw.serviceability
            : Array.isArray(raw?.services)
              ? raw.services
              : raw && typeof raw === 'object'
                ? [raw]
                : []

    const availability =
      records.find((record: any) => record && typeof record === 'object') ??
      (raw && typeof raw === 'object' ? raw : null)

    const toBoolean = (...values: any[]) => {
      for (const value of values) {
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
          const normalized = value.trim().toLowerCase()
          if (['true', 'yes', 'y', '1', 'serviceable', 'available'].includes(normalized)) {
            return true
          }
          if (['false', 'no', 'n', '0', 'unserviceable', 'unavailable'].includes(normalized)) {
            return false
          }
        }
        if (typeof value === 'number') return value > 0
      }
      return undefined
    }

    const hasTatSignal =
      (typeof availability?.tat === 'number' && availability.tat > 0) ||
      (availability?.tat &&
        typeof availability.tat === 'object' &&
        (Number(availability.tat.min ?? 0) > 0 || Number(availability.tat.max ?? 0) > 0)) ||
      (typeof raw?.tat === 'number' && raw.tat > 0) ||
      (raw?.tat &&
        typeof raw.tat === 'object' &&
        (Number(raw.tat.min ?? 0) > 0 || Number(raw.tat.max ?? 0) > 0))

    const hasChargeSignal = Boolean(
      availability?.forwardDeliveredCharges ||
      availability?.rtoDeliveredCharges ||
      availability?.reverseDeliveredCharges ||
      raw?.forwardDeliveredCharges ||
      raw?.rtoDeliveredCharges ||
      raw?.reverseDeliveredCharges,
    )

    const serviceable =
      toBoolean(
        availability?.is_serviceable,
        availability?.serviceable,
        availability?.available,
        availability?.status,
        raw?.is_serviceable,
        raw?.serviceable,
        raw?.available,
        raw?.status,
      ) ??
      (records.length > 0 && (hasTatSignal || hasChargeSignal))

    const codAvailable =
      toBoolean(
        availability?.cod,
        availability?.is_cod,
        availability?.cod_available,
        raw?.cod,
        raw?.is_cod,
        raw?.cod_available,
      ) ?? true

    const prepaidAvailable =
      toBoolean(
        availability?.prepaid,
        availability?.prepaid_available,
        availability?.is_prepaid,
        raw?.prepaid,
        raw?.prepaid_available,
        raw?.is_prepaid,
      ) ?? true

    const tatCandidates = [
      availability?.tat,
      availability?.tat?.min,
      availability?.tat?.max,
      availability?.tat_days,
      availability?.estimated_delivery_days,
      availability?.eta_days,
      raw?.tat,
      raw?.tat?.min,
      raw?.tat?.max,
      raw?.tat_days,
      raw?.estimated_delivery_days,
      raw?.eta_days,
    ]
    const tat =
      tatCandidates
        .map((value) => Number(value))
        .find((value) => Number.isFinite(value) && value > 0) ?? null

    return {
      serviceable,
      availability,
      records,
      codAvailable,
      prepaidAvailable,
      tat,
      raw,
    } satisfies EkartPairServiceabilityResponse
  }

  async getBulkServiceability(
    type: EkartBulkServiceabilityType,
    format: EkartBulkServiceabilityFormat = 'JSON',
  ): Promise<EkartBulkServiceabilityResponse> {
    if (!['NON_LARGE', 'LARGE'].includes(type)) {
      throw new HttpError(400, 'Ekart bulk serviceability type must be NON_LARGE or LARGE')
    }

    if (!['JSON', 'EXCEL'].includes(format)) {
      throw new HttpError(400, 'Ekart bulk serviceability format must be JSON or EXCEL')
    }

    const http = await this.getHttp()
    const res = await http.get(`/data/serviceability/bulk/${type}`, {
      params: { format },
      responseType: format === 'EXCEL' ? 'arraybuffer' : 'json',
    })
    return res.data
  }

  // Backward-compatible alias used by older callers
  async checkServiceability(payload: {
    pickupPincode: string
    dropPincode: string
    length: string
    height: string
    width: string
    weight: string
    paymentType: 'COD' | 'Prepaid'
    serviceType?: 'SURFACE' | 'EXPRESS'
    codAmount?: string
    invoiceAmount: string
  }) {
    return this.checkPairServiceability(payload)
  }

  // ---------- Booking ----------
  async createShipment(payload: any): Promise<EkartCreateShipmentResponse> {
    const http = await this.getHttp()
    const endpoint = '/api/v1/package/create'
    const normalizedPayload = await this.buildEkartShipmentPayload(payload)
    const sanitizedPayload = this.sanitizeShipmentPayload(normalizedPayload)

    this.log('Create shipment request', {
      baseApi: this.baseApi,
      endpoint,
      payload: sanitizedPayload,
    })

    try {
      const res = await http.put(endpoint, normalizedPayload)
      this.log('Create shipment response', {
        baseApi: this.baseApi,
        endpoint,
        status: res.status,
        data: res.data,
      })
      return res.data
    } catch (err: any) {
      this.log('Create shipment failed', {
        baseApi: this.baseApi,
        endpoint,
        payload: sanitizedPayload,
        status: err?.response?.status || null,
        statusText: err?.response?.statusText || null,
        response: err?.response?.data || null,
        message: err?.message || err,
      })

      throw new HttpError(
        Number(err?.response?.status || 502),
        this.extractErrorMessage(err, 'Ekart shipment creation failed'),
      )
    }
  }

  async cancelShipment(trackingId: string) {
    const http = await this.getHttp()
    const res = await http.delete('/api/v1/package/cancel', { params: { tracking_id: trackingId } })
    return res.data
  }

  async updateDispatchDate(
    ids: string[],
    dispatchDate: string,
  ): Promise<EkartUpdateDispatchDateResponse> {
    const normalizedIds = Array.from(
      new Set(ids.map((id) => this.sanitizeText(id)).filter(Boolean)),
    )

    if (normalizedIds.length < 1 || normalizedIds.length > 100) {
      throw new HttpError(400, 'Ekart dispatch date update requires 1 to 100 unique shipment ids')
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dispatchDate)) {
      throw new HttpError(400, 'Ekart dispatchDate must be in YYYY-MM-DD format')
    }

    const http = await this.getHttp()
    const res = await http.post('/data/shipment/dispatch-date', {
      ids: normalizedIds,
      dispatchDate,
    })
    return res.data
  }

  async updateEwbn(id: string, ewbn: string): Promise<EkartUpdateEwbnResponse> {
    const normalizedId = this.sanitizeText(id)
    const normalizedEwbn = this.sanitizeText(ewbn)

    if (!normalizedId) {
      throw new HttpError(400, 'Ekart EWBN update requires a shipment id')
    }

    if (!/^\d{12}$/.test(normalizedEwbn)) {
      throw new HttpError(400, 'Ekart ewbn must be a 12-digit numeric string')
    }

    const http = await this.getHttp()
    const res = await http.post('/data/shipment/ewbn', {
      id: normalizedId,
      ewbn: normalizedEwbn,
    })
    return res.data
  }

  // ---------- Tracking ----------
  async track(trackingId: string): Promise<EkartTrackResponse> {
    const normalizedTrackingId = this.sanitizeText(trackingId)

    if (!normalizedTrackingId) {
      throw new HttpError(400, 'Ekart tracking requires a shipment id')
    }

    const http = await this.getOpenHttp()
    const res = await http.get(`/api/v1/track/${encodeURIComponent(normalizedTrackingId)}`)
    return res.data
  }

  async trackWbn(wbn: string): Promise<EkartRawTrackResponse> {
    const normalizedWbn = this.sanitizeText(wbn)

    if (!normalizedWbn) {
      throw new HttpError(400, 'Ekart raw tracking requires a WBN')
    }

    const http = await this.getHttp()
    const res = await http.get(`/data/v1/elite/track/${encodeURIComponent(normalizedWbn)}`)
    return res.data
  }

  // ---------- Labels & Manifest ----------
  async downloadLabels(ids: string[], jsonOnly = false): Promise<EkartLabelResponse> {
    const normalizedIds = Array.from(
      new Set(ids.map((id) => this.sanitizeText(id)).filter(Boolean)),
    )

    if (normalizedIds.length < 1 || normalizedIds.length > 100) {
      throw new HttpError(400, 'Ekart label download requires 1 to 100 unique waybill numbers')
    }

    const http = await this.getHttp()
    const res = await http.post(
      '/api/v1/package/label',
      { ids: normalizedIds },
      {
        params: { json_only: jsonOnly },
        responseType: jsonOnly ? 'json' : 'arraybuffer',
      },
    )
    return res.data
  }

  async generateManifest(ids: string[]): Promise<EkartGenerateManifestResponse> {
    const normalizedIds = Array.from(
      new Set(ids.map((id) => this.sanitizeText(id)).filter(Boolean)),
    )

    if (normalizedIds.length < 1 || normalizedIds.length > 100) {
      throw new HttpError(400, 'Ekart manifest generation requires 1 to 100 unique waybill numbers')
    }

    const http = await this.getHttp()
    const res = await http.post(
      '/data/v2/generate/manifest',
      { ids: normalizedIds },
      { responseType: 'json' },
    )
    return res.data
  }

  // ---------- Address sync ----------
  async addAddress(payload: EkartAddressRequest): Promise<EkartAddressResponse> {
    const alias = this.sanitizeText(payload.alias)
    const phone = Number(String(payload.phone ?? '').replace(/\D/g, ''))
    const addressLine1 = this.sanitizeText(payload.address_line1)
    const addressLine2 = payload.address_line2 ? this.sanitizeText(payload.address_line2) : null
    const pincode = Number(payload.pincode)
    const city = payload.city ? this.sanitizeText(payload.city) : null
    const state = this.sanitizeText(payload.state)
    const rawCountry = this.sanitizeText(payload.country || 'India').toUpperCase()
    const country = rawCountry === 'IN' || rawCountry === 'INDIA' ? 'India' : rawCountry

    if (!alias) {
      throw new HttpError(400, 'Ekart address alias is required')
    }

    if (!Number.isInteger(phone) || phone < 1000000000 || phone > 9999999999) {
      throw new HttpError(400, 'Ekart address phone must be a 10-digit number')
    }

    if (!addressLine1) {
      throw new HttpError(400, 'Ekart address_line1 is required')
    }

    if (!Number.isInteger(pincode) || pincode <= 0) {
      throw new HttpError(400, 'Ekart address pincode must be a positive integer')
    }

    if (!state) {
      throw new HttpError(400, 'Ekart address state is required')
    }

    if (!['India', 'IN'].includes(country)) {
      throw new HttpError(400, 'Ekart address country must be India or IN')
    }

    const http = await this.getHttp()
    const body = {
      alias,
      phone,
      address_line1: addressLine1,
      address_line2: addressLine2,
      pincode,
      city,
      state,
      country,
      geo: payload.geo ?? {},
    }
    const res = await http.post('/api/v2/address', body)
    return res.data
  }

  async getAddresses(): Promise<EkartSavedAddress[]> {
    const http = await this.getHttp()
    const res = await http.get('/api/v2/addresses')
    return Array.isArray(res.data) ? res.data : []
  }

  // Backward-compatible alias used by pickup registration flow
  async createWarehouse(payload: any) {
    return this.addAddress({
      alias: payload?.alias || payload?.name || 'Warehouse',
      phone: payload?.phone || payload?.contactPhone || 0,
      address_line1: payload?.addressLine1 || payload?.address_line1 || '',
      address_line2: payload?.addressLine2 || payload?.address_line2 || null,
      pincode: payload?.pincode || '',
      city: payload?.city || '',
      state: payload?.state || '',
      country: payload?.country || 'India',
      geo: payload?.geo,
    })
  }

  // ---------- Webhooks ----------
  private buildWebhookPayload(payload: EkartWebhookRequest, partial = false): EkartWebhookRequest {
    const allowedTopics: EkartWebhookTopic[] = [
      'track_updated',
      'shipment_created',
      'shipment_recreated',
    ]
    const nextPayload: EkartWebhookRequest = {}

    if (!partial || payload.url !== undefined) {
      const url = this.sanitizeText(payload.url)
      if (!url) {
        throw new HttpError(400, 'Ekart webhook url is required')
      }
      try {
        new URL(url)
      } catch {
        throw new HttpError(400, 'Ekart webhook url must be a valid URI')
      }
      nextPayload.url = url
    }

    if (!partial || payload.secret !== undefined) {
      const secret = this.sanitizeText(payload.secret)
      if (secret.length < 6 || secret.length > 30) {
        throw new HttpError(400, 'Ekart webhook secret must be 6 to 30 characters')
      }
      nextPayload.secret = secret
    }

    if (!partial || payload.topics !== undefined) {
      const topics = Array.isArray(payload.topics)
        ? Array.from(new Set(payload.topics.map((topic) => this.sanitizeText(topic))))
        : []
      if (topics.length < 1) {
        throw new HttpError(400, 'Ekart webhook topics must contain at least one topic')
      }
      const invalidTopic = topics.find((topic) => !allowedTopics.includes(topic as EkartWebhookTopic))
      if (invalidTopic) {
        throw new HttpError(400, `Invalid Ekart webhook topic: ${invalidTopic}`)
      }
      nextPayload.topics = topics as EkartWebhookTopic[]
    }

    if (payload.active !== undefined) {
      nextPayload.active = Boolean(payload.active)
    } else if (!partial) {
      nextPayload.active = true
    }

    return nextPayload
  }

  async getWebhooks(): Promise<EkartWebhook[]> {
    const http = await this.getHttp()
    const res = await http.get('/api/v2/webhook')
    return Array.isArray(res.data) ? res.data : []
  }

  async addWebhook(payload: EkartWebhookRequest): Promise<EkartWebhook> {
    const requestPayload = this.buildWebhookPayload(payload)
    const http = await this.getHttp()
    const res = await http.post('/api/v2/webhook', requestPayload)
    return res.data
  }

  async updateWebhook(webhookId: string, payload: EkartWebhookRequest): Promise<EkartWebhook> {
    const normalizedWebhookId = this.sanitizeText(webhookId)
    if (!normalizedWebhookId) {
      throw new HttpError(400, 'Ekart webhook id is required')
    }

    const requestPayload = this.buildWebhookPayload(payload, true)
    const http = await this.getHttp()
    const res = await http.put(
      `/api/v2/webhook/${encodeURIComponent(normalizedWebhookId)}`,
      requestPayload,
    )
    return res.data
  }

  // ---------- NDR ----------
  async ndrAction(payload: EkartNdrActionRequest): Promise<EkartNdrActionResponse> {
    const action = payload.action
    const wbn = this.sanitizeText(payload.wbn)
    const phone = payload.phone ? this.sanitizeText(payload.phone) : undefined
    const address = payload.address ? this.sanitizeText(payload.address) : undefined
    const instructions = payload.instructions ? this.sanitizeText(payload.instructions) : undefined
    const links = Array.isArray(payload.links)
      ? payload.links.map((link) => this.sanitizeText(link)).filter(Boolean)
      : undefined

    if (!['Re-Attempt', 'RTO'].includes(action)) {
      throw new HttpError(400, 'Ekart NDR action must be Re-Attempt or RTO')
    }

    if (!wbn) {
      throw new HttpError(400, 'Ekart NDR action requires a waybill number')
    }

    if (action === 'Re-Attempt') {
      if (!Number.isInteger(payload.date)) {
        throw new HttpError(400, 'Ekart Re-Attempt NDR action requires date in milliseconds')
      }

      const reattemptDate = payload.date as number
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const tomorrowStart = todayStart + 24 * 60 * 60 * 1000
      const maxDate = todayStart + 7 * 24 * 60 * 60 * 1000

      if (reattemptDate < tomorrowStart || reattemptDate > maxDate) {
        throw new HttpError(
          400,
          'Ekart Re-Attempt date must be within seven days of today, excluding today',
        )
      }
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      throw new HttpError(400, 'Ekart NDR phone must be a 10-digit number')
    }

    const requestPayload = {
      action,
      wbn,
      ...(payload.date !== undefined ? { date: payload.date } : {}),
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
      ...(instructions ? { instructions } : {}),
      ...(links ? { links } : {}),
    }

    const http = await this.getHttp()
    const res = await http.post('/api/v2/package/ndr', requestPayload)
    return res.data
  }

  // Backward-compatible alias used by NDR controllers
  async submitNdrAction(payload: any) {
    if (payload?.action && !['Re-Attempt', 'RTO'].includes(payload.action)) {
      const http = await this.getHttp()
      const res = await http.post('/api/v2/package/ndr', payload)
      return res.data
    }

    return this.ndrAction(payload)
  }
}
