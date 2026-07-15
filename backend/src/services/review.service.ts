import { supabaseAdmin } from '../config/supabase'
import { Review } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewWithBuyer extends Review {
  buyer_name: string
  buyer_avatar: string | null
}

export interface CreateReviewInput {
  buyer_id: string
  product_id: string
  order_id: string
  rating: number
  comment?: string
}

// ─── Create Review ────────────────────────────────────────────────────────────
// Rules:
//   1. Buyer must have a DELIVERED order containing this product
//   2. One review per buyer per product (enforced by DB UNIQUE constraint too)
//   3. avg_rating updated automatically by DB trigger

export const createReview = async (
  input: CreateReviewInput
): Promise<ReviewWithBuyer> => {
  const { buyer_id, product_id, order_id, rating, comment } = input

  // 1. Verify the order belongs to this buyer and is delivered
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, buyer_id, status')
    .eq('id', order_id)
    .single()

  if (orderError || !order) throw new Error('Order not found')
  if (order.buyer_id !== buyer_id) throw new Error('Not authorised')
  if (order.status !== 'delivered') {
    throw new Error('You can only review products from delivered orders')
  }

  // 2. Verify this product was actually in that order
  const { data: orderItem } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('order_id', order_id)
    .eq('product_id', product_id)
    .single()

  if (!orderItem) {
    throw new Error('This product was not part of the specified order')
  }

  // 3. Check no existing review for this buyer+product
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('buyer_id', buyer_id)
    .eq('product_id', product_id)
    .single()

  if (existing) throw new Error('You have already reviewed this product')

  // 4. Insert review — trigger fires automatically to update avg_rating
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      buyer_id,
      product_id,
      order_id,
      rating,
      comment: comment ?? null,
    })
    .select(
      `id, buyer_id, product_id, order_id, rating, comment, created_at,
      users!buyer_id ( name, logo_url )`
    )
    .single()

  if (error || !data) {
    const msg = error?.message ?? 'Failed to submit review'
    throw new Error(msg.includes('unique') ? 'You have already reviewed this product' : msg)
  }

  const buyer = data.users as unknown as { name: string; logo_url: string | null } | null

  return {
    id: data.id,
    buyer_id: data.buyer_id,
    product_id: data.product_id,
    order_id: data.order_id,
    rating: data.rating,
    comment: data.comment,
    created_at: data.created_at,
    buyer_name: buyer?.name ?? 'Unknown',
    buyer_avatar: buyer?.logo_url ?? null,
  }
}

// ─── Get Product Reviews ──────────────────────────────────────────────────────

export const getProductReviews = async (
  productId: string,
  page = 1,
  limit = 10
): Promise<{ reviews: ReviewWithBuyer[]; total: number; avg_rating: number }> => {
  const offset = (page - 1) * limit

  const { data, error, count } = await supabaseAdmin
    .from('reviews')
    .select(
      `id, buyer_id, product_id, order_id, rating, comment, created_at,
      users!buyer_id ( name, logo_url )`,
      { count: 'exact' }
    )
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  const reviews: ReviewWithBuyer[] = (data ?? []).map((r) => {
    const buyer = r.users as unknown as { name: string; logo_url: string | null } | null
    return {
      id: r.id,
      buyer_id: r.buyer_id,
      product_id: r.product_id,
      order_id: r.order_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      buyer_name: buyer?.name ?? 'Unknown',
      buyer_avatar: buyer?.logo_url ?? null,
    }
  })

  // Calculate avg from current page results or fetch from products table
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('avg_rating')
    .eq('id', productId)
    .single()

  return {
    reviews,
    total: count ?? 0,
    avg_rating: product?.avg_rating ?? 0,
  }
}

// ─── Check If Buyer Can Review ────────────────────────────────────────────────
// Returns the eligible order_id if buyer can review, null if not

export const getReviewEligibility = async (
  buyerId: string,
  productId: string
): Promise<{ can_review: boolean; order_id: string | null; already_reviewed: boolean }> => {
  // Check existing review
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    return { can_review: false, order_id: null, already_reviewed: true }
  }

  // Find a delivered order containing this product
  const { data: orderItem } = await supabaseAdmin
    .from('order_items')
    .select(
      `order_id,
      orders!inner ( id, status, buyer_id )`
    )
    .eq('product_id', productId)
    .eq('orders.buyer_id', buyerId)
    .eq('orders.status', 'delivered')
    .limit(1)
    .single()

  if (!orderItem) {
    return { can_review: false, order_id: null, already_reviewed: false }
  }

  return { can_review: true, order_id: orderItem.order_id, already_reviewed: false }
}

// ─── Get Buyer's Review for a Product ────────────────────────────────────────

export const getBuyerReviewForProduct = async (
  buyerId: string,
  productId: string
): Promise<Review | null> => {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('product_id', productId)
    .single()

  if (error || !data) return null
  return data
}

// ─── Delete Review (Admin only) ───────────────────────────────────────────────
// avg_rating auto-recalculated by DB trigger on delete

export const deleteReview = async (reviewId: string): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('id', reviewId)
    .single()

  if (error || !data) throw new Error('Review not found')

  const { error: deleteError } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (deleteError) throw new Error(deleteError.message)
}
