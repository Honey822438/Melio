-- Migration: 002_create_products
-- Run this in your Supabase SQL editor AFTER 001_create_users.sql

-- ─── Categories ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  price       NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  city        TEXT NOT NULL,
  province    TEXT NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_handmade BOOLEAN NOT NULL DEFAULT FALSE,
  avg_rating  NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_seller    ON products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_created   ON products (created_at DESC);

-- ─── Product Images ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  "order"    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id);

-- ─── Seed: 6 Default Categories ──────────────────────────────────────────────

INSERT INTO categories (name, slug) VALUES
  ('Clothing & Fabric',  'clothing-fabric'),
  ('Handicrafts',        'handicrafts'),
  ('Food & Spices',      'food-spices'),
  ('Jewelry',            'jewelry'),
  ('Home Decor',         'home-decor'),
  ('Beauty & Wellness',  'beauty-wellness')
ON CONFLICT (slug) DO NOTHING;
