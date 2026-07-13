import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { ApiResponse, User } from '../types'
import {
  registerBuyer,
  registerSeller,
  loginUser,
  getUserById,
  updateUserProfile,
  RegisterBuyerInput,
  RegisterSellerInput,
  LoginInput,
  UpdateProfileInput,
} from '../services/auth.service'

// ─── POST /api/auth/register/buyer ───────────────────────────────────────────

export const registerBuyerHandler = async (
  req: Request<object, ApiResponse<{ user: User; token: string }>, RegisterBuyerInput>,
  res: Response<ApiResponse<{ user: User; token: string }>>
): Promise<void> => {
  try {
    const { name, email, password, city, province } = req.body

    if (!name || !email || !password || !city || !province) {
      res.status(400).json({ success: false, message: 'All fields are required: name, email, password, city, province' })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
      return
    }

    const result = await registerBuyer({ name, email, password, city, province })
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    const status = message === 'Email already registered' ? 409 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── POST /api/auth/register/seller ──────────────────────────────────────────

export const registerSellerHandler = async (
  req: Request<object, ApiResponse<{ user: User; token: string }>, RegisterSellerInput>,
  res: Response<ApiResponse<{ user: User; token: string }>>
): Promise<void> => {
  try {
    const { name, email, password, city, province, shop_name, shop_bio } = req.body

    if (!name || !email || !password || !city || !province || !shop_name) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, city, province, shop_name',
      })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
      return
    }

    const result = await registerSeller({ name, email, password, city, province, shop_name, shop_bio })
    res.status(201).json({
      success: true,
      data: result,
      message: 'Seller account created. Pending admin approval before you can list products.',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    const status = message === 'Email already registered' ? 409 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export const loginHandler = async (
  req: Request<object, ApiResponse<{ user: User; token: string }>, LoginInput>,
  res: Response<ApiResponse<{ user: User; token: string }>>
): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' })
      return
    }

    const result = await loginUser({ email, password })
    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    res.status(401).json({ success: false, message })
  }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side by dropping the token.
// This endpoint exists so frontend has a consistent API surface.

export const logoutHandler = (
  _req: Request,
  res: Response<ApiResponse<null>>
): void => {
  res.json({ success: true, message: 'Logged out successfully' })
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export const getMeHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<User>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    const user = await getUserById(req.user.userId)
    res.json({ success: true, data: user })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user'
    res.status(404).json({ success: false, message })
  }
}

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────

export const updateProfileHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<User>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    const input: UpdateProfileInput = {
      name: req.body.name,
      city: req.body.city,
      province: req.body.province,
      shop_name: req.body.shop_name,
      shop_bio: req.body.shop_bio,
      logo_url: req.body.logo_url,
    }

    const user = await updateUserProfile(req.user.userId, input)
    res.json({ success: true, data: user })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile'
    res.status(400).json({ success: false, message })
  }
}
