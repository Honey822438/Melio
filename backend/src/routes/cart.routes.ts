import { Router } from 'express'
import {
  getCartHandler,
  addToCartHandler,
  updateCartHandler,
  removeFromCartHandler,
  clearCartHandler,
} from '../controllers/cart.controller'
import { verifyToken, requireRole } from '../middleware/auth'

const router = Router()

// All cart routes require auth + buyer role
router.use(verifyToken, requireRole('buyer'))

router.get('/', getCartHandler)
router.post('/', addToCartHandler)
router.put('/:itemId', updateCartHandler)
router.delete('/:itemId', removeFromCartHandler)
router.delete('/', clearCartHandler)

export default router
