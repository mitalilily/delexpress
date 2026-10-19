import { Router } from 'express'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'
import { bookManualShipmentWithProviderController, createManualCourierController, deleteManualCourierController, importManualCourierPincodesController, listManualCouriersController, manualShipmentProviderOptionsController, listManualShipmentsController, replaceManualAwbController, updateManualCourierController, updateManualShipmentController } from '../../controllers/admin/manualCourier.controller'
import { upload } from '../../middlewares/upload'
const router = Router()
router.use(requireAuth, isAdminMiddleware)
router.get('/', listManualCouriersController)
router.post('/', upload.single('pincodesFile'), createManualCourierController)
router.put('/:id', updateManualCourierController)
router.delete('/:id', deleteManualCourierController)
router.post('/:id/pincodes/import', upload.single('file'), importManualCourierPincodesController)
router.get('/shipments/list', listManualShipmentsController)
router.post('/shipments/:id/status', updateManualShipmentController)
router.post('/shipments/:id/awb', replaceManualAwbController)
router.get('/shipments/:id/provider-options', manualShipmentProviderOptionsController)
router.post('/shipments/:id/integrated-book', bookManualShipmentWithProviderController)
export default router
