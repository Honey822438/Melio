import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { ApiResponse } from '../types'
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  CartSummary,
  CartItemWithProduct,
} from '../services/cart.service'

// ─── GET /api/cart ─────────────────────────────────────────────────────────────

export const getCartHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<CartSummary>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }
    const cart = await getCart(req.user.userId)
    res.json({ success: true, data: cart })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch cart'
    res.status(500).json({ success: false, message })
  }
}

// ─── POST /api/cart ────────────────────────────────────────────────────────────

export const addToCartHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<CartItemWithProduct[]>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const { product_id, quantity } = req.body

    if (!product_id) {
      res.status(400).json({ success: false, message: 'product_id is required' })
      return
    }

    const qty = quantity ? Number(quantity) : 1
    if (qty < 1) {
      res.status(400).json({ success: false, message: 'quantity must be at least 1' })
      return
    }

    const items = await addToCart(req.user.userId, product_id, qty)
    res.status(201).json({ success: true, data: items })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add to cart'
    const status = message.includes('not found') ? 404
      : message.includes('stock') || message.includes('own product') ? 400
      : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── PUT /api/cart/:itemId ─────────────────────────────────────────────────────

export const updateCartHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<CartItemWithProduct[]>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const { quantity } = req.body
    if (!quantity || Number(quantity) < 1) {
      res.status(400).json({ success: false, message: 'quantity must be at least 1' })
      return
    }

    const items = await updateCartQuantity(req.user.userId, req.params.itemId, Number(quantity))
    res.json({ success: true, data: items })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update cart'
    const status = message.includes('not found') ? 404 : message.includes('authorised') ? 403 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── DELETE /api/cart/:itemId ──────────────────────────────────────────────────

export const removeFromCartHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<CartItemWithProduct[]>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const items = await removeFromCart(req.user.userId, req.params.itemId)
    res.json({ success: true, data: items })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove item'
    const status = message.includes('not found') ? 404 : message.includes('authorised') ? 403 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── DELETE /api/cart ──────────────────────────────────────────────────────────

export const clearCartHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    await clearCart(req.user.userId)
    res.json({ success: true, message: 'Cart cleared' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to clear cart'
    res.status(500).json({ success: false, message })
  }
}
