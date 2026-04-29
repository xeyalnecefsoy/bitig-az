import { NextRequest, NextResponse } from 'next/server'
import { buildLinkPreview, isAllowedPreviewUrl, normalizeUrl } from '@/lib/linkPreview'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { logApi } from '@/lib/logger'

export const dynamic = 'force-dynamic'

type CacheEntry = { expiresAt: number; data: unknown }
const cache = new Map<string, CacheEntry>()
const TTL_MS = 5 * 60_000
const CACHE_VERSION = 'v2'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (!checkRateLimit(`link-preview:ip:${ip}`, 90, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }

    const raw = request.nextUrl.searchParams.get('url') || ''
    const url = normalizeUrl(raw)
    if (!url) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    if (!isAllowedPreviewUrl(url)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 400 })
    }

    const cacheKey = `${CACHE_VERSION}:${url}`
    const now = Date.now()
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(
        { preview: cached.data, cached: true },
        { headers: { 'Cache-Control': 'private, max-age=300' } },
      )
    }

    const preview = await buildLinkPreview(url)
    if (!preview) {
      return NextResponse.json({ error: 'No preview available' }, { status: 404 })
    }

    cache.set(cacheKey, { data: preview, expiresAt: now + TTL_MS })
    if (cache.size > 500) {
      // Tiny cap to avoid unbounded growth in long-lived instances.
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }

    return NextResponse.json(
      { preview, cached: false },
      { headers: { 'Cache-Control': 'private, max-age=120' } },
    )
  } catch (error) {
    logApi('error', 'link_preview_failed', { err: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
