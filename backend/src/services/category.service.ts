import { supabaseAdmin } from '../config/supabase'
import { Category } from '../types'

// ─── Get All Categories ───────────────────────────────────────────────────────

export const getAllCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Get Category By ID ───────────────────────────────────────────────────────

export const getCategoryById = async (id: string): Promise<Category> => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Category not found')
  return data
}

// ─── Create Category (Admin only) ─────────────────────────────────────────────

export interface CreateCategoryInput {
  name: string
  slug: string
}

export const createCategory = async (
  input: CreateCategoryInput
): Promise<Category> => {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert(input)
    .select()
    .single()

  if (error || !data) {
    const msg = error?.message ?? 'Failed to create category'
    throw new Error(msg.includes('unique') ? 'Category already exists' : msg)
  }
  return data
}

// ─── Delete Category (Admin only) ─────────────────────────────────────────────

export const deleteCategory = async (id: string): Promise<void> => {
  // Check if any products use this category
  const { count } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if ((count ?? 0) > 0) {
    throw new Error('Cannot delete category — products are assigned to it')
  }

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
