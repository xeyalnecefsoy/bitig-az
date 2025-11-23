import { BookCard } from '@/components/BookCard'
import { t } from '@/lib/i18n'
import { books } from '@/lib/data'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { FiLock } from 'react-icons/fi'
import Link from 'next/link'

export default async function AudiobooksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <section className="container-max py-6 sm:py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'nav_audiobooks')}</h1>
      </div>

      {!user && (
        <div className="mb-8 rounded-xl bg-brand/5 border border-brand/10 p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <FiLock size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Sign in to listen</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">You need an account to listen to full audiobooks.</p>
          </div>
          <Link href={`/${locale}/login` as any} className="btn btn-primary whitespace-nowrap">
            Sign In
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {books.map((book, i) => (
          <React.Fragment key={book.id}>
            <BookCard 
              book={book} 
              locale={locale} 
              disabled={!user}
            />
            {(i + 1) % 6 === 0 && (
              <div className="col-span-full py-4">
                <div className="h-32 w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-sm">
                  Advertisement
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500 dark:text-neutral-400">No audiobooks found.</p>
        </div>
      )}
    </section>
  )
}
