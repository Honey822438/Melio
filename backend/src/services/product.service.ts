import { supabaseAdmin } from '../config/supabase'
import { Product, ProductImage } from '../types'
import { v4 as uuidv4 } from 'uuid'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateProductInput {
  seller_id: string
  category_id: string
  title: string
  description: string
  price: number
  city: string
  province: string
  stock: number
  is_handmade: boolean
}

export interface UpdateProductInput {
  category_id?: string
  title?: string
  description?: string
  price?: number
  city?: string
  province?: string
  stock?: number
  is_handmade?: boolean
}

export interface ProductWithImages extends Product {
  images: ProductImage[]
  category_name?: string
  seller_name?: string
  seller_shop_name?: string
}

export interface GetProductsFilter {
  category_id?: string
  seller_id?: string
  min_price?: number
  max_price?: number
  city?: string
  province?: string
  is_handmade?: boolean
  search?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'top_rated'
  page?: number
  limit?: number
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

export const uploadImageToStorage = async (
  file: Express.Multer.File,
  productId: string
): Promise<string> => {
  const ext = file.originalname.split('.').pop() ?? 'jpg'
  const fileName = `${productId}/${uuidv4()}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from('product-images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (error) throw new Error(`Image upload failed: ${error.message}`)

  const { data } = supabaseAdmin.storage
    .from('product-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}

export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  // Extract path after /product-images/
  const marker = '/product-images/'
  const idx = imageUrl.indexOf(marker)
  if (idx === -1) return

  const filePath = imageUrl.slice(idx + marker.length)
  await supabaseAdmin.storage.from('product-images').remove([filePath])
}

// ─── Create Product ───────────────────────────────────────────────────────────

export const createProduct = async (
  input: CreateProductInput,
  files: Express.Multer.File[]
): Promise<ProductWithImages> => {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert(input)
    .select()
    .single()

  if (error || !product) throw new Error(error?.message ?? 'Failed to create product')

  // Upload images and insert records
  const images: ProductImage[] = []

  for (let i = 0; i < files.length; i++) {
    const imageUrl = await uploadImageToStorage(files[i], product.id)

    const { data: imgRecord, error: imgError } = await supabaseAdmin
      .from('product_images')
      .insert({ product_id: product.id, image_url: imageUrl, order: i })
      .select()
      .single()

    if (imgError || !imgRecord) throw new Error('Failed to save image record')
    images.push(imgRecord)
  }

  return { ...product, images }
}

// ─── Get All Products (Public) ────────────────────────────────────────────────

export const getProducts = async (
  filter: GetProductsFilter
): Promise<{ products: ProductWithImages[]; total: number }> => {
  const {
    category_id,
    seller_id,
    min_price,
    max_price,
    city,
    province,
    is_handmade,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = filter

  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('products')
    .select(
      `*, 
      product_images(id, image_url, "order"),
      categories(name),
      users!seller_id(name, shop_name)`,
      { count: 'exact' }
    )

  if (category_id) query = query.eq('category_id', category_id)
  if (seller_id) query = query.eq('seller_id', seller_id)
  if (min_price !== undefined) query = query.gte('price', min_price)
  if (max_price !== undefined) query = query.lte('price', max_price)
  if (city) query = query.ilike('city', `%${city}%`)
  if (province) query = query.ilike('province', `%${province}%`)
  if (is_handmade !== undefined) query = query.eq('is_handmade', is_handmade)

  // Sorting
  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'top_rated':
      query = query.order('avg_rating', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const products = (data ?? []).map((p) => ({
    ...p,
    images: (p.product_images ?? []).sort(
      (a: ProductImage, b: ProductImage) => a.order - b.order
    ),
    category_name: p.categories?.name,
    seller_name: p.users?.name,
    seller_shop_name: p.users?.shop_name,
  }))

  return { products, total: count ?? 0 }
}

// ─── Get Single Product ───────────────────────────────────────────────────────

export const getProductById = async (id: string): Promise<ProductWithImages> => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      `*, 
      product_images(id, image_url, "order"),
      categories(name),
      users!seller_id(id, name, shop_name, shop_bio, logo_url, city, province, avg_rating)`
    )
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Product not found')

  return {
    ...data,
    images: (data.product_images ?? []).sort(
      (a: ProductImage, b: ProductImage) => a.order - b.order
    ),
    category_name: data.categories?.name,
    seller_name: data.users?.name,
    seller_shop_name: data.users?.shop_name,
  }
}

// ─── Update Product ───────────────────────────────────────────────────────────

export const updateProduct = async (
  id: string,
  sellerId: string,
  input: UpdateProductInput
): Promise<Product> => {
  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('products')
    .select('seller_id')
    .eq('id', id)
    .single()

  if (!existing) throw new Error('Product not found')
  if (existing.seller_id !== sellerId) throw new Error('Not authorised to edit this product')

  const updates = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  )

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to update product')
  return data
}

// ─── Delete Product ───────────────────────────────────────────────────────────

export const deleteProduct = async (
  id: string,
  sellerId: string | null, // null = admin bypass
  isAdmin = false
): Promise<void> => {
  if (!isAdmin) {
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (!existing) throw new Error('Product not found')
    if (existing.seller_id !== sellerId) throw new Error('Not authorised to delete this product')
  }

  // Fetch and delete images from storage first
  const { data: images } = await supabaseAdmin
    .from('product_images')
    .select('image_url')
    .eq('product_id', id)

  if (images) {
    for (const img of images) {
      await deleteImageFromStorage(img.image_url)
    }
  }

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Get Seller's Own Products ────────────────────────────────────────────────

export const getSellerProducts = async (
  sellerId: string
): Promise<ProductWithImages[]> => {
  const { products } = await getProducts({ seller_id: sellerId, limit: 100 })
  return products
}

// ─── Recalculate avg_rating (called from reviews service in M6) ───────────────

export const recalculateAvgRating = async (productId: string): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('product_id', productId)

  if (error) return

  const ratings = (data ?? []).map((r: { rating: number }) => r.rating)
  if (ratings.length === 0) return

  const avg = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length

  await supabaseAdmin
    .from('products')
    .update({ avg_rating: Math.round(avg * 100) / 100 })
    .eq('id', productId)
}
