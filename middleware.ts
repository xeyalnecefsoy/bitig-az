import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, isLocale } from './lib/i18n'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Ignore static assets and API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle /auth routes: update session but DON'T redirect to locale
  if (pathname.startsWith('/auth')) {
    return await updateSession(request)
  }

  const segments = pathname.split('/').filter(Boolean)
  const maybeLocale = segments[0]

  // Redirect to default locale if no valid locale in path
  if (!maybeLocale || !isLocale(maybeLocale)) {
    // Check if it's potentially a username (root level path that isn't a locale)
    // Exclude reserved routes
    const reservedRoutes = ['auth', 'api', '_next', 'static', 'favicon.ico']
    if (maybeLocale && !reservedRoutes.includes(maybeLocale)) {
      const url = request.nextUrl.clone()
      url.pathname = `/${defaultLocale}/social/profile/${maybeLocale}`
      return NextResponse.rewrite(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname}`
    return NextResponse.redirect(url)
  }

  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|api).*)'],
}
