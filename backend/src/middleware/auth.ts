import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload, ApiResponse } from '../types'

// Extend Express Request to carry decoded JWT payload
export interface AuthRequest extends Request {
  user?: JwtPayload
}

// ─── verifyToken ─────────────────────────────────────────────────────────────
// Validates the Bearer token in Authorization header and attaches user to req

export const verifyToken = (
  req: AuthRequest,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]
  const secret = process.env.JWT_SECRET

  if (!secret) {
    res.status(500).json({ success: false, message: 'Server configuration error' })
    return
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// ─── requireRole ─────────────────────────────────────────────────────────────
// Factory: returns middleware that only allows specified roles through

export const requireRole = (...roles: JwtPayload['role'][]) => {
  return (
    req: AuthRequest,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Access denied' })
      return
    }

    next()
  }
}

// ─── isApprovedSeller ─────────────────────────────────────────────────────────
// Ensures the seller has been verified by Admin before they can list products

export const isApprovedSeller = (
  req: AuthRequest,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return
  }

  if (req.user.role !== 'seller') {
    res.status(403).json({ success: false, message: 'Seller account required' })
    return
  }

  if (!req.user.is_verified) {
    res.status(403).json({
      success: false,
      message: 'Your seller account is pending admin approval',
    })
    return
  }

  next()
}
