'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AudiobooksError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const locale = pathname.split('/').filter(Boolean)[0] || 'az'

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Audiobooks error boundary]', error)
    }
  }, [error])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Audiobooks bölməsində xəta oldu</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Digər bölmələr istifadəyə açıqdır. Buranı yenidən cəhd edin və ya ana səhifəyə qayıdın.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-[#4AD860] px-5 py-2.5 text-sm font-semibold text-[#06140A] transition hover:opacity-90"
        >
          Yenidən cəhd et
        </button>
        <Link
          href={`/${locale}`}
          className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          Ana səhifə
        </Link>
      </div>
    </div>
  )
}
