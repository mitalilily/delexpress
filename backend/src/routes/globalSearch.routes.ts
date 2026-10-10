import express from 'express'
import { globalSearchController } from '../controllers/globalSearch.controller'
import { adminGlobalSearchController } from '../controllers/adminGlobalSearch.controller'
import { requireAuth } from '../middlewares/requireAuth'
import { isAdminMiddleware } from '../middlewares/isAdmin'

const router = express.Router()

router.get('/search', requireAuth, globalSearchController)
router.get('/admin-search', requireAuth, isAdminMiddleware, adminGlobalSearchController)

export default router

