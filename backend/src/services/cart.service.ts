import { supabaseAdmin } from '../config/supabase'
import { CartItem } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItemWithProduct extends CartItem {
  product: {
    id: string
    title: string
    price: number
    stock: number
    city: string
    province: string
    is_handmade: boolean
    seller_id: string
    image_url: string | null
    seller_name: string | null
    seller_shop_name: string | null
  }
}

export interface CartSummary {
  items: CartItemWithProduct[]
  item_count: number
  total: number
}

// ─── Get Cart ─────────────────────────────────────────────────────────────────

export const getCart = async (buyerId: string): Promise<CartSummary> => {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select(
      `id, buyer_id, product_id, quantity, created_at,
      products (
        id, title, price, stock, city, province, is_handmade, seller_id,
        product_images ( image_url, "order" ),
        users!seller_id ( name, shop_name )
      )`
    )
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const items: CartItemWithProduct[] = (data ?? []).map((row) => {
    const p = row.products as unknown as Record<string, unknown>
    const images = (p.product_images as { image_url: string; order: number }[] ?? [])
      .sort((a, b) => a.order - b.order)
    const seller = p.users as { name: string; shop_name: string } | null

    return {
      id: row.id,
      buyer_id: row.buyer_id,
      product_id: row.product_id,
      quantity: row.quantity,
      product: {
        id: p.id as string,
        title: p.title as string,
        price: p.price as number,
        stock: p.stock as number,
        city: p.city as string,
        province: p.province as string,
        is_handmade: p.is_handmade as boolean,
        seller_id: p.seller_id as string,
        image_url: images[0]?.image_url ?? null,
        seller_name: seller?.name ?? null,
        seller_shop_name: seller?.shop_name ?? null,
      },
    }
  })

  // Filter out items whose product no longer exists
  const validItems = items.filter((i) => i.product.id)

  const total = validItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return {
    items: validItems,
    item_count: validItems.reduce((sum, item) => sum + item.quantity, 0),
    total: Math.round(total * 100) / 100,
  }
}

// ─── Add Item ─────────────────────────────────────────────────────────────────

export const addToCart = async (
  buyerId: string,
  productId: string,
  quantity: number
): Promise<CartItemWithProduct[]> => {
  // Verify product exists and has enough stock
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, stock, seller_id')
    .eq('id', productId)
    .single()

  if (productError || !product) throw new Error('Product not found')
  if (product.stock < quantity) throw new Error(`Only ${product.stock} items in stock`)

  // Buyers cannot buy their own products
  if (product.seller_id === buyerId) {
    throw new Error('You cannot add your own product to cart')
  }

  // Upsert — if item exists, increment quantity; otherwise insert
  const { data: existing } = await supabaseAdmin
    .from('cart_items')
    .select('id, quantity')
    .eq('buyer_id', buyerId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    const newQty = existing.quantity + quantity
    if (newQty > product.stock) {
      throw new Error(`Cannot add ${quantity} more — only ${product.stock - existing.quantity} additional items available`)
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', existing.id)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .insert({ buyer_id: buyerId, product_id: productId, quantity })

    if (error) throw new Error(error.message)
  }

  const cart = await getCart(buyerId)
  return cart.items
}

// ─── Update Quantity ──────────────────────────────────────────────────────────

export const updateCartQuantity = async (
  buyerId: string,
  cartItemId: string,
  quantity: number
): Promise<CartItemWithProduct[]> => {
  // Verify ownership
  const { data: item, error: itemError } = await supabaseAdmin
    .from('cart_items')
    .select('id, product_id, buyer_id')
    .eq('id', cartItemId)
    .single()

  if (itemError || !item) throw new Error('Cart item not found')
  if (item.buyer_id !== buyerId) throw new Error('Not authorised')

  // Verify stock
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('stock')
    .eq('id', item.product_id)
    .single()

  if (!product) throw new Error('Product no longer available')
  if (quantity > product.stock) throw new Error(`Only ${product.stock} items in stock`)

  const { error } = await supabaseAdmin
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)

  if (error) throw new Error(error.message)

  const cart = await getCart(buyerId)
  return cart.items
}

// ─── Remove Item ──────────────────────────────────────────────────────────────

export const removeFromCart = async (
  buyerId: string,
  cartItemId: string
): Promise<CartItemWithProduct[]> => {
  const { data: item, error: itemError } = await supabaseAdmin
    .from('cart_items')
    .select('id, buyer_id')
    .eq('id', cartItemId)
    .single()

  if (itemError || !item) throw new Error('Cart item not found')
  if (item.buyer_id !== buyerId) throw new Error('Not authorised')

  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)

  if (error) throw new Error(error.message)

  const cart = await getCart(buyerId)
  return cart.items
}

// ─── Clear Cart ───────────────────────────────────────────────────────────────

export const clearCart = async (buyerId: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('buyer_id', buyerId)

  if (error) throw new Error(error.message)
}
