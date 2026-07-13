import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env vars here so this module works regardless of import order
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
}

// Standard client — uses anon key (respects RLS)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — uses service_role key (bypasses RLS)
// Use only in backend services and seed scripts, NEVER expose to frontend
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey ?? supabaseAnonKey // fallback to anon if service key not set
)
