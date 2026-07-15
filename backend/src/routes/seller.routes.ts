import { Router } from 'express'
import { getSellerProductsHandler } from '../controllers/product.controller'
import { getSellerOrdersHandler, updateOrderStatusHandler } from '../controllers/order.controller'
import {
  getSellerStatsHandler,
  getSellerTopProductsHandler,
  getSellerRecentOrdersHandler,
} from '../controllers/seller.dashboard.controller'
import { verifyToken, requireRole, isApprovedSeller } from '../middleware/auth'

const router = Router()

// All seller routes require auth + approved seller status
router.use(verifyToken, requireRole('seller'), isApprovedSeller)

// Products
router.get('/products', getSellerProductsHandler)

// Orders
router.get('/orders', getSellerOrdersHandler)
router.put('/orders/:id/status', updateOrderStatusHandler)

// Dashboard
router.get('/dashboard/stats', getSellerStatsHandler)
router.get('/dashboard/top-products', getSellerTopProductsHandler)
router.get('/dashboard/recent-orders', getSellerRecentOrdersHandler)

export default router
