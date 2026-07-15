import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { ApiResponse, Review } from '../types'
import {
  createReview,
  getProductReviews,
  getReviewEligibility,
  getBuyerReviewForProduct,
  deleteReview,
  ReviewWithBuyer,
} from '../services/review.service'

// ─── POST /api/reviews ────────────────────────────────────────────────────────

export const createReviewHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<ReviewWithBuyer>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const { product_id, order_id, rating, comment } = req.body

    if (!product_id || !order_id || !rating) {
      res.status(400).json({
        success: false,
        message: 'product_id, order_id and rating are required',
      })
      return
    }

    const ratingNum = Number(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ success: false, message: 'rating must be an integer between 1 and 5' })
      return
    }

    const review = await createReview({
      buyer_id: req.user.userId,
      product_id,
      order_id,
      rating: ratingNum,
      comment,
    })

    res.status(201).json({ success: true, data: review })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit review'
    const status =
      message.includes('already reviewed') ? 409
      : message.includes('not found') ? 404
      : message.includes('Not authorised') || message.includes('only review') || message.includes('not part of') ? 403
      : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── GET /api/reviews/product/:productId ─────────────────────────────────────

export const getProductReviewsHandler = async (
  req: Request<{ productId: string }>,
  res: Response<ApiResponse<{ reviews: ReviewWithBuyer[]; total: number; avg_rating: number }>>
): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10

    const result = await getProductReviews(req.params.productId, page, limit)
    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch reviews'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/reviews/eligibility/:productId ─────────────────────────────────
// Frontend calls this to decide whether to show the "Write a Review" button

export const getEligibilityHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<{ can_review: boolean; order_id: string | null; already_reviewed: boolean }>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const result = await getReviewEligibility(req.user.userId, req.params.productId)
    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check eligibility'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/reviews/my/:productId ──────────────────────────────────────────
// Returns buyer's own review for a product (if any)

export const getMyReviewHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<Review | null>>
): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return }

    const review = await getBuyerReviewForProduct(req.user.userId, req.params.productId)
    res.json({ success: true, data: review })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch review'
    res.status(500).json({ success: false, message })
  }
}

// ─── DELETE /api/admin/reviews/:id ───────────────────────────────────────────

export const deleteReviewHandler = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    await deleteReview(req.params.id)
    res.json({ success: true, message: 'Review deleted' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete review'
    const status = message.includes('not found') ? 404 : 500
    res.status(status).json({ success: false, message })
  }
}
