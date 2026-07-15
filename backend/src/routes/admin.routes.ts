import { Router } from 'express'
import { adminGetProductsHandler, adminDeleteProductHandler } from '../controllers/product.controller'
import { createCategoryHandler, deleteCategoryHandler } from '../controllers/category.controller'
import { adminGetOrdersHandler } from '../controllers/order.controller'
import { deleteReviewHandler } from '../controllers/review.controller'
import {
  getPlatformStatsHandler,
  getPendingSellersHandler,
  verifySellerHandler,
  rejectSellerHandler,
  listUsersHandler,
  getAdminRecentOrdersHandler,
} from '../controllers/admin.dashboard.controller'
import { verifyToken, requireRole } from '../middleware/auth'

const router = Router()

// All admin routes require auth + admin role
router.use(verifyToken, requireRole('admin'))

// Products
router.get('/products', adminGetProductsHandler)
router.delete('/products/:id', adminDeleteProductHandler)

// Categories
router.post('/categories', createCategoryHandler)
router.delete('/categories/:id', deleteCategoryHandler)

// Orders
router.get('/orders', adminGetOrdersHandler)

// Reviews
router.delete('/reviews/:id', deleteReviewHandler)

// Dashboard
router.get('/dashboard/stats', getPlatformStatsHandler)
router.get('/dashboard/recent-orders', getAdminRecentOrdersHandler)

// User management
router.get('/users', listUsersHandler)
router.get('/sellers/pending', getPendingSellersHandler)
router.put('/sellers/:id/verify', verifySellerHandler)
router.delete('/sellers/:id', rejectSellerHandler)

export default router
