import { Request, Response } from 'express'
import { ApiResponse } from '../types'
import {
  searchProducts,
  getSearchSuggestions,
  getProductsByCity,
  getTrendingProducts,
  getNewArrivals,
  SearchResult,
} from '../services/search.service'
import { ProductWithImages } from '../services/product.service'

// ─── GET /api/search ──────────────────────────────────────────────────────────
// Main search endpoint — all filters as query params
//
// Query params:
//   q           string   — search term
//   category_id uuid
//   city        string
//   province    string
//   min_price   number
//   max_price   number
//   is_handmade boolean
//   sort        newest | price_asc | price_desc | top_rated | relevance
//   page        number   (default 1)
//   limit       number   (default 12, max 50)

export const searchHandler = async (
  req: Request,
  res: Response<ApiResponse<SearchResult>>
): Promise<void> => {
  try {
    const {
      q,
      category_id,
      city,
      province,
      min_price,
      max_price,
      is_handmade,
      sort,
      page,
      limit,
    } = req.query

    const result = await searchProducts({
      query: q as string | undefined,
      category_id: category_id as string | undefined,
      city: city as string | undefined,
      province: province as string | undefined,
      min_price: min_price ? Number(min_price) : undefined,
      max_price: max_price ? Number(max_price) : undefined,
      is_handmade:
        is_handmade === 'true' ? true : is_handmade === 'false' ? false : undefined,
      sort: sort as 'newest' | 'price_asc' | 'price_desc' | 'top_rated' | 'relevance' | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 50) : 12,
    })

    res.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/search/suggestions ─────────────────────────────────────────────
// Autocomplete — returns up to 5 product titles matching the query
// Query params: q (required, min 2 chars)

export const suggestionsHandler = async (
  req: Request,
  res: Response<ApiResponse<string[]>>
): Promise<void> => {
  try {
    const { q } = req.query

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.json({ success: true, data: [] })
      return
    }

    const suggestions = await getSearchSuggestions(q.trim())
    res.json({ success: true, data: suggestions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch suggestions'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/search/trending ─────────────────────────────────────────────────
// Top rated products — homepage featured section
// Query params: limit (default 8)

export const trendingHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductWithImages[]>>
): Promise<void> => {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 20) : 8
    const products = await getTrendingProducts(limit)
    res.json({ success: true, data: products })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch trending products'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/search/new-arrivals ─────────────────────────────────────────────
// Most recently added products
// Query params: limit (default 8)

export const newArrivalsHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductWithImages[]>>
): Promise<void> => {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 20) : 8
    const products = await getNewArrivals(limit)
    res.json({ success: true, data: products })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch new arrivals'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/search/by-city ──────────────────────────────────────────────────
// Products filtered by city — homepage "local picks" section
// Query params: city (required), limit (default 8)

export const byCityHandler = async (
  req: Request,
  res: Response<ApiResponse<ProductWithImages[]>>
): Promise<void> => {
  try {
    const { city, limit } = req.query

    if (!city || typeof city !== 'string') {
      res.status(400).json({ success: false, message: 'city query param is required' })
      return
    }

    const products = await getProductsByCity(
      city.trim(),
      limit ? Math.min(Number(limit), 20) : 8
    )
    res.json({ success: true, data: products })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch products by city'
    res.status(500).json({ success: false, message })
  }
}
