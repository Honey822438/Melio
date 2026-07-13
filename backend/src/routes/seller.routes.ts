import { Router } from 'express'
import { getSellerProductsHandler } from '../controllers/product.controller'
import { verifyToken, requireRole, isApprovedSeller } from '../middleware/auth'

const router = Router()

// All seller routes require auth + approved seller status
router.use(verifyToken, requireRole('seller'), isApprovedSeller)

router.get('/products', getSellerProductsHandler)

export default router
