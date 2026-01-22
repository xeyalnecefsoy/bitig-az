"use client"
import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context/auth'
import { createClient } from '@/lib/supabase/client'
import { BookCard } from '@/components/BookCard'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'
import { FiBook, FiBookOpen, FiCheckCircle, FiHeart, FiClock } from 'react-icons/fi'
import Link from 'next/link'

type Tab = 'all' | 'reading' | 'completed' | 'want_to_read' | 'favorites'

type UserBook = {
  id: string
  book_id: string
  status: string
  books: {
    id: string
    title: string
    author: string
    cover?: string
    cover_url?: string
    rating?: number
    length?: string
  }
}

type ProgressItem = {
  book_id: string
  position_seconds: number
  total_listened_seconds: number
  last_played_at: string
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const locale = (pathname?.split('/')[1] || 'az') as Locale
  const supabase = useMemo(() => createClient(), [])
  
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [progress, setProgress] = useState<Map<string, ProgressItem>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLibrary() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Load user books
        const { data: books } = await supabase
          .from('user_books')
          .select(`
            id, book_id, status,
            books:book_id (id, title, author, cover, cover_url, rating, length)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (books) {
          setUserBooks(books as unknown as UserBook[])
        }

        // Load listening progress
        const { data: progressData } = await supabase
          .from('listening_progress')
          .select('book_id, position_seconds, total_listened_seconds, last_played_at')
          .eq('user_id', user.id)

        if (progressData) {
          const progressMap = new Map<string, ProgressItem>()
          progressData.forEach(p => progressMap.set(p.book_id, p))
          setProgress(progressMap)
        }
      } catch (error) {
        console.error('Error loading library:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadLibrary()
    }
  }, [user, authLoading, supabase])

  const filteredBooks = useMemo(() => {
    if (activeTab === 'all') return userBooks
    return userBooks.filter(b => {
      if (activeTab === 'reading') return b.status === 'reading'
      if (activeTab === 'completed') return b.status === 'completed'
      if (activeTab === 'want_to_read') return b.status === 'want_to_read'
      return false
    })
  }, [userBooks, activeTab])

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: locale === 'az' ? 'Hamısı' : 'All', icon: <FiBook />, count: userBooks.length },
    { id: 'reading', label: locale === 'az' ? 'Oxuyuram' : 'Reading', icon: <FiBookOpen />, count: userBooks.filter(b => b.status === 'reading').length },
    { id: 'completed', label: locale === 'az' ? 'Bitirdim' : 'Completed', icon: <FiCheckCircle />, count: userBooks.filter(b => b.status === 'completed').length },
    { id: 'want_to_read', label: locale === 'az' ? 'İstəyirəm' : 'Want to Read', icon: <FiHeart />, count: userBooks.filter(b => b.status === 'want_to_read').length },
  ]

  if (authLoading || loading) {
    return (
      <div className="container-max py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="flex gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            ))}
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container-max py-16 text-center">
        <FiBook className="mx-auto mb-4 text-5xl text-neutral-400" />
        <h2 className="text-xl font-semibold mb-2">
          {locale === 'az' ? 'Kitabxananızı görmək üçün daxil olun' : 'Sign in to view your library'}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {locale === 'az' ? 'Oxuduğunuz kitabları izləyin və proqresinizi saxlayın' : 'Track your reading and save your progress'}
        </p>
        <Link href={`/${locale}/login` as any} className="btn btn-primary">
          {t(locale, 'sign_in')}
        </Link>
      </div>
    )
  }

  return (
    <div className="container-max py-6 sm:py-8">
      <h1 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-white">
        {locale === 'az' ? 'Kitabxanam' : 'My Library'}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-brand">{userBooks.length}</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {locale === 'az' ? 'Ümumi kitab' : 'Total books'}
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {userBooks.filter(b => b.status === 'completed').length}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {locale === 'az' ? 'Bitirdim' : 'Completed'}
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {userBooks.filter(b => b.status === 'reading').length}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {locale === 'az' ? 'Oxuyuram' : 'Reading'}
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {Math.round(Array.from(progress.values()).reduce((sum, p) => sum + p.total_listened_seconds, 0) / 3600)}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {locale === 'az' ? 'Dinləmə saatı' : 'Hours listened'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="card p-8 text-center">
          <FiBook className="mx-auto mb-3 text-4xl text-neutral-400" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {activeTab === 'all' 
              ? (locale === 'az' ? 'Kitabxananız boşdur' : 'Your library is empty')
              : (locale === 'az' ? 'Bu kateqoriyada kitab yoxdur' : 'No books in this category')
            }
          </p>
          <Link href={`/${locale}/audiobooks` as any} className="btn btn-primary mt-4">
            {locale === 'az' ? 'Kitab Tap' : 'Find Books'}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBooks.map(userBook => {
            const book = userBook.books
            const bookProgress = progress.get(book.id)
            
            return (
              <div key={userBook.id} className="relative">
                <BookCard 
                  book={{
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    cover: book.cover || book.cover_url || '',
                    rating: book.rating || 0,
                    length: book.length
                  }} 
                  locale={locale}
                />
                {/* Progress overlay */}
                {bookProgress && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-b-xl overflow-hidden">
                    <div 
                      className="h-full bg-brand" 
                      style={{ width: `${Math.min(100, (bookProgress.total_listened_seconds / 36000) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
