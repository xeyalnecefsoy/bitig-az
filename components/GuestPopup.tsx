'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { useLocale } from '@/context/locale'
import { FiLock } from 'react-icons/fi'

export function GuestPopup() {
  const [show, setShow] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const pathname = usePathname()
  const locale = useLocale()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsGuest(!session)
    }
    checkUser()
  }, [pathname])

  useEffect(() => {
    if (!isGuest) return
    
    // Don't show on login page
    if (pathname.includes('/login')) {
      setShow(false)
      return
    }

    const timer = setTimeout(() => {
      setShow(true)
    }, 15000) // 15 seconds

    return () => clearTimeout(timer)
  }, [isGuest, pathname])

  if (!show || !isGuest) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 border border-neutral-200 dark:border-neutral-800 relative">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-4">
            <FiLock size={24} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            {t(locale, 'guest_popup_title')}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {t(locale, 'guest_popup_sub')}
          </p>
          <Link href={`/${locale}/login` as any} className="btn btn-primary w-full py-3">
            {t(locale, 'sign_in')}
          </Link>
        </div>
      </div>
    </div>
  )
}
