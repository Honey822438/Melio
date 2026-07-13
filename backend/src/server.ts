import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { ApiResponse } from './types'
import authRoutes from './routes/auth.routes'
import productRoutes from './routes/product.routes'
import categoryRoutes from './routes/category.routes'
import sellerRoutes from './routes/seller.routes'
import adminRoutes from './routes/admin.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 5000

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response<ApiResponse<{ uptime: number }>>) => {
  res.json({
    success: true,
    data: { uptime: process.uptime() },
    message: 'Melio backend is running',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/seller', sellerRoutes)
app.use('/api/admin', adminRoutes)

// 404 handler
app.use((_req: Request, res: Response<ApiResponse<null>>) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Melio backend running on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
})

export default app
