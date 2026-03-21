import * as QueryParams from 'expo-auth-session/build/QueryParams'
import { supabase } from '@/lib/supabase'

/**
 * Parses OAuth callback URL (hash or query), sets Supabase session, returns access token or null.
 */
export async function createSessionFromUrl(url: string): Promise<string | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url)
  const errMsg = errorCode ?? params.error ?? params.error_description
  if (errMsg) throw new Error(typeof errMsg === 'string' ? errMsg : 'Auth error')
  const access_token = params.access_token
  const refresh_token = params.refresh_token
  if (!access_token) return null
  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token: refresh_token ?? undefined,
  })
  if (error) throw error
  return access_token
}
