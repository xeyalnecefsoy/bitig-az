import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // If keys are missing, just pass through
    return supabaseResponse
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Invalid/expired refresh token — clear auth cookies and continue as guest
    const authCookies = request.cookies.getAll().filter(c =>
      c.name.startsWith('sb-') && c.name.includes('-auth-token')
    )
    authCookies.forEach(c => supabaseResponse.cookies.delete(c.name))
  }

  // 🔒 Server-side admin route protection
  const pathname = request.nextUrl.pathname
  const isAdminRoute = /^\/[a-z]{2}\/admin/.test(pathname)

  if (isAdminRoute) {
    if (!user) {
      // Not logged in → redirect to login
      const locale = pathname.split('/')[1] || 'az'
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = `/${locale}/login`
      return NextResponse.redirect(loginUrl)
    }

    // Check role from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'coadmin'].includes(profile.role)) {
      // Not admin → redirect to homepage
      const locale = pathname.split('/')[1] || 'az'
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = `/${locale}`
      return NextResponse.redirect(homeUrl)
    }
  }

  return supabaseResponse
}
