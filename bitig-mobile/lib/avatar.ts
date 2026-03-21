const BITIG_BASE_URL = 'https://bitig.az'

function normalizeBaseUrl(url: string) {
  // Ensure no trailing slash issues
  return url.endsWith('/') ? url.slice(0, -1) : url
}

export function resolveAvatarUrl(
  avatarUrl: string | null | undefined,
  nameOrId?: string | null,
) {
  const base = normalizeBaseUrl(BITIG_BASE_URL)
  const fallbackName = nameOrId ?? 'unknown'

  if (!avatarUrl) {
    return `${base}/api/avatar?name=${encodeURIComponent(fallbackName)}`
  }

  const trimmed = avatarUrl.trim()
  if (!trimmed) {
    return `${base}/api/avatar?name=${encodeURIComponent(fallbackName)}`
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('data:')) return trimmed

  // Often stored as a relative path like "/api/avatar?name=..."
  if (trimmed.startsWith('/')) return `${base}${trimmed}`

  // Catch-all: treat as relative path
  return `${base}/${trimmed}`
}

