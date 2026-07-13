-- Migration: 001_create_users
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')) DEFAULT 'buyer',
  city          TEXT NOT NULL DEFAULT '',
  province      TEXT NOT NULL DEFAULT '',

  -- Seller-only fields (NULL for buyers/admins)
  shop_name     TEXT,
  shop_bio      TEXT,
  logo_url      TEXT,

  -- Admin approval gate for sellers
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index for admin: filter sellers by verification status
CREATE INDEX IF NOT EXISTS idx_users_role_verified ON users (role, is_verified);
