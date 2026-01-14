import { BookCard } from '@/components/BookCard'
import { t, type Locale } from '@/lib/i18n'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { FiLock } from 'react-icons/fi'
import Link from 'next/link'
import { AdBanner } from '@/components/ads/AdBanner'
import type { Metadata } from 'next'

const pageMetadata = {
  az: {
    title: 'Səsli Kitablar',
    description: 'Azərbaycan dilində səsli kitabları kəşf edin və dinləyin. Ən yaxşı audiokitablar, yeni nəşrlər və populyar əsərlər.',
  },
  en: {
    title: 'Audiobooks',
    description: 'Discover and listen to Azerbaijani audiobooks. Best audiobooks, new releases and popular works.',
  },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const meta = pageMetadata[locale as keyof typeof pageMetadata] || pageMetadata.az
  const baseUrl = 'https://bitig.az'
  
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: `${meta.title} | Bitig`,
      description: meta.description,
      url: `${baseUrl}/${locale}/audiobooks`,
      images: [{ url: `${baseUrl}/og.png`, width: 1200, height: 630, alt: meta.title }],
    },
  }
}

export default async function AudiobooksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch books from Supabase
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  const booksList = books || []

  return (
    <section className="container-max py-6 sm:py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale as Locale, 'nav_audiobooks')}</h1>
      </div>

      {!user && (
        <div className="mb-8 rounded-xl bg-brand/5 border border-brand/10 p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <FiLock size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-white">{t(locale as Locale, 'audiobooks_sign_in_title')}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{t(locale as Locale, 'audiobooks_sign_in_desc')}</p>
          </div>
          <Link href={`/${locale}/login` as any} className="btn btn-primary whitespace-nowrap">
            {t(locale as Locale, 'sign_in')}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {booksList.map((book, i) => (
          <React.Fragment key={book.id}>
            <BookCard 
              book={book} 
              locale={locale} 
              disabled={!user}
            />
            {(i + 1) % 6 === 0 && (
              <div className="col-span-full py-4">
                <AdBanner placement="audiobooks_grid" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {booksList.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500 dark:text-neutral-400">{t(locale as Locale, 'audiobooks_empty')}</p>
        </div>
      )}
    </section>
  )
}
