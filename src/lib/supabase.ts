import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase is optional while the site runs without a backend.
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable the
 * contact form and remote project data. See README "Part two: Supabase".
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export const hasSupabase = Boolean(supabase)
