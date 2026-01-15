import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  // Force redirect to profile page to ensure session hydration happens immediately
  // This solves the issue where redirecting to home page loses the URL hash before profile page can read it
  if (next === '/' || next.match(/^\/[a-z]{2}\/?$/)) {
    const localeMatch = next.match(/^\/([a-z]{2})/)
    const locale = localeMatch ? localeMatch[1] : 'az' // Default to 'az' if no locale found
    next = `/${locale}/profile`
  }

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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // Create hash for client-side hydration - this ensures immediate session availability
      const { access_token, refresh_token } = data.session
      const expires_at = Math.floor(Date.now() / 1000) + (data.session.expires_in || 3600)
      
      const hash = `access_token=${access_token}&refresh_token=${refresh_token}&expires_at=${expires_at}&expires_in=${data.session.expires_in}&token_type=bearer&type=recovery` // 'type=recovery' helps trigger some auto-detection logic safely
      // Note: We use type=recovery to force the client to process it, but standard hash might work too. 
      // Actually standard implicit flow is just access_token=...
      // Let's use the standard format Supabase expects.
      const standardHash = `access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${data.session.expires_in}&token_type=bearer&type=signup` 
      // Using type=signup or recovery forces event emission. Let's try standard first.
      
      // 3. Force redirect to Profile page to detect session immediately
      // Extract locale from 'next' param or default to 'az'
      const localeMatch = next.match(/^\/([a-z]{2})/)
      const locale = localeMatch ? localeMatch[1] : 'az'
      
      // CRITICAL: Always go to profile, never home page
      // We rely on origin from request to build absolute URL
      // If we are on localhost, origin is localhost:3000
      // If Vercel, it is the Vercel URL
      
      let baseUrl = origin
      if (!isLocalEnv && forwardedHost) {
        baseUrl = `https://${forwardedHost}`
      }
      
      const destination = `${baseUrl}/${locale}/profile#${standardHash}`

      // Return HTML that:
      // 1. Sets localStorage flag to signal fresh login
      // 2. Uses window.location.replace for clean navigation history
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Giriş edilir...</title>
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      margin: 0;
      background: #0a0a0a;
      color: #fff;
    }
    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(34, 197, 94, 0.3);
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Giriş edilir...</p>
  </div>
  <script>
    // Set flag to indicate fresh login - SocialProvider will detect this
    try {
      localStorage.setItem('bitig_auth_just_logged_in', Date.now().toString());
      sessionStorage.setItem('bitig_auth_session_ready', 'true');
    } catch(e) {}
    
    // Redirect with tokens in hash
    setTimeout(function() {
      window.location.replace("${destination}");
    }, 100);
  </script>
</body>
</html>`
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    } else {
      console.error('Auth callback error:', error?.message)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

