import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    
    // Determine redirect URL
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    let redirectTo: string
    
    if (isLocalEnv) {
      redirectTo = `${origin}${next}`
    } else if (forwardedHost) {
      redirectTo = `https://${forwardedHost}${next}`
    } else {
      redirectTo = `${origin}${next}`
    }

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

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Instead of redirect, return HTML that redirects via JavaScript
      // This gives the browser time to properly process and store the cookies
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Redirecting...</title>
          </head>
          <body>
            <p>Logging you in...</p>
            <script>
              // Small delay to ensure cookies are properly stored
              setTimeout(function() {
                window.location.href = "${redirectTo}";
              }, 100);
            </script>
          </body>
        </html>
      `
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      })
    } else {
      console.error('Auth callback error:', error.message)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
