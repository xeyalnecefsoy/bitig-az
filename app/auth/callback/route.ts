import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/az/profile'

  // Redirect URL müəyyənləşdir (production vs development)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  
  let baseUrl: string
  if (isLocalEnv) {
    baseUrl = origin
  } else if (forwardedHost) {
    baseUrl = `https://${forwardedHost}`
  } else {
    baseUrl = origin
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Code-u session ilə dəyişdir
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      console.log('[Auth Callback] Session created successfully for:', data.user?.email)
      
      // Sadə redirect - cookies artıq set olunub
      return NextResponse.redirect(`${baseUrl}${next}`)
    } else {
      console.error('[Auth Callback] Error:', error?.message)
      return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
    }
  }

  // Code yoxdursa, error səhifəsinə yönləndir
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
