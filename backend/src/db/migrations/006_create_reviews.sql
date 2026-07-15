-- Migration: 006_create_reviews
-- Run this in your Supabase SQL editor AFTER 005_create_cart_orders.sql

-- ─── Reviews ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One review per buyer per product (not per order — prevents abuse)
  UNIQUE (buyer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer   ON reviews (buyer_id);

-- ─── Trigger: Auto-recalculate avg_rating on products ─────────────────────────
-- Fires after every INSERT, UPDATE, or DELETE on reviews

CREATE OR REPLACE FUNCTION update_product_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  -- Determine which product was affected
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  UPDATE products
  SET avg_rating = (
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0.00)
    FROM reviews
    WHERE product_id = target_product_id
  )
  WHERE id = target_product_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to allow re-running migration safely
DROP TRIGGER IF EXISTS trigger_update_avg_rating ON reviews;

CREATE TRIGGER trigger_update_avg_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_avg_rating();
