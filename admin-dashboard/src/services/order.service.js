import api from './axios'

export async function fetchTracking(params) {
  try {
    const { data } = await api.get('/orders/track', { params })

    if (!data.success || !data.data) {
      throw new Error('No shipment found!')
    }

    return data.data
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch tracking')
  }
}

export async function fetchAllOrders(page, limit = 10, filters = {}) {
  try {
    const response = await api.get(`/admin/orders/all-orders`, {
      params: {
        page,
        limit,
        ...filters,
      },
    })

    return response.data // { success, orders, totalCount, totalPages }
  } catch (error) {
    console.error('Error fetching orders:', error.message)
    throw error
  }
}

const getAttachmentFilename = (contentDisposition, fallback) => {
  const header = contentDisposition || ''
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ''))

  const filenameMatch = header.match(/filename="?([^";]+)"?/i)
  return filenameMatch?.[1] || fallback
}

export async function exportOrdersToZip(filters = {}) {
  try {
    const response = await api.get('/admin/orders/export', {
      params: filters,
      responseType: 'blob', // Important for file download
    })
    const fallbackName = `orders_export_${new Date().toISOString().split('T')[0]}.zip`
    const filename = getAttachmentFilename(response.headers?.['content-disposition'], fallbackName)

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('Error exporting orders:', error.message)
    throw error
  }
}

export const exportOrdersToCSV = exportOrdersToZip

export async function cancelAdminOrder(orderId) {
  try {
    const response = await api.post('/shipments/cancel', { orderId })
    return response.data
  } catch (error) {
    console.error('Error cancelling order:', error.response?.data || error.message)
    throw error
  }
}

export async function regenerateAdminOrderDocuments(
  orderId,
  { regenerateLabel = true, regenerateInvoice = true } = {},
) {
  try {
    const response = await api.post(`/admin/orders/${orderId}/regenerate-documents`, {
      regenerateLabel,
      regenerateInvoice,
    })
    return response.data
  } catch (error) {
    console.error('Error regenerating order documents:', error.response?.data || error.message)
    throw error
  }
}

export async function shipNowAdminOrder(
  orderId,
  { pickup_date, pickup_time, expected_package_count, pickup_address_id } = {},
) {
  try {
    const response = await api.post(`/admin/orders/${orderId}/ship-now`, {
      pickup_date,
      pickup_time,
      expected_package_count,
      pickup_address_id,
    })
    return response.data
  } catch (error) {
    console.error('Error processing ship now request:', error.response?.data || error.message)
    throw error
  }
}

export async function addManualNdrToOrder(
  orderId,
  { status = 'ndr', reason, remarks, attemptNo } = {},
) {
  try {
    const response = await api.post(`/admin/orders/${orderId}/ndr`, {
      status,
      reason,
      remarks,
      attemptNo,
    })
    return response.data
  } catch (error) {
    console.error('Error adding manual NDR to order:', error.response?.data || error.message)
    throw error
  }
}

export async function updateAdminOrderStatus(
  orderId,
  { status, reason, remarks, attemptNo } = {},
) {
  try {
    const response = await api.post(`/admin/orders/${orderId}/status`, {
      status,
      reason,
      remarks,
      attemptNo,
    })
    return response.data
  } catch (error) {
    console.error('Error updating order status:', error.response?.data || error.message)
    throw error
  }
}
