import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { ApiResponse, Order, OrderStatus } from '../types'
import {
  placeOrder,
  getOrderById,
  getBuyerOrders,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder,
  OrderWithItems,
  SellerOrderView,
} from '../services/order.service'

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export const placeOrderHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<OrderWithItems>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const { payment_method, address } = req.body

    if (!payment_method || !address) {
      res.status(400).json({ success: false, message: 'payment_method and address are required' })
      return
    }

    const allowed = ['cod', 'jazzcash', 'stripe']
    if (!allowed.includes(payment_method)) {
      res.status(400).json({ success: false, message: `payment_method must be one of: ${allowed.join(', ')}` })
      return
    }

    const { full_name, phone, address_line, city, province } = address
    if (!full_name || !phone || !address_line || !city || !province) {
      res.status(400).json({
        success: false,
        message: 'address requires: full_name, phone, address_line, city, province',
      })
      return
    }

    const order = await placeOrder({
      buyer_id: req.user.userId,
      payment_method,
      address,
    })

    res.status(201).json({ success: true, data: order })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to place order'
    const status = message === 'Cart is empty' ? 400
      : message.includes('stock') ? 400
      : message.includes('no longer exist') ? 400
      : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

export const getOrderHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<OrderWithItems>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const order = await getOrderById(req.params.id, req.user.userId)
    res.json({ success: true, data: order })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order not found'
    const status = message.includes('Not authorised') ? 403 : message.includes('not found') ? 404 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── GET /api/orders (buyer's own orders) ────────────────────────────────────

export const getBuyerOrdersHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ orders: OrderWithItems[]; total: number }>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10

    const result = await getBuyerOrders(req.user.userId, page, limit)
    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/seller/orders ───────────────────────────────────────────────────

export const getSellerOrdersHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ orders: SellerOrderView[]; total: number }>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10

    const result = await getSellerOrders(req.user.userId, page, limit)
    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders'
    res.status(500).json({ success: false, message })
  }
}

// ─── PUT /api/seller/orders/:id/status ───────────────────────────────────────

export const updateOrderStatusHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<Order>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const { status } = req.body
    const validStatuses: OrderStatus[] = ['processing', 'shipped', 'delivered', 'cancelled']

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(', ')}`,
      })
      return
    }

    const order = await updateOrderStatus(req.params.id, req.user.userId, status)
    res.json({ success: true, data: order })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update order'
    const status = message.includes('Not authorised') ? 403
      : message.includes('not found') ? 404
      : 400
    res.status(status).json({ success: false, message })
  }
}

// ─── PUT /api/orders/:id/cancel ───────────────────────────────────────────────

export const cancelOrderHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<Order>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const order = await cancelOrder(req.params.id, req.user.userId)
    res.json({ success: true, data: order })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel order'
    const status = message.includes('Not authorised') ? 403
      : message.includes('not found') ? 404
      : 400
    res.status(status).json({ success: false, message })
  }
}

// ─── GET /api/admin/orders ────────────────────────────────────────────────────

export const adminGetOrdersHandler = async (
  req: Request,
  res: Response<ApiResponse<{ orders: OrderWithItems[]; total: number }>>
): Promise<void> => {
  try {
    const { supabaseAdmin } = await import('../config/supabase')

    const page = req.query.page ? Number(req.query.page) : 1
    const limit = Math.min(req.query.limit ? Number(req.query.limit) : 20, 100)
    const offset = (page - 1) * limit
    const status = req.query.status as string | undefined

    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const { getOrderById: fetchOrder } = await import('../services/order.service')
    const orders = await Promise.all(
      (data ?? []).map((o) => fetchOrder(o.id, null, true))
    )

    res.json({ success: true, data: { orders, total: count ?? 0 } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch orders'
    res.status(500).json({ success: false, message })
  }
}
