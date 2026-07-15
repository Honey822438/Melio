import { Request, Response } from 'express'
import { ApiResponse, User } from '../types'
import {
  getPlatformStats,
  getPendingSellerApprovals,
  verifySeller,
  rejectSeller,
  listUsers,
  getAdminRecentOrders,
  PlatformStats,
  PendingSeller,
  AdminRecentOrder,
} from '../services/admin.dashboard.service'

// ─── GET /api/admin/dashboard/stats ──────────────────────────────────────────

export const getPlatformStatsHandler = async (
  _req: Request,
  res: Response<ApiResponse<PlatformStats>>
): Promise<void> => {
  try {
    const stats = await getPlatformStats()
    res.json({ success: true, data: stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch platform stats'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/admin/dashboard/pending-sellers ─────────────────────────────────

export const getPendingSellersHandler = async (
  _req: Request,
  res: Response<ApiResponse<PendingSeller[]>>
): Promise<void> => {
  try {
    const sellers = await getPendingSellerApprovals()
    res.json({ success: true, data: sellers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch pending sellers'
    res.status(500).json({ success: false, message })
  }
}

// ─── PUT /api/admin/sellers/:id/verify ───────────────────────────────────────

export const verifySellerHandler = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<User>>
): Promise<void> => {
  try {
    const seller = await verifySeller(req.params.id)
    res.json({ success: true, data: seller, message: 'Seller verified successfully' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to verify seller'
    const status = message.includes('not found') ? 404 : 400
    res.status(status).json({ success: false, message })
  }
}

// ─── DELETE /api/admin/sellers/:id ───────────────────────────────────────────

export const rejectSellerHandler = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    await rejectSeller(req.params.id)
    res.json({ success: true, message: 'Seller account rejected and removed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reject seller'
    const status = message.includes('not found') ? 404 : message.includes('not a seller') ? 400 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

export const listUsersHandler = async (
  req: Request,
  res: Response<ApiResponse<{ users: Omit<User, 'password_hash'>[]; total: number }>>
): Promise<void> => {
  try {
    const role = req.query.role as 'buyer' | 'seller' | 'admin' | undefined
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 20

    const validRoles = ['buyer', 'seller', 'admin']
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ success: false, message: 'role must be buyer, seller, or admin' })
      return
    }

    const result = await listUsers(role, page, limit)
    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/admin/dashboard/recent-orders ──────────────────────────────────

export const getAdminRecentOrdersHandler = async (
  req: Request,
  res: Response<ApiResponse<AdminRecentOrder[]>>
): Promise<void> => {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10
    const orders = await getAdminRecentOrders(limit)
    res.json({ success: true, data: orders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch recent orders'
    res.status(500).json({ success: false, message })
  }
}
