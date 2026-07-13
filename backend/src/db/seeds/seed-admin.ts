/**
 * Seed script — creates the admin account.
 * Run once: npx ts-node src/db/seeds/seed-admin.ts
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env
 * Falls back to defaults if not set (change before production).
 */

import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../config/supabase'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@melio.pk'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@Melio2025!'
const ADMIN_NAME = 'Melio Admin'

const seedAdmin = async (): Promise<void> => {
  console.log('🌱 Seeding admin account...')

  // Check if admin already exists
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', ADMIN_EMAIL)
    .single()

  if (existing) {
    console.log(`✅ Admin already exists: ${existing.email}`)
    process.exit(0)
  }

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password_hash,
      role: 'admin',
      city: 'Lahore',
      province: 'Punjab',
      is_verified: true,
    })
    .select('id, email, role')
    .single()

  if (error || !data) {
    console.error('❌ Failed to seed admin:', error?.message)
    process.exit(1)
  }

  console.log('✅ Admin account created successfully:')
  console.log(`   Email: ${data.email}`)
  console.log(`   Role:  ${data.role}`)
  console.log(`   ID:    ${data.id}`)
  console.log('\n⚠️  Change the default password before deploying to production!')
}

seedAdmin()
