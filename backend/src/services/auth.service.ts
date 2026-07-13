import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../config/supabase'
import { User, JwtPayload } from '../types'

const SALT_ROUNDS = 12

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  })
}

// Strip password_hash before returning user data to controllers
const sanitizeUser = (user: User & { password_hash?: string }): User => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = user as User & { password_hash: string }
  return safe
}

// ─── Register Buyer ──────────────────────────────────────────────────────────

export interface RegisterBuyerInput {
  name: string
  email: string
  password: string
  city: string
  province: string
}

export const registerBuyer = async (
  input: RegisterBuyerInput
): Promise<{ user: User; token: string }> => {
  const { name, email, password, city, province } = input

  // Check existing email
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) throw new Error('Email already registered')

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ name, email, password_hash, role: 'buyer', city, province, is_verified: false })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create user')

  const token = signToken({
    userId: data.id,
    email: data.email,
    role: 'buyer',
    is_verified: false,
  })

  return { user: sanitizeUser(data), token }
}

// ─── Register Seller ─────────────────────────────────────────────────────────

export interface RegisterSellerInput {
  name: string
  email: string
  password: string
  city: string
  province: string
  shop_name: string
  shop_bio?: string
}

export const registerSeller = async (
  input: RegisterSellerInput
): Promise<{ user: User; token: string }> => {
  const { name, email, password, city, province, shop_name, shop_bio } = input

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) throw new Error('Email already registered')

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      name,
      email,
      password_hash,
      role: 'seller',
      city,
      province,
      shop_name,
      shop_bio: shop_bio ?? null,
      is_verified: false, // Pending admin approval
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create seller account')

  // Sellers get a token immediately but is_verified=false blocks protected seller routes
  const token = signToken({
    userId: data.id,
    email: data.email,
    role: 'seller',
    is_verified: false,
  })

  return { user: sanitizeUser(data), token }
}

// ─── Login ───────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string
  password: string
}

export const loginUser = async (
  input: LoginInput
): Promise<{ user: User; token: string }> => {
  const { email, password } = input

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) throw new Error('Invalid email or password')

  const isMatch = await bcrypt.compare(password, data.password_hash)
  if (!isMatch) throw new Error('Invalid email or password')

  const token = signToken({
    userId: data.id,
    email: data.email,
    role: data.role,
    is_verified: data.is_verified,
  })

  return { user: sanitizeUser(data), token }
}

// ─── Get User By ID ──────────────────────────────────────────────────────────

export const getUserById = async (id: string): Promise<User> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, city, province, shop_name, shop_bio, logo_url, is_verified, created_at')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('User not found')

  return data
}

// ─── Update Profile ──────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  name?: string
  city?: string
  province?: string
  shop_name?: string
  shop_bio?: string
  logo_url?: string
}

export const updateUserProfile = async (
  id: string,
  input: UpdateProfileInput
): Promise<User> => {
  // Filter out undefined values to avoid overwriting fields with null
  const updates = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  )

  if (Object.keys(updates).length === 0) throw new Error('No fields to update')

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, name, email, role, city, province, shop_name, shop_bio, logo_url, is_verified, created_at')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to update profile')

  return data
}
