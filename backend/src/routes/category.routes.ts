import { Router } from 'express'
import { getCategoriesHandler, getCategoryByIdHandler } from '../controllers/category.controller'

const router = Router()

// Public
router.get('/', getCategoriesHandler)
router.get('/:id', getCategoryByIdHandler)

export default router
