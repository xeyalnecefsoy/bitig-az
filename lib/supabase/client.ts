import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('Supabase keys are missing. Please check .env.local')
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder'
    )
  }

  return createBrowserClient(url, key)
}
