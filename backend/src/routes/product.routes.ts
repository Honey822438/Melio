import { Router } from 'express'
import {
  getProductsHandler,
  getProductByIdHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from '../controllers/product.controller'
import { verifyToken, requireRole, isApprovedSeller } from '../middleware/auth'
import { uploadProductImages } from '../middleware/upload'

const router = Router()

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/', getProductsHandler)
router.get('/:id', getProductByIdHandler)

// ─── Seller ───────────────────────────────────────────────────────────────────
router.post(
  '/',
  verifyToken,
  requireRole('seller'),
  isApprovedSeller,
  uploadProductImages,
  createProductHandler
)

router.put(
  '/:id',
  verifyToken,
  requireRole('seller'),
  isApprovedSeller,
  updateProductHandler
)

router.delete(
  '/:id',
  verifyToken,
  requireRole('seller'),
  isApprovedSeller,
  deleteProductHandler
)

export default router
