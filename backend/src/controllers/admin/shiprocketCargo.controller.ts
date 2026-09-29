import { Request, Response } from 'express'
import {
  ShiprocketCargoError,
  shiprocketCargoClient,
} from '../../models/services/shiprocketCargo.service'

const sendProviderResponse = async (
  res: Response,
  operation: () => Promise<{ status: number; data: unknown }>,
) => {
  try {
    const result = await operation()
    return res.status(result.status).json(result.data)
  } catch (error: any) {
    if (error instanceof ShiprocketCargoError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        provider: 'shiprocket-cargo',
        data: error.providerData,
      })
    }
    console.error('[Shiprocket Cargo]', error)
    return res.status(500).json({
      success: false,
      message: 'Shiprocket Cargo integration failed.',
      provider: 'shiprocket-cargo',
    })
  }
}

const requiredPath = (req: Request, res: Response, key: string) => {
  const value = String(req.params[key] || '').trim()
  if (!value) {
    res.status(400).json({ success: false, message: `${key} is required.` })
    return null
  }
  return value
}

export const refreshShiprocketCargoTokenController = (req: Request, res: Response) =>
  sendProviderResponse(res, () => shiprocketCargoClient.refresh())

export const createShiprocketCargoOrderController = (req: Request, res: Response) =>
  sendProviderResponse(res, () => shiprocketCargoClient.createOrder(req.body))

export const associateShiprocketCargoShipmentController = (req: Request, res: Response) =>
  sendProviderResponse(res, () => shiprocketCargoClient.associateShipment(req.body))

export const getShiprocketCargoOrderController = (req: Request, res: Response) => {
  const orderId = requiredPath(req, res, 'orderId')
  return orderId ? sendProviderResponse(res, () => shiprocketCargoClient.getOrder(orderId)) : undefined
}

export const calculateShiprocketCargoChargesController = (req: Request, res: Response) =>
  sendProviderResponse(res, () => shiprocketCargoClient.calculateCharges(req.body))

export const trackShiprocketCargoShipmentController = (req: Request, res: Response) => {
  const waybillNo = requiredPath(req, res, 'waybillNo')
  return waybillNo
    ? sendProviderResponse(res, () => shiprocketCargoClient.trackShipment(waybillNo))
    : undefined
}

export const createShiprocketCargoWarehouseController = (req: Request, res: Response) =>
  sendProviderResponse(res, () => shiprocketCargoClient.createWarehouse(req.body))

export const listShiprocketCargoWarehousesController = (req: Request, res: Response) =>
  sendProviderResponse(res, () =>
    shiprocketCargoClient.listWarehouses({
      client_id: req.query.client_id as string | undefined,
      is_active: req.query.is_active as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page as string | undefined,
      page_size: req.query.page_size as string | undefined,
    }),
  )

export const updateShiprocketCargoWarehouseController = (req: Request, res: Response) => {
  const id = requiredPath(req, res, 'id')
  return id ? sendProviderResponse(res, () => shiprocketCargoClient.updateWarehouse(id, req.body)) : undefined
}

export const updateShiprocketCargoAppointmentController = (req: Request, res: Response) => {
  const id = requiredPath(req, res, 'id')
  return id ? sendProviderResponse(res, () => shiprocketCargoClient.updateAppointment(id, req.body)) : undefined
}

export const getShiprocketCargoShipmentController = (req: Request, res: Response) => {
  const shipmentId = requiredPath(req, res, 'shipmentId')
  return shipmentId
    ? sendProviderResponse(res, () => shiprocketCargoClient.getShipment(shipmentId))
    : undefined
}
