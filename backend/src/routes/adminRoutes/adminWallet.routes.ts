import { Router } from 'express'
import {
  adjustWalletBalance,
  getWallet,
  getWalletTransactions,
  listWalletMonthlySummary,
  listWallets,
} from '../../controllers/admin/wallet.controller'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'

const router = Router()

router.get('/', requireAuth, isAdminMiddleware, listWallets)
router.get('/monthly-summary', requireAuth, isAdminMiddleware, listWalletMonthlySummary)
router.get('/:userId', requireAuth, isAdminMiddleware, getWallet)
router.get('/:userId/transactions', requireAuth, isAdminMiddleware, getWalletTransactions)
router.post('/:userId/adjust', requireAuth, isAdminMiddleware, adjustWalletBalance)

export default router

