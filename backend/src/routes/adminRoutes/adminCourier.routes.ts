// routes/shippingRateRoutes.ts
import { Router } from 'express'
import {
  getCourierCredentialsController,
  deleteShippingRateController,
  fetchAvailableCouriersForAdmin,
  getAllCouriersController,
  getExpressflyOrderController,
  getExpressflyOrderRatesController,
  getExpressflyOrdersController,
  createExpressflyWarehouseController,
  getExpressflyWarehouseListController,
  getShippingRatesController,
  importShippingRatesController,
  updateDelhiveryCredentialsController,
  updateExpressflyCredentialsController,
  updateEkartCredentialsController,
  updateXpressbeesCredentialsController,
  updateShippingRateController,
} from '../../controllers/admin/courier.controller'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'
import { upload } from '../../middlewares/upload'

const router = Router()

router.get('/shipping-rates', getShippingRatesController)
router.get('/list', getAllCouriersController)

router.put(
  '/shipping-rate/:id/:planId',
  requireAuth,
  isAdminMiddleware,
  updateShippingRateController,
)
router.post(
  '/shipping-rates/import',
  requireAuth,
  isAdminMiddleware,
  upload.single('file'),
  importShippingRatesController,
)
router.post('/available', requireAuth, fetchAvailableCouriersForAdmin)
router.get('/credentials', requireAuth, isAdminMiddleware, getCourierCredentialsController)
router.put(
  '/credentials/delhivery',
  requireAuth,
  isAdminMiddleware,
  updateDelhiveryCredentialsController,
)
router.put(
  '/credentials/expressfly',
  requireAuth,
  isAdminMiddleware,
  updateExpressflyCredentialsController,
)
router.get('/expressfly/orders', requireAuth, isAdminMiddleware, getExpressflyOrdersController)
router.get('/expressfly/orders/:orderId', requireAuth, isAdminMiddleware, getExpressflyOrderController)
router.get(
  '/expressfly/orders/:orderId/rates',
  requireAuth,
  isAdminMiddleware,
  getExpressflyOrderRatesController,
)
router.get(
  '/expressfly/warehouses',
  requireAuth,
  isAdminMiddleware,
  getExpressflyWarehouseListController,
)
router.post(
  '/expressfly/warehouses',
  requireAuth,
  isAdminMiddleware,
  createExpressflyWarehouseController,
)
router.put(
  '/credentials/ekart',
  requireAuth,
  isAdminMiddleware,
  updateEkartCredentialsController,
)
router.put(
  '/credentials/xpressbees',
  requireAuth,
  isAdminMiddleware,
  updateXpressbeesCredentialsController,
)
router.delete(
  '/shipping-rates/:planId/:id',
  requireAuth,
  isAdminMiddleware,
  deleteShippingRateController,
)

export default router
