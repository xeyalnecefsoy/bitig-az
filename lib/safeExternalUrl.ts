/**
 * Only allow http(s) URLs for user-controlled link hrefs (XSS: javascript:, data:, etc.).
 */
export function getSafeExternalHref(raw: string): string | null {
  let s = raw.trim()
  if (!s) return null
  if (s.toLowerCase().startsWith('javascript:') || s.toLowerCase().startsWith('data:')) {
    return null
  }
  if (s.startsWith('www.')) {
    s = `https://${s}`
  } else if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`
  }
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}
