import { Request, Response } from 'express'
import { ApiResponse, Category } from '../types'
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  deleteCategory,
} from '../services/category.service'

// ─── GET /api/categories ──────────────────────────────────────────────────────

export const getCategoriesHandler = async (
  _req: Request,
  res: Response<ApiResponse<Category[]>>
): Promise<void> => {
  try {
    const categories = await getAllCategories()
    res.json({ success: true, data: categories })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch categories'
    res.status(500).json({ success: false, message })
  }
}

// ─── GET /api/categories/:id ──────────────────────────────────────────────────

export const getCategoryByIdHandler = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<Category>>
): Promise<void> => {
  try {
    const category = await getCategoryById(req.params.id)
    res.json({ success: true, data: category })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Category not found'
    res.status(404).json({ success: false, message })
  }
}

// ─── POST /api/admin/categories ───────────────────────────────────────────────

export const createCategoryHandler = async (
  req: Request,
  res: Response<ApiResponse<Category>>
): Promise<void> => {
  try {
    const { name, slug } = req.body

    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'name and slug are required' })
      return
    }

    // Normalise slug: lowercase, replace spaces with hyphens
    const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const category = await createCategory({ name, slug: normalizedSlug })
    res.status(201).json({ success: true, data: category })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create category'
    const status = message.includes('already exists') ? 409 : 500
    res.status(status).json({ success: false, message })
  }
}

// ─── DELETE /api/admin/categories/:id ────────────────────────────────────────

export const deleteCategoryHandler = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    await deleteCategory(req.params.id)
    res.json({ success: true, message: 'Category deleted' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete category'
    const status = message.includes('Cannot delete') ? 409 : message.includes('not found') ? 404 : 500
    res.status(status).json({ success: false, message })
  }
}
