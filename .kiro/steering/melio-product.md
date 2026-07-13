# Melio — Product Steering File
# Location: .kiro/steering/product.md

## What is Melio?

Melio is a Pakistani local products marketplace that connects local artisans and small vendors with buyers across Pakistan. It is NOT a general marketplace like Daraz. It is focused exclusively on authentic, locally made Pakistani products — with a premium, culturally rich UI that feels like a digital local bazaar.

## Tagline
> "Melio — Your Local Market, Delivered"

## Target Users

- **Buyers** — People across Pakistan looking for authentic local/handmade products
- **Sellers** — Local artisans, small vendors, home-based businesses from cities like Lahore, Multan, Karachi, Swat, Chiniot
- **Admin** — Platform operator managing moderation, seller verification, and platform health

## Product Categories (Dynamic)

These are the default 6 categories. Admin can add or remove from dashboard at any time:

- Clothing & Fabric (Shalwar Kameez, Dupattas, Lawn)
- Handicrafts (Pottery, Woodwork, Chiniot Furniture)
- Food & Spices (Desi Ghee, Achaar, Dry Fruits)
- Jewelry (Handmade, Tribal, Kundan)
- Home Decor (Rugs, Cushions, Lamps)
- Beauty & Wellness (Multani Mitti, Herbal Products)

## Pakistani Context Rules

- Currency is always PKR (Pakistani Rupee)
- Seller city and province must always be visible on products
- Products can have a "Handmade" or "Local Artisan" badge
- Cash on Delivery is Phase 1 (always available — dominant in Pakistan)
- JazzCash is Phase 1 digital payment (Pakistani mobile wallet)
- UI language is English, but Urdu text in product descriptions must be supported
- Seller verification by Admin before they can list products

## UI/UX Identity

Melio must LOOK and FEEL premium. Not a student project. Not a plain CRUD app:

- Homepage has slightly animated/parallax background — local bazaar feel
- Product cards have smooth hover animations (scale up, shadow lift)
- Hero section has cycling/rotating taglines or descriptions
- Warm earthy color palette: saffron, terracotta, cream, deep green
- Skeleton loaders everywhere — no blank screens
- Empty states designed — no empty pages
- Toast notifications for all actions
- Mobile first — fully responsive

## What Melio Is NOT

- Not a general marketplace (no electronics, no foreign brands)
- Not a Daraz clone
- Not a microservices system
- Not a real-time chat application
- Not a Stripe project (JazzCash is the digital payment)