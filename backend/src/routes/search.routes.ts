import { Router } from 'express'
import {
  searchHandler,
  suggestionsHandler,
  trendingHandler,
  newArrivalsHandler,
  byCityHandler,
} from '../controllers/search.controller'

const router = Router()

// All search routes are public — no auth required
router.get('/', searchHandler)
router.get('/suggestions', suggestionsHandler)
router.get('/trending', trendingHandler)
router.get('/new-arrivals', newArrivalsHandler)
router.get('/by-city', byCityHandler)

export default router
