# Melio — Tech Stack Steering File
# Location: .kiro/steering/tech.md

## Stack Overview

Melio is a full-stack TypeScript application end-to-end.

### Frontend
- **Framework:** React.js + TypeScript (initialized with Vite — `react-ts` template)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion (page transitions, hover effects, hero animations)
- **HTTP Client:** Axios
- **State Management:** React Context API (Zustand if complexity demands)
- **Routing:** React Router v6
- **Form Handling:** React Hook Form
- **Notifications:** React Hot Toast

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js + TypeScript
- **Authentication:** JWT (jsonwebtoken) + bcryptjs
- **Middleware:** Custom JWT middleware for route protection
- **File Uploads:** Multer (before Supabase Storage upload)
- **Email:** Nodemailer (Phase 2)
- **TypeScript config:** ts-node + tsconfig.json

### Database & Services
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (user management layer)
- **Storage:** Supabase Storage (product images)
- **Client:** `@supabase/supabase-js` — backend only
- **Types:** Auto-generated via `supabase gen types typescript`

### Payments
- **Phase 1:** Cash on Delivery (no integration needed)
- **Phase 1:** JazzCash (Pakistani mobile payment)
- **Phase 2:** Stripe (card payments)
- **Phase 2:** Additional methods TBD

### Deployment
- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** Supabase (production project separate from dev)

---

## TypeScript Setup

### Frontend Init
```bash
npm create vite@latest melio-frontend -- --template react-ts
```

### Backend Dependencies
```bash
npm install express cors dotenv bcryptjs jsonwebtoken multer @supabase/supabase-js
npm install -D typescript ts-node @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/multer
```

### Supabase Type Generation
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

---

## Folder Structure

### Backend (`/backend`)
```
/backend
  /src
    /controllers        # Route handler logic
    /middleware         # JWT auth, role checks, error handler
    /routes             # Express route definitions
    /services           # Supabase queries, business logic
    /types              # Custom TS interfaces + DB types
    /utils              # Helper functions
  server.ts             # Entry point
  tsconfig.json
  .env
  .env.example
```

### Frontend (`/frontend`)
```
/frontend
  /src
    /pages              # Full page components
    /components         # Reusable UI components
    /context            # AuthContext, CartContext
    /hooks              # Custom hooks
    /services           # Axios API call functions (typed)
    /types              # Shared TypeScript interfaces
    /utils              # Helper functions
    /animations         # Framer Motion variants
  index.html
  tsconfig.json
  .env
  .env.example
```

---

## Critical Architecture Rules

1. **Frontend NEVER calls Supabase directly.** All DB interactions through Express backend only.
2. **Single source of truth = Express backend.** Frontend only talks to Express REST API.
3. **All routes are RESTful.** GET, POST, PUT, DELETE.
4. **JWT tokens** in Authorization header: `Bearer <token>`
5. **Environment variables** never hardcoded. Always `process.env.VARIABLE_NAME`
6. **`.env` never committed to GitHub.** Use `.env.example` with placeholders.
7. **TypeScript strict mode on.** No `any` types — define proper interfaces.

---

## TypeScript Patterns

### Custom Types (`/src/types/index.ts` — backend)
```ts
export interface Product {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category: string
  city: string
  province: string
  stock: number
  is_handmade: boolean
  avg_rating: number
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  city: string
  created_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}
```

### Typed Supabase Client
```ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './types/database.types'

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```

### Typed Controller Example
```ts
import { Request, Response } from 'express'
import { ApiResponse, Product } from '../types'

export const getProducts = async (
  req: Request,
  res: Response<ApiResponse<Product[]>>
): Promise<void> => {
  try {
    const { data, error } = await supabase.from('products').select('*')
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
```

---

## Coding Standards

- `async/await` only — no raw `.then().catch()` chains
- All controllers wrapped in `try/catch`
- HTTP status codes must be accurate: 200, 201, 400, 401, 403, 404, 500
- Error format: `{ success: false, message: "Descriptive error" }`
- Success format: `{ success: true, data: { ... } }`
- `const` by default, `let` only when reassignment needed
- No `var` anywhere
- No `any` type — always define proper interfaces
- Function names: `camelCase`
- Component names: `PascalCase`
- DB table names: `snake_case`
- API endpoints: `kebab-case` (`/api/product-images`)