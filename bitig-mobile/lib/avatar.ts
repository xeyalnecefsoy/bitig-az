/** Use www host: apex bitig.az 307-redirects to www; RN image loaders often fail on that hop. */
const BITIG_BASE_URL = 'https://www.bitig.az'

const SUPABASE_PUBLIC_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')

function normalizeBaseUrl(url: string) {
  // Ensure no trailing slash issues
  return url.endsWith('/') ? url.slice(0, -1) : url
}

/** Apex host 307 → www; rewrite so Image never hits the redirect. */
function rewriteApexBitigAbsolute(url: string) {
  if (url.startsWith('https://bitig.az/') || url === 'https://bitig.az') {
    return url.replace(/^https:\/\/bitig\.az/, 'https://www.bitig.az')
  }
  if (url.startsWith('http://bitig.az/') || url === 'http://bitig.az') {
    return url.replace(/^http:\/\/bitig\.az/, 'https://www.bitig.az')
  }
  return url
}

/** DB / metadata sometimes store the literal "null" or empty strings. */
function isUsableAvatarRef(ref: string | null | undefined): ref is string {
  if (ref == null) return false
  const t = ref.trim()
  if (!t) return false
  const lower = t.toLowerCase()
  if (lower === 'null' || lower === 'undefined') return false
  return true
}

/**
 * Storage object path like `userId/avatar.jpg` (no scheme) → public object URL.
 * Avoids wrongly prefixing with bitig.az when only the path was stored.
 */
function trySupabasePublicObjectUrl(trimmed: string): string | null {
  if (!SUPABASE_PUBLIC_URL) return null
  if (trimmed.includes('://') || trimmed.startsWith('/')) return null
  // Typical upload path: `<uuid>/<uuid>.<ext>` under bucket `avatars`
  if (!/^[0-9a-f-]{36}\/.+/i.test(trimmed)) return null
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/avatars/${trimmed}`
}

export function resolveAvatarUrl(
  avatarUrl: string | null | undefined,
  nameOrId?: string | null,
) {
  const base = normalizeBaseUrl(BITIG_BASE_URL)
  const fallbackName = nameOrId ?? 'unknown'

  if (!isUsableAvatarRef(avatarUrl)) {
    return `${base}/api/avatar?name=${encodeURIComponent(fallbackName)}`
  }

  let trimmed = avatarUrl.trim()

  // Protocol-relative (//host/path): browsers resolve; RN does not — must normalize before "/" handling.
  if (trimmed.startsWith('//')) {
    trimmed = `https:${trimmed}`
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return rewriteApexBitigAbsolute(trimmed)
  }
  if (trimmed.startsWith('data:')) return trimmed

  const supabaseGuess = trySupabasePublicObjectUrl(trimmed)
  if (supabaseGuess) return supabaseGuess

  // Root-relative on our site: "/api/avatar?..." (single leading slash only)
  if (trimmed.startsWith('/')) return `${base}${trimmed}`

  // Catch-all: treat as relative path on bitig.az (legacy)
  return `${base}/${trimmed}`
}

/** Browser-like headers so CDNs (Google usercontent, etc.) don't 403 React Native's default client. */
const RN_AVATAR_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

/**
 * Use with `Image` `source` — RN/Expo often omit headers; some hosts block or return HTML without these.
 * Mirrors web `<img referrerPolicy="no-referrer">` for Google-hosted avatars by avoiding a strict app Referer.
 */
export function getAvatarImageSource(resolvedUri: string): {
  uri: string
  headers: Record<string, string>
} {
  const lower = resolvedUri.toLowerCase()
  const headers: Record<string, string> = {
    Accept: 'image/avif,image/webp,image/apng,image/png,image/jpeg,image/*,*/*;q=0.8',
    'User-Agent': RN_AVATAR_USER_AGENT,
  }

  if (lower.includes('googleusercontent.com') || lower.includes('ggpht.com')) {
    // Web uses referrerPolicy="no-referrer"; send a neutral Referer so the CDN serves the image.
    headers.Referer = 'https://www.google.com/'
  }

  let supabaseHost = ''
  if (SUPABASE_PUBLIC_URL) {
    try {
      supabaseHost = new URL(SUPABASE_PUBLIC_URL).hostname
    } catch {
      supabaseHost = ''
    }
  }
  if (supabaseHost && lower.includes(supabaseHost)) {
    const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    if (anon) {
      headers.apikey = anon
      headers.Authorization = `Bearer ${anon}`
    }
  }

  return { uri: resolvedUri, headers }
}

