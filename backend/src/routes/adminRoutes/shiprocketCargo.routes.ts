import { Router } from 'express'
import {
  associateShiprocketCargoShipmentController,
  calculateShiprocketCargoChargesController,
  createShiprocketCargoOrderController,
  createShiprocketCargoWarehouseController,
  getShiprocketCargoOrderController,
  getShiprocketCargoShipmentController,
  listShiprocketCargoWarehousesController,
  refreshShiprocketCargoTokenController,
  trackShiprocketCargoShipmentController,
  updateShiprocketCargoAppointmentController,
  updateShiprocketCargoWarehouseController,
} from '../../controllers/admin/shiprocketCargo.controller'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'

const router = Router()
router.use(requireAuth, isAdminMiddleware)

router.post('/token/refresh', refreshShiprocketCargoTokenController)
router.post('/orders', createShiprocketCargoOrderController)
router.post('/shipments/associate', associateShiprocketCargoShipmentController)
router.get('/orders/:orderId', getShiprocketCargoOrderController)
router.post('/shipments/charges', calculateShiprocketCargoChargesController)
router.get('/shipments/track/:waybillNo', trackShiprocketCargoShipmentController)
router.post('/warehouses', createShiprocketCargoWarehouseController)
router.get('/warehouses', listShiprocketCargoWarehousesController)
router.put('/warehouses/:id', updateShiprocketCargoWarehouseController)
router.put('/appointments/:id', updateShiprocketCargoAppointmentController)
router.get('/shipments/:shipmentId', getShiprocketCargoShipmentController)

export default router
