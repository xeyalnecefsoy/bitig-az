import { NextRequest, NextResponse } from 'next/server'
import { toFacehashHandler } from 'facehash/next'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const facehash = toFacehashHandler()

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`avatar:ip:${ip}`, 200, 60_000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }
  return facehash.GET(request)
}
