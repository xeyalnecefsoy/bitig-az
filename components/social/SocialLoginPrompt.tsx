"use client"

import Link from 'next/link'
import { FiLock, FiLogIn } from 'react-icons/fi'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'

export function SocialLoginPrompt() {
  const locale = useLocale()

  return (
    <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand/20 bg-brand/5 dark:bg-brand/10">
      <div className="flex items-center gap-4 text-center sm:text-left">
        <div className="h-12 w-12 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
          <FiLock className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
            {t(locale, 'social_login_title')}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t(locale, 'social_login_desc')}
          </p>
        </div>
      </div>
      <Link 
        href={`/${locale}/login` as any}
        className="btn btn-primary ml-auto shrink-0 w-full sm:w-auto"
      >
        <FiLogIn className="mr-2" /> {t(locale, 'sign_in')}
      </Link>
    </div>
  )
}
