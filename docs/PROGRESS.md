# Melio — Development Progress

> Last Updated: M3 Complete

---

## Overall Status

| Milestone | Status | Files Created/Modified |
|---|---|---|
| M0 | ✅ Complete | server.ts, tsconfig.json, .env.example, src/config/supabase.ts, src/types/index.ts |
| M1 | ✅ Complete | src/middleware/auth.ts, src/services/auth.service.ts, src/controllers/auth.controller.ts, src/routes/auth.routes.ts, src/db/migrations/001_create_users.sql, src/db/seeds/seed-admin.ts |
| M2 | ✅ Complete | src/services/product.service.ts, src/controllers/product.controller.ts, src/routes/product.routes.ts, src/routes/seller.routes.ts, src/routes/admin.routes.ts, src/db/migrations/002_create_products.sql |
| M3 | ✅ Complete | src/services/search.service.ts, src/controllers/search.controller.ts, src/routes/search.routes.ts, src/db/migrations/004_search_index.sql |
| M4 | ⬜ Not Started | — |
| M5 | ⬜ Not Started | — |
| M6 | ⬜ Not Started | — |
| M7 | ⬜ Not Started | — |
| M8 | ⬜ Not Started | — |
| M9 | ⬜ Not Started | — |
| M10 | ⬜ Not Started | — |

---

## M0 — Project Setup ✅

**Goal:** Working Express + TypeScript server connected to Supabase

### What Was Built

- Express server running on port 5000
- TypeScript configured (strict mode, no any)
- Supabase client setup with two clients: `supabase` (anon key) and `supabaseAdmin` (service role key, bypasses RLS)
- Health check endpoint `GET /api/health`
- Environment variables structure defined
- All core TypeScript interfaces defined upfront

### Files Created

| File | Purpose |
|---|---|
| `server.ts` | Entry point — Express app, middleware, route mounting, port 5000 |
| `tsconfig.json` | TypeScript config — strict mode on, noUnusedLocals, noImplicitReturns |
| `.env.example` | Placeholder env vars (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, PORT, ADMIN_EMAIL, ADMIN_PASSWORD, FRONTEND_URL) |
| `src/config/supabase.ts` | Two Supabase clients — anon (RLS-respecting) and admin (service role, server-only) |
| `src/types/index.ts` | Core interfaces: User, SellerProfile, Product, ProductImage, Category, CartItem, Order, OrderItem, OrderStatus, PaymentMethod, AddressSnapshot, Review, ApiResponse<T>, PaginatedResponse<T>, JwtPayload |

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Server health check — returns uptime |

---

## M1 — Authentication System ✅

**Goal:** Complete auth for Buyer, Seller, Admin roles with JWT

### What Was Built

- Separate signup flows for Buyer and Seller
- JWT-based authentication (login returns signed token)
- Role-based middleware: `verifyToken`, `requireRole(...roles)`, `isApprovedSeller`
- Seller approval system — Admin must set `is_verified = true` before seller can list products
- Admin account seeded via one-time script
- Supabase migration for users table with RLS bypass via service role key

### Files Created

| File | Purpose |
|---|---|
| `src/middleware/auth.ts` | `verifyToken`, `requireRole(...roles)`, `isApprovedSeller` middleware |
| `src/services/auth.service.ts` | DB logic — registerBuyer, registerSeller, loginUser, getUserById, updateUserProfile |
| `src/controllers/auth.controller.ts` | Request/response handling + input validation for all auth endpoints |
| `src/routes/auth.routes.ts` | Route definitions mounted at `/api/auth` |
| `src/db/migrations/001_create_users.sql` | Creates users table: id, name, email, password_hash, role, city, province, shop_name, shop_bio, logo_url, is_verified, created_at |
| `src/db/seeds/seed-admin.ts` | One-time script to seed admin account — reads ADMIN_EMAIL/ADMIN_PASSWORD from .env |

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/buyer` | None | Register new buyer |
| POST | `/api/auth/register/seller` | None | Register new seller (pending admin approval) |
| POST | `/api/auth/login` | None | Login — returns JWT token + user object |
| POST | `/api/auth/logout` | None | Logout (stateless — client drops token) |
| GET | `/api/auth/me` | verifyToken | Get current user profile |
| PUT | `/api/auth/profile` | verifyToken | Update name, city, province, shop fields |

### Key Rules Implemented

- Passwords hashed with bcryptjs (12 salt rounds)
- JWT payload contains: `userId`, `email`, `role`, `is_verified`
- Seller gets token on registration but `isApprovedSeller` middleware blocks protected routes until `is_verified = true`
- Admin seeded manually — no public admin registration endpoint
- All DB queries use `supabaseAdmin` (service role) to bypass RLS

---

## M2 — Product Management ✅

**Goal:** Sellers can list products with images. Everyone can browse.

### What Was Built

- Full product CRUD for sellers (own products only — ownership verified in service layer)
- Multiple image upload (up to 5 images, 5MB each) via Multer memory storage → Supabase Storage
- Images stored in `product-images` bucket, URLs saved to `product_images` table
- Category system with 6 default categories seeded in migration
- Admin can moderate all products and manage categories
- Delete product cascade — images deleted from Storage before DB row removed

### Files Created

| File | Purpose |
|---|---|
| `src/middleware/upload.ts` | Multer config — memory storage, JPEG/PNG/WebP only, 5MB limit, max 5 files |
| `src/services/product.service.ts` | Full product CRUD, image upload/delete to Supabase Storage, recalculateAvgRating stub for M6 |
| `src/services/category.service.ts` | getAllCategories, getCategoryById, createCategory, deleteCategory |
| `src/controllers/product.controller.ts` | Request/response handling for all product endpoints (public, seller, admin) |
| `src/controllers/category.controller.ts` | Request/response handling for category endpoints |
| `src/routes/product.routes.ts` | Public product routes + seller create/edit/delete |
| `src/routes/seller.routes.ts` | Seller dashboard routes — get own products |
| `src/routes/admin.routes.ts` | Admin-only routes — all products, delete any, category CRUD |
| `src/routes/category.routes.ts` | Public category routes |
| `src/db/migrations/002_create_products.sql` | Creates categories, products, product_images tables. Seeds 6 default categories. |
| `src/db/migrations/003_storage_bucket.md` | Instructions for creating product-images Storage bucket in Supabase dashboard |

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | None | Get all products (paginated, filterable) |
| GET | `/api/products/:id` | None | Get single product with images + seller info |
| GET | `/api/categories` | None | Get all categories |
| GET | `/api/categories/:id` | None | Get single category |
| POST | `/api/products` | isApprovedSeller | Create product (multipart/form-data with images) |
| PUT | `/api/products/:id` | isApprovedSeller | Update own product |
| DELETE | `/api/products/:id` | isApprovedSeller | Delete own product + images |
| GET | `/api/seller/products` | isSeller + isApprovedSeller | Get seller's own product list |
| GET | `/api/admin/products` | isAdmin | Get all products |
| DELETE | `/api/admin/products/:id` | isAdmin | Delete any product |
| POST | `/api/admin/categories` | isAdmin | Create new category |
| DELETE | `/api/admin/categories/:id` | isAdmin | Delete category (blocked if products exist) |

### Query Params for GET /api/products

`category_id`, `seller_id`, `min_price`, `max_price`, `city`, `province`, `is_handmade`, `sort` (newest/price_asc/price_desc/top_rated), `page`, `limit` (max 50)

---

## M3 — Search & Discovery ✅

**Goal:** Buyers can find products via full-text search, filters, and sorting

### What Was Built

- Full-text search using PostgreSQL `tsvector` — generated column `search_vector` on products table combining title + description
- GIN index on `search_vector` for fast queries
- Prefix matching (partial word search supported — "lah" matches "Lahori")
- Filter by category, city, province, price range, is_handmade
- Sort by newest, price_asc, price_desc, top_rated, relevance
- Only in-stock products returned (stock > 0)
- Autocomplete suggestions endpoint (min 2 chars, returns up to 5 titles)
- Trending products (top rated) for homepage
- New arrivals (most recent) for homepage
- Products by city for homepage "local picks" section

### Files Created

| File | Purpose |
|---|---|
| `src/services/search.service.ts` | searchProducts, getSearchSuggestions, getTrendingProducts, getNewArrivals, getProductsByCity |
| `src/controllers/search.controller.ts` | Request/response handling for all 5 search endpoints |
| `src/routes/search.routes.ts` | Search route definitions mounted at `/api/search` |
| `src/db/migrations/004_search_index.sql` | Adds search_vector generated tsvector column, GIN index, and indexes on city, province, price, is_handmade |

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/search` | None | Full-text search with all filters |
| GET | `/api/search/suggestions?q=lah` | None | Autocomplete — returns up to 5 titles |
| GET | `/api/search/trending` | None | Top rated products (homepage) |
| GET | `/api/search/new-arrivals` | None | Most recently added (homepage) |
| GET | `/api/search/by-city?city=Multan` | None | Products from a specific city |

### Query Params for GET /api/search

`q`, `category_id`, `city`, `province`, `min_price`, `max_price`, `is_handmade`, `sort` (newest/price_asc/price_desc/top_rated/relevance), `page`, `limit` (max 50)

---

## What's Next

### M4 — Cart & Checkout (Up Next)

- `cart_items` table migration
- Add to cart, update quantity, remove from cart, clear cart
- Order placement with address snapshot
- Payment method selection: COD or JazzCash
- Stock decrement on order confirmed

### M5 — Order Management

- Seller manually updates order status (pending → processing → shipped → delivered)
- Buyer can view and track own orders
- Cancel order (buyer, within window)

### M6 — Reviews & Ratings

- Buyer can review a product only after a delivered order
- One review per buyer per product
- avg_rating recalculated on every new review

### M7 — Dashboards

- Seller dashboard: sales stats, product list, order management
- Admin dashboard: user management, seller verification, platform metrics

### M8 — Payments

- COD: already functional (no integration needed)
- JazzCash: Phase 1 mobile wallet integration
- Stripe: Phase 2 card payments

### M9 — Polish

- Rate limiting
- Error logging
- Input sanitisation hardening

### M10 — Deployment

- Backend → Railway
- Frontend → Vercel
- Production Supabase project (separate from dev)
