export type LinkPreviewType = 'video' | 'article' | 'website'

export type LinkPreviewData = {
  url: string
  title: string
  description?: string
  imageUrl?: string
  siteName?: string
  creatorName?: string
  creatorUrl?: string
  publishedAt?: string
  type?: LinkPreviewType
}

const ALLOWLIST = [
  'youtube.com',
  'youtu.be',
  'x.com',
  'twitter.com',
  'wikipedia.org',
  'bitig.az',
  'www.bitig.az',
  // Sister platform: allow all danyeri.az pages and subdomains.
  'danyeri.az',
  'www.danyeri.az',
  'techturk.az',
] as const

const URL_REGEX =
  /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase()
  if (!host) return true
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
  if (host.endsWith('.local')) return true

  // IPv4 private ranges
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split('.').map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
  }
  return false
}

export function normalizeUrl(raw: string): string | null {
  let value = raw.trim()
  if (!value) return null
  if (value.toLowerCase().startsWith('javascript:') || value.toLowerCase().startsWith('data:')) {
    return null
  }
  if (value.startsWith('www.')) {
    value = `https://${value}`
  } else if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  try {
    const u = new URL(value)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (isPrivateOrLocalHost(u.hostname)) return null
    return u.href
  } catch {
    return null
  }
}

export function extractFirstUrl(content: string): string | null {
  const match = content.match(URL_REGEX)
  if (!match?.[0]) return null
  return normalizeUrl(match[0])
}

export function isAllowedPreviewUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return ALLOWLIST.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
  } catch {
    return false
  }
}

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getMetaTag(html: string, attrName: 'property' | 'name', attrValue: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*${attrName}=["']${attrValue}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i',
  )
  const reverseRegex = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attrName}=["']${attrValue}["'][^>]*>`,
    'i',
  )
  const match = html.match(regex) || html.match(reverseRegex)
  return match?.[1] ? decodeHtml(match[1]).trim() : null
}

function getMetaAny(html: string, entries: Array<{ attrName: 'property' | 'name'; attrValue: string }>): string | null {
  for (const entry of entries) {
    const value = getMetaTag(html, entry.attrName, entry.attrValue)
    if (value) return value
  }
  return null
}

function getTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!match?.[1]) return null
  return decodeHtml(stripTags(match[1]))
}

function truncate(text: string, max = 300): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}...`
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4500)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'user-agent': 'BitigLinkPreviewBot/1.0 (+https://bitig.az)' },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4500)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'user-agent': 'BitigLinkPreviewBot/1.0 (+https://bitig.az)' },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function resolveMaybeRelative(baseUrl: string, value?: string | null): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    return new URL(trimmed, baseUrl).href
  } catch {
    return undefined
  }
}

function getYoutubeId(url: URL): string | null {
  if (url.hostname.includes('youtu.be')) {
    return url.pathname.split('/').filter(Boolean)[0] || null
  }
  if (url.hostname.includes('youtube.com')) {
    if (url.pathname === '/watch') return url.searchParams.get('v')
    if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null
  }
  return null
}

export async function buildLinkPreview(url: string): Promise<LinkPreviewData | null> {
  const normalized = normalizeUrl(url)
  if (!normalized || !isAllowedPreviewUrl(normalized)) return null

  const parsed = new URL(normalized)

  if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
    const id = getYoutubeId(parsed)
    if (id) {
      const oembed = await fetchJson<{
        title?: string
        author_name?: string
        author_url?: string
        thumbnail_url?: string
      }>(`https://www.youtube.com/oembed?url=${encodeURIComponent(normalized)}&format=json`)

      let description: string | undefined
      try {
        const html = await fetchText(normalized)
        description = getMetaAny(html, [
          { attrName: 'property', attrValue: 'og:description' },
          { attrName: 'name', attrValue: 'description' },
          { attrName: 'name', attrValue: 'twitter:description' },
        ]) || undefined
      } catch {
        description = undefined
      }

      return {
        url: normalized,
        title: truncate(oembed?.title || 'YouTube video', 120),
        description: description ? truncate(description, 220) : undefined,
        imageUrl: resolveMaybeRelative(normalized, oembed?.thumbnail_url) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        siteName: 'YouTube',
        creatorName: oembed?.author_name ? truncate(oembed.author_name, 80) : undefined,
        creatorUrl: oembed?.author_url,
        type: 'video',
      }
    }
  }

  const html = await fetchText(normalized)
  const ogTitle = getMetaAny(html, [
    { attrName: 'property', attrValue: 'og:title' },
    { attrName: 'name', attrValue: 'twitter:title' },
  ])
  const ogDescription = getMetaAny(html, [
    { attrName: 'property', attrValue: 'og:description' },
    { attrName: 'name', attrValue: 'twitter:description' },
    { attrName: 'name', attrValue: 'description' },
  ])
  const ogImage = getMetaAny(html, [
    { attrName: 'property', attrValue: 'og:image' },
    { attrName: 'name', attrValue: 'twitter:image' },
  ])
  const ogSite = getMetaAny(html, [
    { attrName: 'property', attrValue: 'og:site_name' },
    { attrName: 'name', attrValue: 'application-name' },
  ])
  const ogType = getMetaTag(html, 'property', 'og:type')
  const creatorName = getMetaAny(html, [
    { attrName: 'name', attrValue: 'author' },
    { attrName: 'property', attrValue: 'article:author' },
  ])
  const creatorUrl = getMetaTag(html, 'property', 'article:author')
  const publishedAt = getMetaAny(html, [
    { attrName: 'property', attrValue: 'article:published_time' },
    { attrName: 'name', attrValue: 'publish-date' },
    { attrName: 'name', attrValue: 'date' },
  ])
  const title = ogTitle || getTitle(html)

  if (!title) return null

  const previewType: LinkPreviewType =
    ogType === 'video.other' || ogType === 'video' ? 'video' : ogType === 'article' ? 'article' : 'website'

  return {
    url: normalized,
    title: truncate(title, 120),
    description: ogDescription ? truncate(ogDescription, 220) : undefined,
    imageUrl: resolveMaybeRelative(normalized, ogImage),
    siteName: ogSite || parsed.hostname.replace(/^www\./, ''),
    creatorName: creatorName ? truncate(creatorName, 80) : undefined,
    creatorUrl: resolveMaybeRelative(normalized, creatorUrl),
    publishedAt: publishedAt ? truncate(publishedAt, 80) : undefined,
    type: previewType,
  }
}
