import { Router } from 'express'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'
import { createManualCourierController, deleteManualCourierController, listManualCouriersController, listManualShipmentsController, replaceManualAwbController, updateManualCourierController, updateManualShipmentController } from '../../controllers/admin/manualCourier.controller'
const router = Router()
router.use(requireAuth, isAdminMiddleware)
router.get('/', listManualCouriersController)
router.post('/', createManualCourierController)
router.put('/:id', updateManualCourierController)
router.delete('/:id', deleteManualCourierController)
router.get('/shipments/list', listManualShipmentsController)
router.post('/shipments/:id/status', updateManualShipmentController)
router.post('/shipments/:id/awb', replaceManualAwbController)
export default router
