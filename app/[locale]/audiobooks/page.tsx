"use client"
import { BookCard } from '@/components/BookCard'
import { t, type Locale } from '@/lib/i18n'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiLock, FiSearch, FiGrid, FiBook } from 'react-icons/fi'
import Link from 'next/link'
import { AdBanner } from '@/components/ads/AdBanner'
import { LibraryContent } from '@/components/LibraryContent'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export default function AudiobooksPage({ params: paramsPromise }: { params: Promise<{ locale: string }> }) {
  const [params, setParams] = React.useState<{ locale: string } | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<'discover' | 'library'>(
    (searchParams.get('tab') as any) || 'discover'
  )
  const [user, setUser] = useState<any>(null)
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    paramsPromise.then(setParams)
  }, [paramsPromise])

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

      setBooks(booksData || [])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'library') setActiveTab('library')
    else setActiveTab('discover')
  }, [searchParams])

  const handleTabChange = (tab: 'discover' | 'library') => {
    setActiveTab(tab)
    const newParams = new URLSearchParams(searchParams.toString())
    if (tab === 'library') newParams.set('tab', 'library')
    else newParams.delete('tab')
    router.push(`${pathname}?${newParams.toString()}`)
  }

  if (!params) return null
  const { locale } = params

  return (
    <section className="container-max py-6 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white transition-all">
          {activeTab === 'discover' 
            ? t(locale as Locale, 'nav_audiobooks') 
            : t(locale as Locale, 'nav_library')}
        </h1>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <button
            onClick={() => handleTabChange('discover')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'discover'
                ? 'bg-white dark:bg-neutral-700 text-brand shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <FiSearch size={16} />
            {t(locale as Locale, 'nav_discover')}
          </button>
          <button
            onClick={() => handleTabChange('library')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-white dark:bg-neutral-700 text-brand shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <FiBook size={16} />
            {t(locale as Locale, 'nav_library')}
          </button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <>
          {!user && !loading && (
            <div className="mb-8 rounded-xl bg-brand/5 border border-brand/10 p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left transition-all hover:bg-brand/[0.07]">
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

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="aspect-[2/3] bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
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
                      <AdBanner placement="audiobooks_grid" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          
          {!loading && books.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 dark:text-neutral-400">{t(locale as Locale, 'audiobooks_empty')}</p>
            </div>
          )}
        </>
      ) : (
        <LibraryContent locale={locale as Locale} />
      )}
    </section>
  )
}
