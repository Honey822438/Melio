# 🗺️ Melio — Project Milestones & Roadmap
> *Every milestone is independently demoable. Build one, ship one, show one.*

---

## Milestone Summary

| # | Milestone | Status |
|---|---|---|
| M0 | Project Setup & Architecture | ⬜ Not Started |
| M1 | Authentication System | ⬜ Not Started |
| M2 | Product Management | ⬜ Not Started |
| M3 | Search & Discovery | ⬜ Not Started |
| M4 | Cart & Checkout | ⬜ Not Started |
| M5 | Order Management | ⬜ Not Started |
| M6 | Reviews & Ratings | ⬜ Not Started |
| M7 | Dashboards (All Roles) | ⬜ Not Started |
| M8 | Payments (COD + JazzCash) | ⬜ Not Started |
| M9 | Notifications & Polish | ⬜ Not Started |
| M10 | Deployment | ⬜ Not Started |

---

## 🏁 Milestone 0 — Project Setup & Architecture
> **Goal:** Sab kuch ready ho development ke liye

### Both
- [ ] GitHub repo create (`/melio` monorepo: `/frontend` + `/backend` + `/docs`)
- [ ] Lovable.dev frontend generated from mega prompt → exported to `/frontend`
- [ ] README.md written
- [ ] Branching strategy agreed

### Backend
- [ ] Express + TypeScript project initialize
- [ ] `tsconfig.json` configured
- [ ] Folder structure created (controllers, routes, middleware, services, types)
- [ ] `.env` + `.env.example` setup
- [ ] Basic server running on port 5000
- [ ] Supabase project created (DB, Auth, Storage configured)
- [ ] Supabase TypeScript types generated
- [ ] Test Supabase connection from Express

### Frontend
- [ ] Lovable code reviewed and cleaned up
- [ ] Tailwind CSS verified working
- [ ] Axios setup for API calls (base URL from `.env`)
- [ ] One dummy API call to backend — confirm connection works
- [ ] Framer Motion installed and tested

**✅ Deliverable:** Frontend talks to Backend talks to Supabase. Hello World — properly architected.

---

## 🔐 Milestone 1 — Authentication System
> **Goal:** Complete auth for all 3 roles

### Backend
- [ ] `users` table in PostgreSQL (id, name, email, password_hash, role, city, province, created_at)
- [ ] Buyer signup endpoint (`POST /api/auth/register/buyer`)
- [ ] Seller signup endpoint (`POST /api/auth/register/seller`) — status: pending approval
- [ ] Login endpoint (`POST /api/auth/login`) — returns JWT
- [ ] Logout endpoint (`POST /api/auth/logout`)
- [ ] JWT middleware (protect routes)
- [ ] Role-based middleware (isBuyer, isSeller, isAdmin, isApprovedSeller)
- [ ] Admin account manually seeded
- [ ] Profile fetch (`GET /api/auth/me`)
- [ ] Profile update (`PUT /api/auth/profile`)

### Frontend (Lovable Integration)
- [ ] Buyer signup page connected to API
- [ ] Seller signup page connected to API (extra: shop name, city)
- [ ] Login page connected to API
- [ ] JWT stored in localStorage / httpOnly cookie
- [ ] AuthContext wired up (user state, login, logout)
- [ ] Protected route component working
- [ ] Role-based redirect after login
- [ ] Logout functionality

**✅ Deliverable:** 3 different users can register and login. Role-based protection works.

---

## 🛍️ Milestone 2 — Product Management
> **Goal:** Sellers can list products. Everyone can browse them.

### Backend
- [ ] `products` table (id, seller_id, title, description, price, category_id, city, province, stock, is_handmade, avg_rating, created_at)
- [ ] `product_images` table (id, product_id, image_url, order)
- [ ] `categories` table + seed with 6 default categories
- [ ] Create product (`POST /api/products`) — Seller only (approved)
- [ ] Upload images to Supabase Storage
- [ ] Get all products (`GET /api/products`) — Public
- [ ] Get single product (`GET /api/products/:id`) — Public
- [ ] Update product (`PUT /api/products/:id`) — Seller own products only
- [ ] Delete product (`DELETE /api/products/:id`) — Seller own products only
- [ ] Get seller's own products (`GET /api/seller/products`)
- [ ] Admin: Get all products (`GET /api/admin/products`)
- [ ] Admin: Delete any product (`DELETE /api/admin/products/:id`)
- [ ] Admin: Category CRUD endpoints

### Frontend (Lovable Integration)
- [ ] Product listing page (grid cards: image, name, price, rating, city, handmade badge)
- [ ] Product detail page (image gallery, description, seller info, stock status)
- [ ] "More from this Seller" section on detail page
- [ ] Seller: Create product form (with image upload)
- [ ] Seller: Edit product form
- [ ] Seller: Product list table (edit/delete actions)
- [ ] Category browsing page
- [ ] Admin: Product moderation table

**✅ Deliverable:** Seller lists a product with images. Buyer sees it on listing + detail page.

---

## 🔍 Milestone 3 — Search & Discovery
> **Goal:** Buyers can actually find what they want

### Backend
- [ ] Full-text search (PostgreSQL `ILIKE` / `tsvector`)
- [ ] Filter: category, price range, city/province, rating
- [ ] Sort: newest, price asc/desc, top rated
- [ ] Featured products endpoint (`GET /api/products/featured`)
- [ ] Search endpoint (`GET /api/products/search?q=...&category=...&city=...`)

### Frontend (Lovable Integration)
- [ ] Search bar in navbar with live query params
- [ ] Search results page with filter chips
- [ ] Filter sidebar (price, category, city, rating)
- [ ] Sort dropdown
- [ ] Homepage sections:
  - Hero with animated background + cycling taglines
  - Featured Products row
  - Browse by Category section
  - Latest Arrivals row
- [ ] Empty state UI
- [ ] Loading skeleton cards

**✅ Deliverable:** Guest searches "Lahori Achaar" — gets relevant filtered results instantly.

---

## 🛒 Milestone 4 — Cart & Checkout
> **Goal:** Buyer can actually buy something

### Backend
- [ ] `cart_items` table (id, buyer_id, product_id, quantity)
- [ ] Add to cart (`POST /api/cart`)
- [ ] Update quantity (`PUT /api/cart/:id`)
- [ ] Remove item (`DELETE /api/cart/:id`)
- [ ] Get cart (`GET /api/cart`) — with product details joined
- [ ] `orders` table (id, buyer_id, total_amount, status, payment_method, address_snapshot, created_at)
- [ ] `order_items` table (id, order_id, product_id, seller_id, quantity, price_at_purchase)
- [ ] Place order (`POST /api/orders`) — COD or JazzCash
- [ ] Stock decrement on order placed
- [ ] Order confirmation response

### Frontend (Lovable Integration)
- [ ] Add to Cart button on cards + detail page
- [ ] Cart icon in navbar with item count badge
- [ ] Cart page (items, quantities, subtotal, total)
- [ ] Update/remove items in cart
- [ ] Checkout flow:
  - Step 1: Address form
  - Step 2: Payment method (COD / JazzCash)
  - Step 3: Order summary + confirm
- [ ] Order confirmation/success page

**✅ Deliverable:** Full purchase flow — Add to Cart → Checkout → Order Placed → Confirmation.

---

## 📦 Milestone 5 — Order Management
> **Goal:** Everyone can track and manage their orders

### Backend
- [ ] Buyer: Get own orders (`GET /api/buyer/orders`)
- [ ] Buyer: Get order detail (`GET /api/buyer/orders/:id`)
- [ ] Seller: Get incoming orders (`GET /api/seller/orders`)
- [ ] Seller: Update order status (`PUT /api/seller/orders/:id/status`)
- [ ] Status validation: Pending → Processing → Shipped → Delivered (forward only)
- [ ] Admin: All orders (`GET /api/admin/orders`)

### Frontend (Lovable Integration)
- [ ] Buyer: Order history page (status badges)
- [ ] Buyer: Order detail page (items, address, status timeline)
- [ ] Seller: Incoming orders table (status update dropdown)
- [ ] Status badge colors (Pending=yellow, Processing=blue, Shipped=orange, Delivered=green)
- [ ] Admin: Platform orders table (read-only, filterable)
- [ ] Auto-refresh status every 30s (polling)

**✅ Deliverable:** Full order lifecycle visible and manageable by all 3 roles.

---

## ⭐ Milestone 6 — Reviews & Ratings
> **Goal:** Build trust in the marketplace

### Backend
- [ ] `reviews` table (id, buyer_id, product_id, order_id, rating, comment, created_at)
- [ ] Submit review (`POST /api/reviews`) — buyer only, after delivered order
- [ ] Get product reviews (`GET /api/products/:id/reviews`)
- [ ] Recalculate `avg_rating` on new review
- [ ] Seller overall rating calculation
- [ ] Prevent duplicate review per order per product
- [ ] Admin: Delete review (`DELETE /api/admin/reviews/:id`)

### Frontend (Lovable Integration)
- [ ] Review form on order detail (appears after Delivered)
- [ ] Star rating interactive component
- [ ] Reviews section on product detail page
- [ ] Average rating + count on product cards
- [ ] Seller rating on product detail / seller profile
- [ ] Admin: Reviews moderation table

**✅ Deliverable:** Products have social proof. Marketplace feels real.

---

## 🏪 Milestone 7 — Dashboards (All Roles)
> **Goal:** Every role has a proper, functional home

### Backend
- [ ] Seller stats (`GET /api/seller/stats`) — products, orders, revenue
- [ ] Buyer stats (`GET /api/buyer/stats`) — orders, reviews
- [ ] Admin stats (`GET /api/admin/stats`) — platform-wide numbers
- [ ] Admin: User list + filters (`GET /api/admin/users`)
- [ ] Admin: Suspend/delete user
- [ ] Admin: Seller verification queue (`GET /api/admin/sellers/pending`)
- [ ] Admin: Approve/reject seller (`PUT /api/admin/sellers/:id/verify`)

### Frontend (Lovable Integration)
**Seller Dashboard:**
- [ ] Stats cards (products, orders, revenue)
- [ ] Quick product management table
- [ ] Recent orders widget
- [ ] Shop profile settings (name, bio, city, logo)

**Buyer Dashboard:**
- [ ] Recent orders list
- [ ] Saved addresses management
- [ ] My reviews list

**Admin Dashboard:**
- [ ] Platform stats cards
- [ ] User management table
- [ ] Seller verification queue
- [ ] Category management UI
- [ ] Review moderation table

**✅ Deliverable:** Every role has a fully functional, data-driven personal space.

---

## 💳 Milestone 8 — Payments (COD + JazzCash)
> **Goal:** Real payment options work for Pakistani users

### Backend
- [ ] COD flow already working from M4
- [ ] JazzCash API research + integration
- [ ] `payments` table (id, order_id, amount, method, status, created_at)
- [ ] Payment status update endpoint
- [ ] Basic refund logic (admin triggered)

### Frontend (Lovable Integration)
- [ ] JazzCash payment UI in checkout
- [ ] Payment success / failure pages
- [ ] Payment method clearly shown in order detail

**✅ Deliverable:** Buyer can pay with JazzCash — not just COD.

---

## 📧 Milestone 9 — Notifications & Polish
> **Goal:** Melio feels like a real product, not a student project

### Backend
- [ ] Nodemailer setup
- [ ] Order confirmation email to buyer
- [ ] Order status update email
- [ ] Promo code table + validation endpoint
- [ ] Apply promo code in checkout

### Frontend (Lovable Integration)
- [ ] Wishlist button on product cards
- [ ] Wishlist page in buyer dashboard
- [ ] Promo code input in checkout
- [ ] Loading skeletons everywhere
- [ ] Error states everywhere
- [ ] Empty states everywhere
- [ ] Toast notifications (success, error, info)
- [ ] Mobile responsiveness final pass
- [ ] 404 page
- [ ] Page titles & meta tags

**✅ Deliverable:** Melio is polished, complete, and presentable.

---

## 🚀 Milestone 10 — Deployment
> **Goal:** Melio is live on the internet

### Backend
- [ ] Railway setup + deploy
- [ ] Production env variables set
- [ ] Supabase production project (separate from dev)
- [ ] CORS configured for production frontend URL
- [ ] Health check endpoint (`GET /api/health`)

### Frontend
- [ ] Vercel setup + deploy
- [ ] Production API URL in env
- [ ] Build passing

### Both
- [ ] End-to-end testing on production
- [ ] README updated (live demo, screenshots, tech badges, setup instructions)
- [ ] LinkedIn posts 🎉

**✅ Deliverable:** Melio is live, shareable, on both resumes with a live link.

---

## 📌 Non-Negotiable Rules

1. Never push to `main` — feature branch → PR → merge
2. API contract first — define together, build in parallel
3. One milestone at a time — M(n) done before M(n+1) starts
4. Test every endpoint in Postman before frontend integration
5. Meaningful commit messages — `feat:` `fix:` `chore:`
6. `.env` never committed — `.env.example` always present
7. No `any` in TypeScript

---

*Project: Melio | Team: Rehan + Malaika | Version: 1.0*