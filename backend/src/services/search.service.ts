import { supabaseAdmin } from '../config/supabase'
import { ProductWithImages } from './product.service'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string          // free-text search
  category_id?: string
  city?: string
  province?: string
  min_price?: number
  max_price?: number
  is_handmade?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'top_rated' | 'relevance'
  page?: number
  limit?: number
}

export interface SearchResult {
  products: ProductWithImages[]
  total: number
  page: number
  limit: number
  query: string
}

// ─── Search Products ──────────────────────────────────────────────────────────

export const searchProducts = async (
  filters: SearchFilters
): Promise<SearchResult> => {
  const {
    query = '',
    category_id,
    city,
    province,
    min_price,
    max_price,
    is_handmade,
    sort = query ? 'relevance' : 'newest',
    page = 1,
    limit = 12,
  } = filters

  const offset = (page - 1) * limit
  const trimmed = query.trim()

  // Build the select with joins
  let dbQuery = supabaseAdmin
    .from('products')
    .select(
      `*,
      product_images(id, image_url, "order"),
      categories(name),
      users!seller_id(id, name, shop_name, city, province)`,
      { count: 'exact' }
    )

  // ─── Full-Text Filter ───────────────────────────────────────────────────────
  // Use Supabase textSearch which maps to @@ tsquery under the hood
  if (trimmed) {
    // Convert space-separated words to a tsquery: "lahori achaar" → "lahori & achaar"
    // Also support prefix matching by appending :* to each term
    const tsQuery = trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => `${w}:*`)
      .join(' & ')

    dbQuery = dbQuery.textSearch('search_vector', tsQuery, {
      type: 'plain',
      config: 'english',
    })
  }

  // ─── Filters ────────────────────────────────────────────────────────────────
  if (category_id) dbQuery = dbQuery.eq('category_id', category_id)
  if (city)        dbQuery = dbQuery.ilike('city', `%${city}%`)
  if (province)    dbQuery = dbQuery.ilike('province', `%${province}%`)
  if (min_price !== undefined) dbQuery = dbQuery.gte('price', min_price)
  if (max_price !== undefined) dbQuery = dbQuery.lte('price', max_price)
  if (is_handmade !== undefined) dbQuery = dbQuery.eq('is_handmade', is_handmade)

  // Only show products with stock > 0
  dbQuery = dbQuery.gt('stock', 0)

  // ─── Sorting ─────────────────────────────────────────────────────────────────
  // 'relevance' falls back to newest since Supabase JS doesn't expose ts_rank directly
  switch (sort) {
    case 'price_asc':
      dbQuery = dbQuery.order('price', { ascending: true })
      break
    case 'price_desc':
      dbQuery = dbQuery.order('price', { ascending: false })
      break
    case 'top_rated':
      dbQuery = dbQuery.order('avg_rating', { ascending: false })
      break
    default:
      dbQuery = dbQuery.order('created_at', { ascending: false })
  }

  // ─── Pagination ──────────────────────────────────────────────────────────────
  dbQuery = dbQuery.range(offset, offset + limit - 1)

  const { data, error, count } = await dbQuery

  if (error) throw new Error(error.message)

  const products: ProductWithImages[] = (data ?? []).map((p) => ({
    ...p,
    images: (p.product_images ?? []).sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    ),
    category_name: p.categories?.name,
    seller_name: p.users?.name,
    seller_shop_name: p.users?.shop_name,
  }))

  return {
    products,
    total: count ?? 0,
    page,
    limit,
    query: trimmed,
  }
}

// ─── Search Suggestions ───────────────────────────────────────────────────────
// Returns up to 5 matching product titles for autocomplete

export const getSearchSuggestions = async (
  query: string
): Promise<string[]> => {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return []

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('title')
    .ilike('title', `%${trimmed}%`)
    .gt('stock', 0)
    .order('avg_rating', { ascending: false })
    .limit(5)

  if (error) return []

  return (data ?? []).map((p: { title: string }) => p.title)
}

// ─── Get Products By City ─────────────────────────────────────────────────────
// Used on homepage — "Products from your city" section

export const getProductsByCity = async (
  city: string,
  limit = 8
): Promise<ProductWithImages[]> => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      `*,
      product_images(id, image_url, "order"),
      categories(name),
      users!seller_id(name, shop_name)`
    )
    .ilike('city', `%${city}%`)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((p) => ({
    ...p,
    images: (p.product_images ?? []).sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    ),
    category_name: p.categories?.name,
    seller_name: p.users?.name,
    seller_shop_name: p.users?.shop_name,
  }))
}

// ─── Get Trending Products ────────────────────────────────────────────────────
// Top rated products — used on homepage hero/featured section

export const getTrendingProducts = async (
  limit = 8
): Promise<ProductWithImages[]> => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      `*,
      product_images(id, image_url, "order"),
      categories(name),
      users!seller_id(name, shop_name)`
    )
    .gt('stock', 0)
    .order('avg_rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((p) => ({
    ...p,
    images: (p.product_images ?? []).sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    ),
    category_name: p.categories?.name,
    seller_name: p.users?.name,
    seller_shop_name: p.users?.shop_name,
  }))
}

// ─── Get New Arrivals ─────────────────────────────────────────────────────────

export const getNewArrivals = async (
  limit = 8
): Promise<ProductWithImages[]> => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      `*,
      product_images(id, image_url, "order"),
      categories(name),
      users!seller_id(name, shop_name)`
    )
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((p) => ({
    ...p,
    images: (p.product_images ?? []).sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    ),
    category_name: p.categories?.name,
    seller_name: p.users?.name,
    seller_shop_name: p.users?.shop_name,
  }))
}
