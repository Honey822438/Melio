import { supabaseAdmin } from '../config/supabase'
import { OrderStatus } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SellerStats {
  total_revenue: number
  total_orders: number
  total_products: number
  total_reviews: number
  avg_rating: number
  orders_by_status: Record<OrderStatus, number>
}

export interface SellerTopProduct {
  product_id: string
  title: string
  image_url: string | null
  total_sold: number
  total_revenue: number
  avg_rating: number
}

export interface SellerRecentOrder {
  order_item_id: string
  order_id: string
  product_title: string
  product_image: string | null
  buyer_name: string
  quantity: number
  price_at_purchase: number
  order_status: OrderStatus
  created_at: string
}

// ─── Get Seller Stats ─────────────────────────────────────────────────────────

export const getSellerStats = async (sellerId: string): Promise<SellerStats> => {
  // Total products
  const { count: totalProducts } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', sellerId)

  // All order items for this seller
  const { data: orderItems, error: orderError } = await supabaseAdmin
    .from('order_items')
    .select('quantity, price_at_purchase, order_id')
    .eq('seller_id', sellerId)

  if (orderError) throw new Error(orderError.message)

  const totalRevenue = (orderItems ?? []).reduce(
    (sum, item) => sum + item.price_at_purchase * item.quantity,
    0
  )

  // Unique order IDs
  const orderIds = [...new Set((orderItems ?? []).map((i) => i.order_id))]

  // Orders by status
  const statusCounts: Record<string, number> = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  if (orderIds.length > 0) {
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('status')
      .in('id', orderIds)

    for (const order of orders ?? []) {
      if (order.status in statusCounts) {
        statusCounts[order.status]++
      }
    }
  }

  // Reviews for seller's products
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, avg_rating')
    .eq('seller_id', sellerId)

  const productIds = (products ?? []).map((p) => p.id)
  let totalReviews = 0
  let avgRating = 0

  if (productIds.length > 0) {
    const { count: reviewCount } = await supabaseAdmin
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .in('product_id', productIds)

    totalReviews = reviewCount ?? 0

    const ratings = (products ?? [])
      .map((p) => p.avg_rating)
      .filter((r) => r > 0)

    avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 100) / 100
        : 0
  }

  return {
    total_revenue: Math.round(totalRevenue * 100) / 100,
    total_orders: orderIds.length,
    total_products: totalProducts ?? 0,
    total_reviews: totalReviews,
    avg_rating: avgRating,
    orders_by_status: statusCounts as Record<OrderStatus, number>,
  }
}

// ─── Get Top Products ─────────────────────────────────────────────────────────

export const getSellerTopProducts = async (
  sellerId: string,
  limit = 5
): Promise<SellerTopProduct[]> => {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select(
      `product_id, quantity, price_at_purchase,
      products!inner ( id, title, avg_rating, seller_id,
        product_images ( image_url, "order" )
      )`
    )
    .eq('seller_id', sellerId)

  if (error) throw new Error(error.message)

  // Aggregate by product
  const map = new Map<
    string,
    { title: string; image_url: string | null; total_sold: number; total_revenue: number; avg_rating: number }
  >()

  for (const item of data ?? []) {
    const product = item.products as unknown as {
      id: string
      title: string
      avg_rating: number
      product_images: { image_url: string; order: number }[]
    }

    const images = (product.product_images ?? []).sort((a, b) => a.order - b.order)
    const existing = map.get(item.product_id)

    if (existing) {
      existing.total_sold += item.quantity
      existing.total_revenue += item.price_at_purchase * item.quantity
    } else {
      map.set(item.product_id, {
        title: product.title,
        image_url: images[0]?.image_url ?? null,
        total_sold: item.quantity,
        total_revenue: item.price_at_purchase * item.quantity,
        avg_rating: product.avg_rating,
      })
    }
  }

  return Array.from(map.entries())
    .map(([product_id, stats]) => ({ product_id, ...stats }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit)
}

// ─── Get Recent Orders ────────────────────────────────────────────────────────

export const getSellerRecentOrders = async (
  sellerId: string,
  limit = 10
): Promise<SellerRecentOrder[]> => {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select(
      `id, order_id, quantity, price_at_purchase, created_at,
      products ( title, product_images ( image_url, "order" ) ),
      orders ( status, users!buyer_id ( name ) )`
    )
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((item) => {
    const product = item.products as unknown as {
      title: string
      product_images: { image_url: string; order: number }[]
    } | null
    const order = item.orders as unknown as {
      status: string
      users: { name: string } | null
    } | null
    const images = (product?.product_images ?? []).sort((a, b) => a.order - b.order)

    return {
      order_item_id: item.id,
      order_id: item.order_id,
      product_title: product?.title ?? 'N/A',
      product_image: images[0]?.image_url ?? null,
      buyer_name: order?.users?.name ?? 'Unknown',
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      order_status: (order?.status ?? 'pending') as OrderStatus,
      created_at: item.created_at,
    }
  })
}
