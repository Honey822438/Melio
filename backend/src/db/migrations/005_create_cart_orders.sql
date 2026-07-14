-- Migration: 005_create_cart_orders
-- Run this in your Supabase SQL editor AFTER 002_create_products.sql

-- ─── Cart Items ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One entry per buyer-product pair
  UNIQUE (buyer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_buyer ON cart_items (buyer_id);

-- ─── Orders ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total_amount     NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  status           TEXT NOT NULL
                     CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
                     DEFAULT 'pending',
  payment_method   TEXT NOT NULL
                     CHECK (payment_method IN ('cod', 'jazzcash', 'stripe')),
  payment_status   TEXT NOT NULL
                     CHECK (payment_status IN ('unpaid', 'paid', 'refunded'))
                     DEFAULT 'unpaid',
  -- Snapshot of delivery address at time of order
  address_snapshot JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer    ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders (created_at DESC);

-- ─── Order Items ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC(12, 2) NOT NULL CHECK (price_at_purchase > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items (seller_id);
