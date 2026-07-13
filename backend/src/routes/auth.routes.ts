import { Router } from 'express'
import {
  registerBuyerHandler,
  registerSellerHandler,
  loginHandler,
  logoutHandler,
  getMeHandler,
  updateProfileHandler,
} from '../controllers/auth.controller'
import { verifyToken } from '../middleware/auth'

const router = Router()

// Public routes
router.post('/register/buyer', registerBuyerHandler)
router.post('/register/seller', registerSellerHandler)
router.post('/login', loginHandler)
router.post('/logout', logoutHandler)

// Protected routes
router.get('/me', verifyToken, getMeHandler)
router.put('/profile', verifyToken, updateProfileHandler)

export default router
