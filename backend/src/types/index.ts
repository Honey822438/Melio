// ─── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  city: string
  province: string
  is_verified: boolean
  created_at: string
}

export interface SellerProfile extends User {
  shop_name: string
  shop_bio: string
  logo_url: string | null
  avg_rating: number
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category_id: string
  city: string
  province: string
  stock: number
  is_handmade: boolean
  avg_rating: number
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  order: number
}

export interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string
  buyer_id: string
  product_id: string
  quantity: number
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentMethod = 'cod' | 'jazzcash' | 'stripe'

export interface Order {
  id: string
  buyer_id: string
  total_amount: number
  status: OrderStatus
  payment_method: PaymentMethod
  address_snapshot: AddressSnapshot
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  seller_id: string
  quantity: number
  price_at_purchase: number
}

export interface AddressSnapshot {
  full_name: string
  phone: string
  address_line: string
  city: string
  province: string
  postal_code: string
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  buyer_id: string
  product_id: string
  order_id: string
  rating: number
  comment: string
  created_at: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number
  page: number
  limit: number
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string
  role: 'buyer' | 'seller' | 'admin'
  email: string
  is_verified: boolean
}
