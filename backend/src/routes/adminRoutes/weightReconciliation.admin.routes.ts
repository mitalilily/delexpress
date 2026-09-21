import { Router } from 'express'
import {
  approveDispute,
  approveWeightDiscrepancy,
  createCsvWeightDiscrepancies,
  createManualWeightDiscrepancy,
  getAdminWeightStats,
  getAllDiscrepancies,
  getAllDisputes,
  rejectDispute,
} from '../../controllers/admin/weightReconciliationAdmin.controller'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'

const router = Router()

// All routes require authentication and admin role
router.use(requireAuth, isAdminMiddleware)

// Discrepancies
router.get('/discrepancies', getAllDiscrepancies)
router.post('/discrepancies/manual', createManualWeightDiscrepancy)
router.post('/discrepancies/csv', createCsvWeightDiscrepancies)
router.post('/discrepancies/:id/approve', approveWeightDiscrepancy)

// Disputes
router.get('/disputes', getAllDisputes)
router.post('/disputes/:id/approve', approveDispute)
router.post('/disputes/:id/reject', rejectDispute)

// Dashboard stats
router.get('/stats', getAdminWeightStats)

export default router

