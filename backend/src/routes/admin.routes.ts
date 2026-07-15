import { Router } from 'express'
import { adminGetProductsHandler, adminDeleteProductHandler } from '../controllers/product.controller'
import { createCategoryHandler, deleteCategoryHandler } from '../controllers/category.controller'
import { adminGetOrdersHandler } from '../controllers/order.controller'
import { deleteReviewHandler } from '../controllers/review.controller'
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

export default router
