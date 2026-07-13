import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { ApiResponse, Product } from '../types'
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  CreateProductInput,
  UpdateProductInput,
  ProductWithImages,
} from '../services/product.service'

// ─── GET /api/products ────────────────────────────────────────────────────────

export const getProductsHandler = async (
  req: Request,
  res: Response<ApiResponse<{ products: ProductWithImages[]; total: number }>>
): Promise<void> => {
  try {
    const {
      category_id,
      seller_id,
      min_price,
      max_price,
      city,
      province,
      is_handmade,
      sort,
      page,
      limit,
    } = req.query

    const result = await getProducts({
      category_id: category_id as string | undefined,
      seller_id: seller_id as string | undefined,
      min_price: min_price ? Number(min_price) : undefined,
      max_price: max_price ? Number(max_price) : undefined,
      city: city as string | undefined,
      province: province as string | undefined,
      is_handmade: is_handmade === 'true' ? true : is_handmade === 'false' ? false : undefined,
      sort: sort as 'newest' | 'price_asc' | 'price_desc' | 'top_rated' | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 50) : 12,
    })

    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch products'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/products/:id ────────────────────────────────────────────────────

export const getProductByIdHandler = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<ProductWithImages>>
): Promise<void> => {
  try {
    const product = await getProductById(req.params.id)
    res.json({ success: true, data: product })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Product not found'
    res.status(404).json({ success: false, message })
  }
}

// ─── POST /api/products ───────────────────────────────────────────────────────

export const createProductHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<ProductWithImages>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    const { category_id, title, description, price, city, province, stock, is_handmade } =
      req.body

    if (!category_id || !title || !description || !price || !city || !province) {
      res.status(400).json({
        success: false,
        message: 'Required: category_id, title, description, price, city, province',
      })
      return
    }

    const files = (req.files as Express.Multer.File[]) ?? []

    const input: CreateProductInput = {
      seller_id: req.user.userId,
      category_id,
      title,
      description,
      price: Number(price),
      city,
      province,
      stock: stock ? Number(stock) : 0,
      is_handmade: is_handmade === 'true' || is_handmade === true,
    }

    const product = await createProduct(input, files)
    res.status(201).json({ success: true, data: product })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product'
    res.status(500).json({ success: false, message })
  }
}

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

export const updateProductHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<Product>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    const input: UpdateProductInput = {
      category_id: req.body.category_id,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price ? Number(req.body.price) : undefined,
      city: req.body.city,
      province: req.body.province,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : undefined,
      is_handmade:
        req.body.is_handmade !== undefined
          ? req.body.is_handmade === 'true' || req.body.is_handmade === true
          : undefined,
    }

    const product = await updateProduct(req.params.id, req.user.userId, input)
    res.json({ success: true, data: product })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update product'
    const status = message.includes('Not authorised') ? 403 : message.includes('not found') ? 404 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── DELETE /api/products/:id (Seller) ───────────────────────────────────────

export const deleteProductHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    await deleteProduct(req.params.id, req.user.userId, false)
    res.json({ success: true, message: 'Product deleted' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product'
    const status = message.includes('Not authorised') ? 403 : message.includes('not found') ? 404 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── GET /api/seller/products ─────────────────────────────────────────────────

export const getSellerProductsHandler = async (
  req: AuthRequest,
  res: Response<ApiResponse<ProductWithImages[]>>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }

    const products = await getSellerProducts(req.user.userId)
    res.json({ success: true, data: products })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch products'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/admin/products ──────────────────────────────────────────────────

export const adminGetProductsHandler = async (
  req: Request,
  res: Response<ApiResponse<{ products: ProductWithImages[]; total: number }>>
): Promise<void> => {
  try {
    const { page, limit, seller_id, category_id } = req.query

    const result = await getProducts({
      seller_id: seller_id as string | undefined,
      category_id: category_id as string | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
    })

    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch products'
    res.status(500).json({ success: false, message })
  }
}

// ─── DELETE /api/admin/products/:id ──────────────────────────────────────────

export const adminDeleteProductHandler = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    await deleteProduct(req.params.id, null, true)
    res.json({ success: true, message: 'Product deleted by admin' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product'
    const status = message.includes('not found') ? 404 : 500
    res.status(status).json({ success: false, message })
  }
}
