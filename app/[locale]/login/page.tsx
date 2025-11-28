"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { t, type Locale } from '@/lib/i18n'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const supabase = createClient()

  const pathname = usePathname()
  const locale = (pathname.split('/')[1] || 'en') as Locale

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback?next=/${locale}`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        if (parseInt(age) < 13) {
          setError(t(locale, 'login_age_error'))
          setLoading(false)
          return
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: email.split('@')[0],
              full_name: fullName,
              age: parseInt(age),
            }
          }
        })
        if (error) throw error
        
        // Create profile manually if trigger doesn't handle it or to ensure extra fields
        // Note: If you have a trigger on auth.users, it might create the profile. 
        // But we need to update it with full_name and age if the trigger only does basic info.
        // Assuming the trigger handles basic creation, we might need to update.
        // Or if we are doing manual insertion:
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
             await supabase.from('profiles').upsert({
                 id: user.id,
                 username: email.split('@')[0],
                 full_name: fullName,
                 age: parseInt(age),
                 avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
                 updated_at: new Date().toISOString()
             })
        }
        
        alert(t(locale, 'login_check_email'))
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push(`/${locale}` as any)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {mode === 'login' ? t(locale, 'login_title') : t(locale, 'signup_title')}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {mode === 'login' ? t(locale, 'login_no_account') : t(locale, 'login_have_account')}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="font-medium text-brand hover:text-brand/80"
            >
              {mode === 'login' ? t(locale, 'login_signup_link') : t(locale, 'login_signin_link')}
            </button>
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <FcGoogle className="h-5 w-5" />
            {t(locale, 'login_google')}
          </button>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
              <span className="bg-white px-6 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-400">{t(locale, 'login_or_email')}</span>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleAuth}>
            <div className="-space-y-px rounded-md shadow-sm">
              {mode === 'signup' && (
                <>
                  <div>
                    <input
                      type="text"
                      required
                      className="relative block w-full rounded-t-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand sm:text-sm sm:leading-6 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700 dark:placeholder:text-neutral-500"
                      placeholder={t(locale, 'login_full_name')}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      required
                      min="1"
                      max="150"
                      className="relative block w-full border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand sm:text-sm sm:leading-6 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700 dark:placeholder:text-neutral-500"
                      placeholder={t(locale, 'login_age')}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div>
                <input
                  type="email"
                  required
                  className={`relative block w-full border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand sm:text-sm sm:leading-6 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700 dark:placeholder:text-neutral-500 ${mode === 'signup' ? '' : 'rounded-t-md'}`}
                  placeholder={t(locale, 'login_email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="relative block w-full rounded-b-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand sm:text-sm sm:leading-6 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700 dark:placeholder:text-neutral-500"
                  placeholder={t(locale, 'login_password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
              >
                {loading ? t(locale, 'login_loading') : mode === 'login' ? t(locale, 'login_signin_button') : t(locale, 'login_signup_button')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
