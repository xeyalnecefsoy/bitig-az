'use client'

import { useEffect } from 'react'
import './globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global error]', error)
  }, [error])

  return (
    <html lang="az">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="max-w-md space-y-2">
            <h1 className="text-xl font-semibold">Bitig — kritik xəta</h1>
            <p className="text-sm text-neutral-400">
              Səhifəni yenidən yükləyin. Əgər problem qalırsa, bir az sonra yenidən cəhd edin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#4AD860] px-5 py-2.5 text-sm font-semibold text-[#06140A] transition hover:opacity-90"
          >
            Yenidən cəhd et
          </button>
        </div>
      </body>
    </html>
  )
}
