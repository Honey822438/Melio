import { supabaseAdmin } from '../config/supabase'
import { Order, OrderItem, AddressSnapshot, PaymentMethod, OrderStatus } from '../types'
import { clearCart } from './cart.service'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[]
}

export interface OrderItemWithProduct extends OrderItem {
  product_title: string
  product_image: string | null
  seller_shop_name: string | null
}

export interface PlaceOrderInput {
  buyer_id: string
  payment_method: PaymentMethod
  address: AddressSnapshot
}

// ─── Place Order ──────────────────────────────────────────────────────────────
// Transactional logic:
//   1. Fetch buyer's cart
//   2. Validate stock for every item
//   3. Create order row
//   4. Create order_item rows (price snapshot)
//   5. Decrement stock for each product
//   6. Clear buyer's cart

export const placeOrder = async (
  input: PlaceOrderInput
): Promise<OrderWithItems> => {
  const { buyer_id, payment_method, address } = input

  // 1. Fetch cart
  const { data: cartItems, error: cartError } = await supabaseAdmin
    .from('cart_items')
    .select(
      `id, quantity,
      products ( id, title, price, stock, seller_id )`
    )
    .eq('buyer_id', buyer_id)

  if (cartError) throw new Error(cartError.message)
  if (!cartItems || cartItems.length === 0) throw new Error('Cart is empty')

  // 2. Validate stock
  for (const item of cartItems) {
    const product = item.products as unknown as {
      id: string
      title: string
      price: number
      stock: number
      seller_id: string
    } | null

    if (!product) throw new Error('One or more products no longer exist')
    if (product.stock < item.quantity) {
      throw new Error(
        `"${product.title}" only has ${product.stock} items in stock — you requested ${item.quantity}`
      )
    }
  }

  // 3. Calculate total
  const total = cartItems.reduce((sum, item) => {
    const product = item.products as unknown as { price: number }
    return sum + product.price * item.quantity
  }, 0)

  // 4. Create order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id,
      total_amount: Math.round(total * 100) / 100,
      status: 'pending',
      payment_method,
      payment_status: payment_method === 'cod' ? 'unpaid' : 'unpaid',
      address_snapshot: address,
    })
    .select()
    .single()

  if (orderError || !order) throw new Error(orderError?.message ?? 'Failed to create order')

  // 5. Create order items + decrement stock
  for (const item of cartItems) {
    const product = item.products as unknown as {
      id: string
      title: string
      price: number
      stock: number
      seller_id: string
    }

    // Insert order item with price locked at purchase time
    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        seller_id: product.seller_id,
        quantity: item.quantity,
        price_at_purchase: product.price,
      })

    if (itemError) throw new Error(`Failed to create order item: ${itemError.message}`)

    // Decrement stock
    const { error: stockError } = await supabaseAdmin
      .from('products')
      .update({ stock: product.stock - item.quantity })
      .eq('id', product.id)

    if (stockError) throw new Error(`Failed to update stock: ${stockError.message}`)
  }

  // 6. Clear cart
  await clearCart(buyer_id)

  // Return full order with items
  return getOrderById(order.id, buyer_id)
}

// ─── Get Order By ID ──────────────────────────────────────────────────────────

export const getOrderById = async (
  orderId: string,
  requesterId: string | null, // null = admin bypass
  isAdmin = false
): Promise<OrderWithItems> => {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) throw new Error('Order not found')

  // Non-admin can only view their own orders
  if (!isAdmin && order.buyer_id !== requesterId) {
    throw new Error('Not authorised to view this order')
  }

  const items = await getOrderItems(orderId)

  return { ...order, items }
}

// ─── Get Order Items ──────────────────────────────────────────────────────────

const getOrderItems = async (orderId: string): Promise<OrderItemWithProduct[]> => {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select(
      `id, order_id, product_id, seller_id, quantity, price_at_purchase, created_at,
      products ( title, product_images ( image_url, "order" ) ),
      users!seller_id ( shop_name )`
    )
    .eq('order_id', orderId)

  if (error) throw new Error(error.message)

  return (data ?? []).map((item) => {
    const product = item.products as unknown as {
      title: string
      product_images: { image_url: string; order: number }[]
    } | null
    const seller = item.users as unknown as { shop_name: string } | null
    const images = (product?.product_images ?? []).sort((a, b) => a.order - b.order)

    return {
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      seller_id: item.seller_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      created_at: item.created_at,
      product_title: product?.title ?? 'Product no longer available',
      product_image: images[0]?.image_url ?? null,
      seller_shop_name: seller?.shop_name ?? null,
    }
  })
}

// ─── Get Buyer Orders ─────────────────────────────────────────────────────────

export const getBuyerOrders = async (
  buyerId: string,
  page = 1,
  limit = 10
): Promise<{ orders: OrderWithItems[]; total: number }> => {
  const offset = (page - 1) * limit

  const { data, error, count } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  const orders = await Promise.all(
    (data ?? []).map(async (order) => {
      const items = await getOrderItems(order.id)
      return { ...order, items }
    })
  )

  return { orders, total: count ?? 0 }
}

// ─── Get Seller Orders ────────────────────────────────────────────────────────
// Returns orders that contain at least one item from this seller

export const getSellerOrders = async (
  sellerId: string,
  page = 1,
  limit = 10
): Promise<{ orders: SellerOrderView[]; total: number }> => {
  const offset = (page - 1) * limit

  // Fetch order_items for this seller, with order + buyer info
  const { data, error, count } = await supabaseAdmin
    .from('order_items')
    .select(
      `id, order_id, product_id, quantity, price_at_purchase, created_at,
      products ( title, product_images ( image_url, "order" ) ),
      orders (
        id, status, payment_method, payment_status, total_amount, address_snapshot, created_at,
        users!buyer_id ( name )
      )`,
      { count: 'exact' }
    )
    .eq('seller_id', sellerId)
    .order('created_at', { foreignTable: 'orders', ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(error.message)

  const orders: SellerOrderView[] = (data ?? []).map((item) => {
    const product = item.products as unknown as {
      title: string
      product_images: { image_url: string; order: number }[]
    } | null
    const order = item.orders as unknown as {
      id: string
      status: string
      payment_method: string
      payment_status: string
      total_amount: number
      address_snapshot: AddressSnapshot
      created_at: string
      users: { name: string } | null
    } | null
    const images = (product?.product_images ?? []).sort((a, b) => a.order - b.order)

    return {
      order_item_id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      product_title: product?.title ?? 'Product no longer available',
      product_image: images[0]?.image_url ?? null,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      order_status: (order?.status ?? 'pending') as OrderStatus,
      payment_method: (order?.payment_method ?? 'cod') as PaymentMethod,
      payment_status: order?.payment_status ?? 'unpaid',
      buyer_name: order?.users?.name ?? 'Unknown',
      address: order?.address_snapshot ?? null,
      order_created_at: order?.created_at ?? item.created_at,
    }
  })

  return { orders, total: count ?? 0 }
}

export interface SellerOrderView {
  order_item_id: string
  order_id: string
  product_id: string
  product_title: string
  product_image: string | null
  quantity: number
  price_at_purchase: number
  order_status: OrderStatus
  payment_method: PaymentMethod
  payment_status: string
  buyer_name: string
  address: AddressSnapshot | null
  order_created_at: string
}

// ─── Update Order Status (Seller) ─────────────────────────────────────────────

export const updateOrderStatus = async (
  orderId: string,
  sellerId: string,
  newStatus: OrderStatus
): Promise<Order> => {
  // Verify seller has items in this order
  const { data: sellerItem } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('order_id', orderId)
    .eq('seller_id', sellerId)
    .limit(1)
    .single()

  if (!sellerItem) throw new Error('Not authorised to update this order')

  // Enforce status progression: cannot go backwards
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')

  const progression: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']
  const currentIdx = progression.indexOf(order.status as OrderStatus)
  const newIdx = progression.indexOf(newStatus)

  if (newStatus !== 'cancelled' && newIdx <= currentIdx) {
    throw new Error(`Cannot move order from "${order.status}" to "${newStatus}"`)
  }

  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single()

  if (error || !updated) throw new Error(error?.message ?? 'Failed to update order status')
  return updated
}

// ─── Cancel Order (Buyer) ─────────────────────────────────────────────────────
// Only allowed while status is 'pending'

export const cancelOrder = async (
  orderId: string,
  buyerId: string
): Promise<Order> => {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) throw new Error('Order not found')
  if (order.buyer_id !== buyerId) throw new Error('Not authorised')
  if (order.status !== 'pending') {
    throw new Error(`Order cannot be cancelled — current status is "${order.status}"`)
  }

  // Restore stock for each item
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  for (const item of items ?? []) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()

    if (product) {
      await supabaseAdmin
        .from('products')
        .update({ stock: product.stock + item.quantity })
        .eq('id', item.product_id)
    }
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .single()

  if (updateError || !updated) throw new Error('Failed to cancel order')
  return updated
}
