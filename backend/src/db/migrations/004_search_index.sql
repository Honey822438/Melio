-- Migration: 004_search_index
-- Run this in your Supabase SQL editor AFTER 002_create_products.sql

-- ─── Full-Text Search ─────────────────────────────────────────────────────────
-- Add a generated tsvector column combining title + description
-- This is stored and auto-updated, making text search fast

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED;

-- GIN index on the vector — required for fast @@ queries
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- Also index city and province for location-based filtering
CREATE INDEX IF NOT EXISTS idx_products_city     ON products (city);
CREATE INDEX IF NOT EXISTS idx_products_province ON products (province);
CREATE INDEX IF NOT EXISTS idx_products_price    ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_handmade ON products (is_handmade);
