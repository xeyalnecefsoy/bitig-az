import type { NextRequest } from 'next/server'

/**
 * Fixed-window in-memory rate limiter for Route Handlers.
 * Note: on serverless, each instance has its own map — use Upstash/Vercel KV for strict global limits.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

const MAX_BUCKETS = 10_000

function pruneIfNeeded() {
  if (buckets.size <= MAX_BUCKETS) return
  const now = Date.now()
  for (const [k, b] of buckets) {
    if (now > b.resetAt) buckets.delete(k)
  }
}

/**
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  pruneIfNeeded()
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (existing.count >= max) return false
  existing.count += 1
  return true
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}
