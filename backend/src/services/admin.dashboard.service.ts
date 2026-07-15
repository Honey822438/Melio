import { supabaseAdmin } from '../config/supabase'
import { User } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  total_users: number
  total_buyers: number
  total_sellers: number
  pending_seller_approvals: number
  total_products: number
  total_orders: number
  total_revenue: number
  orders_this_month: number
  revenue_this_month: number
}

export interface PendingSeller {
  id: string
  name: string
  email: string
  shop_name: string | null
  shop_bio: string | null
  city: string
  province: string
  created_at: string
}

export interface AdminRecentOrder {
  id: string
  buyer_name: string
  total_amount: number
  status: string
  payment_method: string
  item_count: number
  created_at: string
}

// ─── Platform Stats ───────────────────────────────────────────────────────────

export const getPlatformStats = async (): Promise<PlatformStats> => {
  // Run all count queries in parallel
  const [
    { count: totalUsers },
    { count: totalBuyers },
    { count: totalSellers },
    { count: pendingApprovals },
    { count: totalProducts },
    { count: totalOrders },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'buyer'),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
    supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'seller')
      .eq('is_verified', false),
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
  ])

  // Total revenue from all non-cancelled orders
  const { data: allOrders } = await supabaseAdmin
    .from('orders')
    .select('total_amount, created_at')
    .neq('status', 'cancelled')

  const totalRevenue = (allOrders ?? []).reduce(
    (sum, o) => sum + Number(o.total_amount),
    0
  )

  // This month stats
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const monthlyOrders = (allOrders ?? []).filter(
    (o) => new Date(o.created_at) >= startOfMonth
  )

  const revenueThisMonth = monthlyOrders.reduce(
    (sum, o) => sum + Number(o.total_amount),
    0
  )

  return {
    total_users: totalUsers ?? 0,
    total_buyers: totalBuyers ?? 0,
    total_sellers: totalSellers ?? 0,
    pending_seller_approvals: pendingApprovals ?? 0,
    total_products: totalProducts ?? 0,
    total_orders: totalOrders ?? 0,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    orders_this_month: monthlyOrders.length,
    revenue_this_month: Math.round(revenueThisMonth * 100) / 100,
  }
}

// ─── Pending Seller Approvals ─────────────────────────────────────────────────

export const getPendingSellerApprovals = async (): Promise<PendingSeller[]> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, shop_name, shop_bio, city, province, created_at')
    .eq('role', 'seller')
    .eq('is_verified', false)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Verify Seller ────────────────────────────────────────────────────────────

export const verifySeller = async (sellerId: string): Promise<User> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_verified: true })
    .eq('id', sellerId)
    .eq('role', 'seller')
    .select('id, name, email, role, city, province, shop_name, shop_bio, logo_url, is_verified, created_at')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Seller not found or already verified')
  return data
}

// ─── Reject / Deactivate Seller ───────────────────────────────────────────────

export const rejectSeller = async (sellerId: string): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', sellerId)
    .single()

  if (error || !data) throw new Error('User not found')
  if (data.role !== 'seller') throw new Error('User is not a seller')

  // Hard delete the unverified seller account
  const { error: deleteError } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', sellerId)

  if (deleteError) throw new Error(deleteError.message)
}

// ─── List All Users ───────────────────────────────────────────────────────────

export const listUsers = async (
  role?: 'buyer' | 'seller' | 'admin',
  page = 1,
  limit = 20
): Promise<{ users: Omit<User, 'password_hash'>[]; total: number }> => {
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('users')
    .select(
      'id, name, email, role, city, province, shop_name, is_verified, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role) query = query.eq('role', role)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return { users: data ?? [], total: count ?? 0 }
}

// ─── Recent Orders ────────────────────────────────────────────────────────────

export const getAdminRecentOrders = async (
  limit = 10
): Promise<AdminRecentOrder[]> => {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(
      `id, total_amount, status, payment_method, created_at,
      users!buyer_id ( name )`
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  // Get item counts per order
  const orderIds = (data ?? []).map((o) => o.id)
  const itemCountMap = new Map<string, number>()

  if (orderIds.length > 0) {
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('order_id')
      .in('order_id', orderIds)

    for (const item of items ?? []) {
      itemCountMap.set(item.order_id, (itemCountMap.get(item.order_id) ?? 0) + 1)
    }
  }

  return (data ?? []).map((o) => {
    const buyer = o.users as unknown as { name: string } | null
    return {
      id: o.id,
      buyer_name: buyer?.name ?? 'Unknown',
      total_amount: o.total_amount,
      status: o.status,
      payment_method: o.payment_method,
      item_count: itemCountMap.get(o.id) ?? 0,
      created_at: o.created_at,
    }
  })
}
