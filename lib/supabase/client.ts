import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton Supabase client - prevents multiple instances
let supabaseClient: SupabaseClient | null = null

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('Supabase keys are missing. Please check .env.local')
    supabaseClient = createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder'
    )
    return supabaseClient
  }

  // Create singleton client with auth persistence
  supabaseClient = createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })

  return supabaseClient
}

// Helper to get current session immediately
export async function getSession() {
  const client = createClient()
  const { data: { session } } = await client.auth.getSession()
  return session
}
