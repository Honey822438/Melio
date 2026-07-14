import { Router } from 'express'
import {
  placeOrderHandler,
  getOrderHandler,
  getBuyerOrdersHandler,
  cancelOrderHandler,
} from '../controllers/order.controller'
import { verifyToken, requireRole } from '../middleware/auth'

const router = Router()

// All order routes require auth + buyer role
router.use(verifyToken, requireRole('buyer'))

router.post('/', placeOrderHandler)
router.get('/', getBuyerOrdersHandler)
router.get('/:id', getOrderHandler)
router.put('/:id/cancel', cancelOrderHandler)

export default router
