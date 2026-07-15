import { Router } from 'express'
import {
  createReviewHandler,
  getProductReviewsHandler,
  getEligibilityHandler,
  getMyReviewHandler,
} from '../controllers/review.controller'
import { verifyToken, requireRole } from '../middleware/auth'

const router = Router()

// Public
router.get('/product/:productId', getProductReviewsHandler)

// Buyer only
router.post('/', verifyToken, requireRole('buyer'), createReviewHandler)
router.get('/eligibility/:productId', verifyToken, requireRole('buyer'), getEligibilityHandler)
router.get('/my/:productId', verifyToken, requireRole('buyer'), getMyReviewHandler)

export default router
