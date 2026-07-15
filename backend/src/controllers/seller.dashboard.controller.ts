import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { ApiResponse } from '../types'
import {
  getSellerStats,
  getSellerTopProducts,
  getSellerRecentOrders,
  SellerStats,
  SellerTopProduct,
  SellerRecentOrder,
} from '../services/seller.dashboard.service'

// ─── GET /api/seller/dashboard/stats ─────────────────────────────────────────

export const getSellerStatsHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<SellerStats>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }
    const stats = await getSellerStats(req.user.userId)
    res.json({ success: true, data: stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/seller/dashboard/top-products ───────────────────────────────────

export const getSellerTopProductsHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<SellerTopProduct[]>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 20) : 5
    const products = await getSellerTopProducts(req.user.userId, limit)
    res.json({ success: true, data: products })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch top products'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/seller/dashboard/recent-orders ──────────────────────────────────

export const getSellerRecentOrdersHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<SellerRecentOrder[]>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10
    const orders = await getSellerRecentOrders(req.user.userId, limit)
    res.json({ success: true, data: orders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch recent orders'
    res.status(500).json({ success: false, message })
  }
}
