import api from './axios'

export async function getManualCouriers(params = {}) { const { data } = await api.get('/admin/manual-couriers', { params }); return data.data || [] }
export async function createManualCourier(payload) { const { data } = await api.post('/admin/manual-couriers', payload); return data.data }
export async function createManualCourierWithCsv(payload, file) { const form = new FormData(); form.append('name', payload.name); form.append('serviceTypes', JSON.stringify(payload.serviceTypes)); form.append('maxWeightKg', payload.maxWeightKg ?? ''); form.append('isActive', String(payload.isActive)); form.append('pincodesFile', file); const { data } = await api.post('/admin/manual-couriers', form, { headers: { 'Content-Type': 'multipart/form-data' } }); return data.data }
export async function updateManualCourier(id, payload) { const { data } = await api.put(`/admin/manual-couriers/${id}`, payload); return data.data }
export async function deleteManualCourier(id) { const { data } = await api.delete(`/admin/manual-couriers/${id}`); return data.data }
export async function getManualShipments(params = {}) { const { data } = await api.get('/admin/manual-couriers/shipments/list', { params }); return data.data || [] }
export async function updateManualShipment(id, payload) { const { data } = await api.post(`/admin/manual-couriers/shipments/${id}/status`, payload); return data.data }
export async function replaceManualAwb(id, payload) { const { data } = await api.post(`/admin/manual-couriers/shipments/${id}/awb`, payload); return data.data }
export async function getManualShipmentProviderOptions(id, params = {}) { const { data } = await api.get(`/admin/manual-couriers/shipments/${id}/provider-options`, { params }); return data.data || [] }
export async function bookManualShipmentWithProvider(id, payload) { const { data } = await api.post(`/admin/manual-couriers/shipments/${id}/integrated-book`, payload); return data.data }
export async function importManualCourierPincodes(id, file) { const form = new FormData(); form.append('file', file); const { data } = await api.post(`/admin/manual-couriers/${id}/pincodes/import`, form, { headers: { 'Content-Type': 'multipart/form-data' } }); return data.data }
