// utils/emailSender.ts
import dotenv from 'dotenv'
import fs from 'fs'
import nodemailer from 'nodemailer'
import path from 'path'

// Load correct .env based on NODE_ENV
const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const EMAIL_FROM = process.env.EMAIL_FROM!
const GOOGLE_SMTP_USER = process.env.GOOGLE_SMTP_USER || EMAIL_FROM
const GOOGLE_SMTP_PASSWORD = process.env.GOOGLE_SMTP_PASSWORD!
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'

type AttachmentInput = {
  /** local file path OR Buffer */
  path?: string
  buffer?: Buffer
  filename: string
  mimeType?: string
  cid?: string
}

// Create SMTP transporter (Hostinger/custom SMTP if provided, else Gmail service)
const createTransporter = () => {
  if (!GOOGLE_SMTP_PASSWORD) {
    console.warn('Google SMTP password not configured. Email not sent.')
    return null
  }

  if (SMTP_HOST) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: GOOGLE_SMTP_USER,
        pass: GOOGLE_SMTP_PASSWORD,
      },
    })
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GOOGLE_SMTP_USER,
      pass: GOOGLE_SMTP_PASSWORD, // Use App Password for Gmail
    },
  })
}

/**
 * Low-level sendEmail supporting optional attachments
 */
const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: AttachmentInput[],
) => {
  const transporter = createTransporter()
  if (!transporter) {
    console.warn('Email transporter not configured. Email not sent.')
    return
  }

  const mailOptions: any = {
    from: `"ExpressoPro" <${EMAIL_FROM}>`,
    to,
    subject,
    html: htmlContent,
  }

  if (attachments && attachments.length) {
    mailOptions.attachments = await Promise.all(
      attachments.map(async (a) => {
        let buffer: Buffer
        if (a.buffer) buffer = a.buffer
        else if (a.path) buffer = fs.readFileSync(a.path)
        else throw new Error('Attachment must have path or buffer')

        return {
          filename: a.filename,
          content: buffer,
          contentType: a.mimeType,
          contentDisposition: a.cid ? 'inline' : undefined,
          cid: a.cid,
        }
      }),
    )
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

// Login / verification Email for OTP-based auth
export const sendVerificationEmail = async (to: string, token: string) => {
  const html = `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      max-width: 600px;
      margin: 32px auto;
      padding: 32px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background-color: #ffffff;
      color: #111827;
    ">
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
        Sign in to ExpressoPro
      </h2>

      <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
        We received a request to sign in to your ExpressoPro account.  
        Please use the one-time verification code below to continue.
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <span style="
          display: inline-block;
          padding: 14px 28px;
          font-size: 26px;
          font-weight: 700;
          background-color: #2563eb;
          color: #ffffff;
          border-radius: 8px;
          letter-spacing: 6px;
        ">
          ${token}
        </span>
      </div>

      <p style="margin: 0 0 12px 0; font-size: 13px; color: #4b5563;">
        This code will expire in <strong>6 minutes</strong> and can be used only once.
      </p>

      <p style="margin: 0 0 24px 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
        If you did not attempt to sign in, you can safely ignore this email.
        Your account will remain secure unless this code is entered.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} ExpressoPro. All rights reserved.
      </p>
    </div>
  `

  await sendEmail(to, 'Your ExpressoPro verification code', html)
}

// Employee Credentials Email
export const sendEmployeeCredentials = async (
  to: string,
  email: string,
  password: string,
  createdBy: string, // name or email of the seller/admin
) => {
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fafafa;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1e293b; margin: 0;">Welcome to <span style="color:#2563eb;">ExpressoPro</span> 🚀</h2>
        <p style="font-size: 15px; color: #64748b; margin-top: 8px;">Your employee account has been created successfully.</p>
      </div>

      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #334155; margin: 0 0 12px 0;">
          An account has been created for you by <strong>${createdBy}</strong>.
        </p>
        <p style="font-size: 16px; color: #334155; margin: 0 0 12px 0;">Here are your login credentials:</p>
        <table style="width: 100%; font-size: 15px; color: #1e293b; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 40%;">Email</td>
            <td style="padding: 8px; background: #f9fafb; border-radius: 4px;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Password</td>
            <td style="padding: 8px; background: #f9fafb; border-radius: 4px;">${password}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 28px; text-align: center;">
        You can now log in to your ExpressoPro account using these credentials.<br/>
        If you face any issues, please contact your administrator.
      </p>

      <div style="text-align: center; margin-top: 32px; font-size: 13px; color: #94a3b8;">
        — The ExpressoPro Team
      </div>
    </div>
  `

  await sendEmail(to, 'Your ExpressoPro Employee Account', html)
}
const escapeHtml = (unsafe: string) =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const CHOICEMEE_LOGO_CANDIDATES = [
  path.resolve(__dirname, '../../assets/choicemee-logo.jpeg'),
  '/var/www/choicemee/app/brand/shipment-email-logo.png',
  '/var/www/choicemee/app/brand/choiceme-logo.png',
  '/var/www/choicemee/landing/brand/choicemee-logistics-logo.png',
  '/var/www/choicemee/admin/brand/choiceme-logo.png',
]

const resolveLogoPath = () => CHOICEMEE_LOGO_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || null

const buildTrackingStatusLabel = (status: string) => {
  const normalized = String(status || '').trim().toLowerCase()
  switch (normalized) {
    case 'booked':
      return 'Manifest'
    case 'pickup_initiated':
      return 'Pickup initiated'
    case 'in_transit':
      return 'In transit'
    case 'out_for_delivery':
      return 'Out for delivery'
    case 'delivered':
      return 'Delivered'
    case 'cancelled':
      return 'Cancelled'
    case 'ndr':
      return 'NDR'
    case 'rto':
      return 'RTO'
    case 'rto_in_transit':
      return 'RTO in transit'
    case 'rto_delivered':
      return 'RTO delivered'
    case 'shipment_created':
      return 'Shipment created'
    default:
      return normalized ? normalized.replace(/_/g, ' ') : 'Updated'
  }
}

const formatShipmentAddress = (...parts: Array<string | null | undefined>) =>
  parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')

const resolveProductName = (products: unknown) => {
  if (!products) return 'Product'

  if (Array.isArray(products)) {
    const names = products
      .map((product: any) =>
        String(product?.productName || product?.name || product?.title || '').trim(),
      )
      .filter(Boolean)

    if (names.length > 0) {
      return names.slice(0, 3).join(', ')
    }
  }

  if (typeof products === 'object') {
    const product = products as Record<string, any>
    const resolved = String(product.productName || product.name || product.title || '').trim()
    if (resolved) return resolved
  }

  return 'Product'
}

const resolveLogoAttachment = () => {
  const logoPath = resolveLogoPath()
  if (!logoPath) return null

  const extension = path.extname(logoPath).toLowerCase()
  return {
    path: logoPath,
    filename: path.basename(logoPath),
    mimeType:
      extension === '.png'
        ? 'image/png'
        : extension === '.webp'
          ? 'image/webp'
          : extension === '.svg'
            ? 'image/svg+xml'
            : 'image/jpeg',
    cid: 'choicemee-logo',
  } satisfies AttachmentInput
}

export const sendTempPasswordEmail = async (to: string, tempPassword: string) => {
  const safePassword = escapeHtml(tempPassword)

  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width:600px; margin:auto; padding:32px; border:1px solid #e5e7eb; border-radius:12px; background-color:#f9fafb;">
      <div style="text-align:center; margin-bottom:24px;">
        <h2 style="color:#1e293b; margin:0;">ExpressoPro Account Password Reset</h2>
        <p style="font-size:15px; color:#64748b; margin-top:8px;">
          Your account password has been reset by our team.
        </p>
      </div>

      <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; text-align:center;">
        <p style="font-size:16px; color:#334155; margin-bottom:16px;">
          Here is your temporary password:
        </p>
        <span style="display:inline-block; padding:12px 24px; font-size:20px; font-weight:bold; color:#ffffff; background-color:#2563eb; border-radius:6px; letter-spacing:1px;">
          ${safePassword}
        </span>
        <p style="font-size:14px; color:#64748b; margin-top:16px;">
          Use this password to log in and change it immediately.
        </p>
      </div>

      <p style="font-size:13px; color:#94a3b8; margin-top:28px; text-align:center;">
        If you did not request this, please contact our support immediately.<br/>
        — The ExpressoPro Team
      </p>
    </div>
  `

  await sendEmail(to, 'Your Temporary ExpressoPro Password', html)
}

export const sendShipmentTrackingUpdateEmail = async (opts: {
  to: string
  sellerName?: string
  orderNumber: string
  awbNumber?: string | null
  courierName?: string | null
  trackingStatus: string
  consigneeName?: string
  consigneeAddress?: string | null
  productName?: string | null
  phoneNumber?: string | null
}) => {
  const {
    to,
    sellerName,
    orderNumber,
    awbNumber,
    courierName,
    trackingStatus,
    consigneeName,
    consigneeAddress,
    productName,
    phoneNumber,
  } = opts

  const safeSellerName = escapeHtml(String(sellerName || 'Seller'))
  const safeOrderNumber = escapeHtml(String(orderNumber || ''))
  const safeAwbNumber = escapeHtml(String(awbNumber || ''))
  const safeCourierName = escapeHtml(String(courierName || 'Courier'))
  const statusLabel = buildTrackingStatusLabel(trackingStatus)
  const headlineStatus = statusLabel === 'Manifest' ? 'Manifested' : statusLabel
  const safeConsigneeName = escapeHtml(String(consigneeName || ''))
  const safeConsigneeAddress = escapeHtml(
    formatShipmentAddress(consigneeAddress || '') || 'Not available',
  )
  const safeProductName = escapeHtml(String(productName || 'Product'))
  const safePhoneNumber = escapeHtml(String(phoneNumber || ''))
  const logoAttachment = resolveLogoAttachment()

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f8; padding: 24px;">
      <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 24px; background: linear-gradient(90deg, #f8fbf8 0%, #edfdf1 100%); border-bottom: 1px solid #dcfce7;">
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 12px 16px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);">
            <img src="cid:choicemee-logo" alt="ChoiceMee Logistics" style="display: block; width: 180px; max-width: 100%; height: auto; object-fit: contain;" />
          </div>
          <div style="background: #f97316; color: #ffffff; border-radius: 999px; padding: 12px 20px; font-size: 15px; font-weight: 700; white-space: nowrap;">
            ${escapeHtml(statusLabel)}
          </div>
        </div>

        <div style="padding: 24px; color: #111827;">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; align-items: flex-start;">
            <div style="flex: 1 1 320px;">
              <p style="margin: 0 0 10px 0; font-size: 23px; line-height: 1.35; font-weight: 800; color: #111827;">
                Hello ${safeSellerName},
              </p>
              <p style="margin: 0; font-size: 18px; line-height: 1.55; font-weight: 700; color: #111827;">
                Your order #${safeOrderNumber} has been ${escapeHtml(headlineStatus)} successfully.
              </p>
            </div>

            <div style="flex: 0 0 220px; text-align: right;">
              <p style="margin: 0; font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; color: #6b7280;">
                Order ID
              </p>
              <p style="margin: 6px 0 0 0; font-size: 18px; font-weight: 800; color: #111827;">
                ${safeOrderNumber}
              </p>
              ${
                safeAwbNumber
                  ? `<p style="margin: 8px 0 0 0; font-size: 15px; color: #374151; font-weight: 600;">AWB ${safeAwbNumber}</p>`
                  : ''
              }
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                Courier: <span style="font-weight: 700; color: #111827;">${safeCourierName}</span>
              </p>
            </div>
          </div>

          <div style="margin-top: 24px; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden; background: #fafafa;">
            <div style="padding: 18px 20px; border-bottom: 1px solid #e5e7eb; background: #ffffff;">
              <p style="margin: 0; font-size: 20px; line-height: 1.2; font-weight: 800; color: #111827;">
                Consignee Details
              </p>
            </div>
            <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 15px; color: #111827;">
              <tr>
                <td style="padding: 16px 20px; width: 36%; font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb;">Consignee Name</td>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">${safeConsigneeName || 'Not available'}</td>
              </tr>
              <tr>
                <td style="padding: 16px 20px; width: 36%; font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb;">Address</td>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">${safeConsigneeAddress}</td>
              </tr>
              <tr>
                <td style="padding: 16px 20px; width: 36%; font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb;">Product Name</td>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">${safeProductName}</td>
              </tr>
              <tr>
                <td style="padding: 16px 20px; width: 36%; font-weight: 700; color: #374151;">Phone Number</td>
                <td style="padding: 16px 20px;">${safePhoneNumber || 'Not available'}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 22px; padding: 16px 18px; border-radius: 18px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412;">
            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
              Tracking stage: <strong>${escapeHtml(statusLabel)}</strong>. This update has been shared with the seller for order #${safeOrderNumber}.
            </p>
          </div>

          <div style="margin-top: 26px; font-size: 14px; color: #475569;">
            Regards,
            <br />
            <strong>Team ChoiceMee Logistics</strong>
          </div>
        </div>
      </div>
    </div>
  `

  const attachments = logoAttachment ? [logoAttachment] : undefined
  await sendEmail(
    to,
    `ChoiceMee Logistics tracking update - ${orderNumber} - ${statusLabel}`,
    html,
    attachments,
  )
}

export const sendInvoiceReadyEmail = async (opts: {
  to: string
  sellerName?: string
  invoiceNo: string
  periodStart: string // e.g. '01 Sep 2025'
  periodEnd: string
  totalAmount: string | number
  pdfUrl?: string // optional public url or local path
  csvUrl?: string // optional public url or local path
  attachFiles?: boolean // default false for production
  preferSignedUrls?: boolean // if true, treat pdfUrl/csvUrl as download links
}) => {
  const {
    to,
    sellerName,
    invoiceNo,
    periodStart,
    periodEnd,
    totalAmount,
    pdfUrl,
    csvUrl,
    attachFiles = false,
    preferSignedUrls = false,
  } = opts

  const safeSeller = sellerName ? sellerName : 'Seller'

  const html = `
  <div style="font-family: Arial, sans-serif; max-width:700px; margin:auto; padding:24px; color:#111">
    <h2 style="margin-bottom: 8px;">Your invoice is ready — ${invoiceNo}</h2>
    <p style="color:#555; margin-top:0;">Hello ${safeSeller},</p>
    <p style="color:#555">Your invoice for the period <strong>${periodStart}</strong> — <strong>${periodEnd}</strong> has been generated.</p>

    <table style="width:100%; margin-top:12px; border-collapse: collapse;">
      <tr>
        <td style="padding:8px; font-weight:600; width:40%;">Invoice No</td>
        <td style="padding:8px;">${invoiceNo}</td>
      </tr>
      <tr>
        <td style="padding:8px; font-weight:600;">Period</td>
        <td style="padding:8px;">${periodStart} — ${periodEnd}</td>
      </tr>
      <tr>
        <td style="padding:8px; font-weight:600;">Amount (GST inclusive)</td>
        <td style="padding:8px;">₹${Number(totalAmount).toFixed(2)}</td>
      </tr>
    </table>

    <div style="margin-top:16px;">
  ${
    preferSignedUrls && (pdfUrl || csvUrl)
      ? `<p style="margin-bottom:8px;">Download files:</p>
       ${pdfUrl ? `<p><a href="${pdfUrl}">Download PDF Invoice</a></p>` : ''}
       ${csvUrl ? `<p><a href="${csvUrl}">Download CSV breakdown</a></p>` : ''}`
      : `<p style="color:#555; margin-bottom:8px;">You can download the invoice files attached to this email.</p>`
  }
    </div>

    <p style="color:#777; margin-top:20px; font-size:13px;">
      If you have any questions or dispute an item on the invoice, please contact support or use the “raise dispute” option in your seller dashboard.
    </p>

    <div style="margin-top:22px; font-size:12px; color:#999;">
      — ExpressoPro Team
    </div>
  </div>
  `

  // If attachFiles true and pdfUrl/csvUrl point to local files, attach them
  let attachments: AttachmentInput[] | undefined = undefined
  if (attachFiles) {
    attachments = []
    if (pdfUrl && !preferSignedUrls) {
      if (fs.existsSync(pdfUrl)) {
        attachments.push({ path: pdfUrl, filename: `${invoiceNo}.pdf` })
      }
    }
    if (csvUrl && !preferSignedUrls) {
      if (fs.existsSync(csvUrl)) {
        attachments.push({ path: csvUrl, filename: `${invoiceNo}.csv` })
      }
    }
  }

  await sendEmail(to, `Your Invoice ${invoiceNo} is ready`, html, attachments)
}

export const sendInvoiceReminderEmail = async (opts: {
  to: string
  invoiceNo: string
  amount: number | string
  pdfUrl?: string
  csvUrl?: string
}) => {
  const { to, invoiceNo, amount, pdfUrl, csvUrl } = opts

  const html = `
  <div style="font-family: Arial, sans-serif; max-width:700px; margin:auto; padding:24px; color:#111">
    <h2 style="margin-bottom: 8px; color: #dc2626;">Payment Reminder — Invoice ${invoiceNo}</h2>
    <p style="color:#555; margin-top:0;">Hello,</p>
    <p style="color:#555">This is a friendly reminder that your invoice <strong>${invoiceNo}</strong> with an outstanding amount of <strong>₹${Number(
      amount,
    ).toFixed(2)}</strong> is still pending payment.</p>

    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600; color: #991b1b;">Outstanding Amount: ₹${Number(
        amount,
      ).toFixed(2)}</p>
    </div>

    <div style="margin-top:16px;">
      ${
        pdfUrl || csvUrl
          ? `<p style="margin-bottom:8px;">Access your invoice:</p>
       ${
         pdfUrl
           ? `<p><a href="${pdfUrl}" style="color: #2563eb; text-decoration: underline;">Download PDF Invoice</a></p>`
           : ''
       }
       ${
         csvUrl
           ? `<p><a href="${csvUrl}" style="color: #2563eb; text-decoration: underline;">Download CSV breakdown</a></p>`
           : ''
       }`
          : ''
      }
    </div>

    <p style="color:#777; margin-top:20px; font-size:13px;">
      Please make the payment at your earliest convenience. If you have already made the payment, please ignore this reminder.
    </p>

    <p style="color:#777; margin-top:16px; font-size:13px;">
      If you have any questions or need assistance, please contact our support team.
    </p>

    <div style="margin-top:22px; font-size:12px; color:#999;">
      — ExpressoPro Team
    </div>
  </div>
  `

  await sendEmail(to, `Payment Reminder: Invoice ${invoiceNo}`, html)
}

export const sendKycStatusEmail = async (opts: {
  to: string
  userName?: string
  status: 'verified' | 'rejected'
  reason?: string
}) => {
  const { to, userName, status, reason } = opts
  const safeName = userName || 'Merchant'
  const isApproved = status === 'verified'
  const subject = isApproved ? 'Your KYC has been approved' : 'Your KYC has been rejected'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="margin: 0 0 10px 0; color: ${isApproved ? '#166534' : '#991b1b'};">
        ${isApproved ? 'KYC Approved' : 'KYC Rejected'}
      </h2>
      <p style="margin: 0 0 12px 0; color: #374151;">Hello ${safeName},</p>
      <p style="margin: 0 0 14px 0; color: #374151;">
        Your KYC verification status has been updated to:
        <strong>${isApproved ? 'Approved' : 'Rejected'}</strong>.
      </p>
      ${
        !isApproved && reason
          ? `<div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 14px 0; border-radius: 6px;">
               <p style="margin: 0; color: #7f1d1d;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
             </div>`
          : ''
      }
      <p style="margin: 14px 0 0 0; color: #6b7280; font-size: 13px;">
        If you need help, please contact support from your dashboard.
      </p>
      <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">— ExpressoPro Team</p>
    </div>
  `

  await sendEmail(to, subject, html)
}
