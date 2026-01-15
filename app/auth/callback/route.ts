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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
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
    
    // Small delay to ensure cookies are processed, then redirect
    setTimeout(function() {
      window.location.replace("${redirectTo}");
    }, 200);
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

