# Melio — Main Context File
> Quick reference for anyone jumping into this project

---

## What is Melio?

Pakistani local products e-commerce marketplace. Amazon-style but focused exclusively on authentic, locally made Pakistani products. Think of it as a premium digital bazaar.

**Tagline:** "Melio — Your Local Market, Delivered"

---

## Team

- **Rehan + Malaika** — both full stack, working together
- **Lovable.dev** — frontend UI generated from mega prompt, then integrated with backend

---

## Tech Stack (Quick)

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | Express.js + TypeScript |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Payments | COD + JazzCash |
| Deploy | Vercel + Railway |

---

## 3 User Roles

| Role | What they can do |
|---|---|
| Guest | Browse, search, view products |
| Buyer | Cart, checkout, orders, reviews |
| Seller | List products, manage orders, seller dashboard |
| Admin | Everything — user management, verification, moderation |

---

## Key Rules (Never Break)

1. Frontend never touches Supabase directly — always through Express backend
2. No `any` in TypeScript — define proper interfaces
3. One milestone at a time — M1 must work before M2 starts
4. API contract defined first — then both build in parallel
5. Every API call has loading + success + error state on frontend
6. Never push to `main` — always feature branch → PR → merge
7. `.env` never committed — use `.env.example`

---

## Payment Flow

- **COD:** Always available, no integration needed
- **JazzCash:** Pakistani mobile wallet, Phase 1 digital payment
- **Stripe:** Card payments, Phase 2

---

## UI Rules

- Warm earthy palette: saffron, terracotta, cream, deep green
- Homepage has animated/parallax background (local bazaar feel)
- Product cards have hover animations (scale, shadow)
- Hero section has cycling rotating text/taglines
- Skeleton loaders everywhere — no blank screens
- Fully mobile responsive

---

## Milestone Overview

```
M0 → Setup
M1 → Auth
M2 → Products
M3 → Search
M4 → Cart & Checkout
M5 → Orders
M6 → Reviews
M7 → Dashboards
M8 → Payments
M9 → Polish
M10 → Deploy
```

---

## Workflow

```
Lovable.dev (UI) → GitHub /frontend → Backend integration → Polish → Deploy
```

---

*Project: Melio | Team: Rehan + Malaika | Stack: React TS + Express TS + Supabase*