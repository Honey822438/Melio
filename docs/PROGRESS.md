# Melio — Development Progress

> Last Updated: M7 Complete

---

## Overall Status

| Milestone | Status | Files Created/Modified |
|---|---|---|
| M0 | ✅ Complete | server.ts, tsconfig.json, .env.example, src/config/supabase.ts, src/types/index.ts |
| M1 | ✅ Complete | src/middleware/auth.ts, src/services/auth.service.ts, src/controllers/auth.controller.ts, src/routes/auth.routes.ts, src/db/migrations/001_create_users.sql, src/db/seeds/seed-admin.ts |
| M2 | ✅ Complete | src/services/product.service.ts, src/controllers/product.controller.ts, src/routes/product.routes.ts, src/routes/seller.routes.ts, src/routes/admin.routes.ts, src/db/migrations/002_create_products.sql |
| M3 | ✅ Complete | src/services/search.service.ts, src/controllers/search.controller.ts, src/routes/search.routes.ts, src/db/migrations/004_search_index.sql |
| M4 | ✅ Complete | src/services/cart.service.ts, src/services/order.service.ts, src/controllers/cart.controller.ts, src/controllers/order.controller.ts, src/routes/cart.routes.ts, src/routes/order.routes.ts, src/db/migrations/005_create_cart_orders.sql |
| M5 | ✅ Complete | Covered fully in M4 — order status, seller order views, buyer tracking, cancel order |
| M6 | ✅ Complete | src/services/review.service.ts, src/controllers/review.controller.ts, src/routes/review.routes.ts, src/db/migrations/006_create_reviews.sql |
| M7 | ✅ Complete | src/services/seller.dashboard.service.ts, src/services/admin.dashboard.service.ts, src/controllers/seller.dashboard.controller.ts, src/controllers/admin.dashboard.controller.ts |
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

## M4 — Cart & Checkout ✅

**Goal:** Buyers can manage a cart and place orders with stock management

### What Was Built

- Full cart CRUD: add, view, update quantity, remove item, clear cart
- Upsert logic on add — if item already in cart, quantity increments
- Stock validation on every add/update
- Sellers cannot add their own products to cart
- Order placement: fetches cart → validates stock → creates order + items → decrements stock → clears cart
- Address snapshot saved as JSONB at time of order (never affected by future address changes)
- Price locked at purchase time (`price_at_purchase` on order items)
- Buyer can cancel order while status is `pending` — stock is restored
- Seller can update order status through the progression: `pending → processing → shipped → delivered`
- Status regression blocked (cannot move backwards)
- Admin can view all orders, optionally filtered by status

### Files Created

| File | Purpose |
|---|---|
| `src/services/cart.service.ts` | getCart, addToCart (upsert), updateCartQuantity, removeFromCart, clearCart |
| `src/services/order.service.ts` | placeOrder, getOrderById, getBuyerOrders, getSellerOrders, updateOrderStatus, cancelOrder |
| `src/controllers/cart.controller.ts` | Request/response handling for all cart endpoints |
| `src/controllers/order.controller.ts` | Request/response handling for all order endpoints |
| `src/routes/cart.routes.ts` | Cart routes mounted at `/api/cart` — buyer only |
| `src/routes/order.routes.ts` | Order routes mounted at `/api/orders` — buyer only |
| `src/db/migrations/005_create_cart_orders.sql` | Creates cart_items (UNIQUE buyer+product), orders (with JSONB address snapshot), order_items tables |

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | buyer | Get cart with product details + total |
| POST | `/api/cart` | buyer | Add item (or increment quantity if exists) |
| PUT | `/api/cart/:itemId` | buyer | Update item quantity |
| DELETE | `/api/cart/:itemId` | buyer | Remove item |
| DELETE | `/api/cart` | buyer | Clear entire cart |
| POST | `/api/orders` | buyer | Place order from cart |
| GET | `/api/orders` | buyer | Get buyer's order history |
| GET | `/api/orders/:id` | buyer | Get single order with items |
| PUT | `/api/orders/:id/cancel` | buyer | Cancel order (pending only) |
| GET | `/api/seller/orders` | isApprovedSeller | Get orders containing seller's items |
| PUT | `/api/seller/orders/:id/status` | isApprovedSeller | Update order status |
| GET | `/api/admin/orders` | isAdmin | Get all orders (filterable by status) |

### Key Rules Implemented

- Stock decremented atomically per item on order placement
- Stock restored if buyer cancels
- `price_at_purchase` locked at order time — price changes don't affect existing orders
- `address_snapshot` JSONB — delivery address frozen at order time
- Sellers only see orders that contain their own items
- Status progression enforced: cannot go backwards, only forwards

---

## M7 — Dashboards ✅

**Goal:** Seller and Admin have dedicated stats and management endpoints

### What Was Built

**Seller Dashboard:**
- Summary stats: total revenue, total orders, total products, total reviews, avg rating, orders broken down by status
- Top 5 products by revenue (aggregated from order history)
- Recent 10 orders with buyer name, product info, and status

**Admin Dashboard:**
- Platform stats: total users, buyers, sellers, pending approvals, products, orders, total revenue, this month's orders and revenue — all fetched in parallel
- Pending seller approvals list (sellers awaiting verification)
- Verify a seller (sets `is_verified = true`)
- Reject/delete an unverified seller account
- List all users (filterable by role, paginated)
- Recent orders overview with item counts

### Files Created

| File | Purpose |
|---|---|
| `src/services/seller.dashboard.service.ts` | getSellerStats, getSellerTopProducts, getSellerRecentOrders |
| `src/services/admin.dashboard.service.ts` | getPlatformStats, getPendingSellerApprovals, verifySeller, rejectSeller, listUsers, getAdminRecentOrders |
| `src/controllers/seller.dashboard.controller.ts` | Request/response for seller dashboard endpoints |
| `src/controllers/admin.dashboard.controller.ts` | Request/response for admin dashboard endpoints |

### Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/seller/dashboard/stats` | isApprovedSeller | Revenue, orders, products, avg rating, status breakdown |
| GET | `/api/seller/dashboard/top-products` | isApprovedSeller | Top products by revenue (default 5) |
| GET | `/api/seller/dashboard/recent-orders` | isApprovedSeller | Recent orders (default 10) |
| GET | `/api/admin/dashboard/stats` | isAdmin | Full platform stats |
| GET | `/api/admin/dashboard/recent-orders` | isAdmin | Recent orders across platform |
| GET | `/api/admin/users` | isAdmin | List all users (filterable by role) |
| GET | `/api/admin/sellers/pending` | isAdmin | Sellers awaiting approval |
| PUT | `/api/admin/sellers/:id/verify` | isAdmin | Approve a seller |
| DELETE | `/api/admin/sellers/:id` | isAdmin | Reject and delete an unverified seller |

---

## What's Next

### M8 — Payments (Up Next)

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
