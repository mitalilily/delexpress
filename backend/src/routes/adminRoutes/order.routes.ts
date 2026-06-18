import { Router } from 'express'
import {
  addManualNdrControllerAdmin,
  getAllOrdersControllerAdmin,
  exportOrdersControllerAdmin,
  regenerateOrderDocumentsControllerAdmin,
  shipNowOrderControllerAdmin,
  updateOrderStatusControllerAdmin,
} from '../../controllers/admin/order.controller'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'
const router = Router()

router.get('/all-orders', requireAuth, isAdminMiddleware, getAllOrdersControllerAdmin)
router.get('/export', requireAuth, isAdminMiddleware, exportOrdersControllerAdmin)
router.post(
  '/:id/regenerate-documents',
  requireAuth,
  isAdminMiddleware,
  regenerateOrderDocumentsControllerAdmin,
)
router.post('/:id/ship-now', requireAuth, isAdminMiddleware, shipNowOrderControllerAdmin)
router.post('/:id/status', requireAuth, isAdminMiddleware, updateOrderStatusControllerAdmin)
router.post('/:id/ndr', requireAuth, isAdminMiddleware, addManualNdrControllerAdmin)
export default router
