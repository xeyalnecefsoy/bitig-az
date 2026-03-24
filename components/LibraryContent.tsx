"use client"
import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context/auth'
import { createClient } from '@/lib/supabase/client'
import { BookCard } from '@/components/BookCard'
import { t, type Locale } from '@/lib/i18n'
import { FiBook, FiBookOpen, FiCheckCircle, FiHeart, FiSearch } from 'react-icons/fi'
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
    price?: number
  }
}

type ProgressItem = {
  book_id: string
  position_seconds: number
  total_listened_seconds: number
  last_played_at: string
}

export function LibraryContent({ locale }: { locale: Locale }) {
  const { user, loading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [progress, setProgress] = useState<Map<string, ProgressItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

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
            books:book_id (id, title, author, cover, cover_url, rating, length, price)
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
    let filtered = userBooks

    if (activeTab !== 'all') {
      filtered = filtered.filter(b => {
        if (activeTab === 'reading') return b.status === 'reading'
        if (activeTab === 'completed') return b.status === 'completed'
        if (activeTab === 'want_to_read') return b.status === 'want_to_read'
        return false
      })
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(b => 
        b.books.title.toLowerCase().includes(q) || 
        b.books.author.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [userBooks, activeTab, searchQuery])

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: locale === 'az' ? 'Hamısı' : 'All', icon: <FiBook />, count: userBooks.length },
    { id: 'reading', label: locale === 'az' ? 'Oxuyuram' : 'Reading', icon: <FiBookOpen />, count: userBooks.filter(b => b.status === 'reading').length },
    { id: 'completed', label: locale === 'az' ? 'Bitirdim' : 'Completed', icon: <FiCheckCircle />, count: userBooks.filter(b => b.status === 'completed').length },
    { id: 'want_to_read', label: locale === 'az' ? 'İstəyirəm' : 'Want to Read', icon: <FiHeart />, count: userBooks.filter(b => b.status === 'want_to_read').length },
  ]

  async function updateBookStatus(userBookId: string, newStatus: 'want_to_read' | 'reading' | 'completed') {
    setUpdatingId(userBookId)
    setOpenMenuId(null)
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null
    const { error } = await supabase
      .from('user_books')
      .update({ status: newStatus, completed_at: completedAt })
      .eq('id', userBookId)
      .eq('user_id', user?.id)

    if (!error) {
      setUserBooks((prev) =>
        prev.map((item) => (item.id === userBookId ? { ...item, status: newStatus } : item)),
      )
    } else {
      console.error('Error updating book status:', error)
    }
    setUpdatingId(null)
  }

  async function removeFromLibrary(userBookId: string) {
    setUpdatingId(userBookId)
    setOpenMenuId(null)
    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('id', userBookId)
      .eq('user_id', user?.id)
    if (!error) {
      setUserBooks((prev) => prev.filter((item) => item.id !== userBookId))
    } else {
      console.error('Error removing from library:', error)
    }
    setUpdatingId(null)
  }

  if (authLoading || loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
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
    )
  }

  if (!user) {
    return (
      <div className="py-16 text-center card bg-neutral-50 dark:bg-neutral-900/50">
        <FiBook className="mx-auto mb-4 text-5xl text-neutral-400" />
        <h2 className="text-xl font-semibold mb-2">
          {locale === 'az' ? 'Kitabxananızı görmək üçün daxil olun' : 'Sign in to view your library'}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4 px-4">
          {locale === 'az' ? 'Oxuduğunuz kitabları izləyin və proqresinizi saxlayın' : 'Track your reading and save your progress'}
        </p>
        <Link href={`/${locale}/login` as any} className="btn btn-primary">
          {t(locale, 'sign_in')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-2xl font-bold text-brand">{userBooks.length}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            {locale === 'az' ? 'Ümumi kitab' : 'Total books'}
          </div>
        </div>
        <div className="card p-4 text-center bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {userBooks.filter(b => b.status === 'completed').length}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            {locale === 'az' ? 'Bitirdim' : 'Completed'}
          </div>
        </div>
        <div className="card p-4 text-center bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {userBooks.filter(b => b.status === 'reading').length}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            {locale === 'az' ? 'Oxuyuram' : 'Reading'}
          </div>
        </div>
        <div className="card p-4 text-center bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">
            {Math.round(Array.from(progress.values()).reduce((sum, p) => sum + p.total_listened_seconds, 0) / 3600)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
            {locale === 'az' ? 'Dinləmə saatı' : 'Hours listened'}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded-xl">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-brand shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-brand/10 text-brand' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-auto min-w-[240px]">
          <Link href={`/${locale}/audiobooks`} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-brand transition-colors">
            <FiSearch />
          </Link>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'az' ? 'Kitabxanamda axtar...' : 'Search in library...'}
            className="w-full h-10 pl-9 pr-4 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
          />
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="card p-12 text-center bg-neutral-50 dark:bg-neutral-900/30 border-dashed border-2">
          <FiBook className="mx-auto mb-3 text-4xl text-neutral-300 dark:text-neutral-700" />
          <p className="text-neutral-500 dark:text-neutral-400">
            {searchQuery 
              ? (locale === 'az' ? 'Axtarışa uyğun kitab tapılmadı' : 'No books found matching your search')
              : activeTab === 'all' 
                ? (locale === 'az' ? 'Kitabxananız boşdur' : 'Your library is empty')
                : (locale === 'az' ? 'Bu kateqoriyada kitab yoxdur' : 'No books in this category')
            }
          </p>
          {activeTab !== 'all' && !searchQuery && (
             <button onClick={() => setActiveTab('all')} className="text-brand text-sm mt-2 font-medium hover:underline">
               {locale === 'az' ? 'Bütün kitablara bax' : 'View all books'}
             </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBooks.map(userBook => {
            const book = userBook.books
            const bookProgress = progress.get(book.id)
            
            return (
              <div key={userBook.id} className="relative group">
                <BookCard 
                  book={{
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    cover: book.cover || book.cover_url || '',
                    rating: book.rating || 0,
                    length: book.length,
                    price: book.price
                  }} 
                  locale={locale}
                />
                <div className="absolute top-2 right-2 z-20">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(prev => (prev === userBook.id ? null : userBook.id))}
                    disabled={updatingId === userBook.id}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide shadow-sm border transition-colors ${
                      userBook.status === 'completed'
                        ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800'
                        : userBook.status === 'reading'
                          ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800'
                    } disabled:opacity-60`}
                    aria-label={locale === 'az' ? 'Statusu dəyiş' : 'Change status'}
                  >
                    {userBook.status === 'completed' ? t(locale, 'status_completed') :
                     userBook.status === 'reading' ? t(locale, 'status_reading') :
                     t(locale, 'status_want_to_read')}
                  </button>

                  {openMenuId === userBook.id && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="close menu"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 mt-1 w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900 z-20">
                        <button
                          type="button"
                          onClick={() => updateBookStatus(userBook.id, 'want_to_read')}
                          className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                            userBook.status === 'want_to_read'
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {t(locale, 'status_want_to_read')}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBookStatus(userBook.id, 'reading')}
                          className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                            userBook.status === 'reading'
                              ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {t(locale, 'status_reading')}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBookStatus(userBook.id, 'completed')}
                          className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                            userBook.status === 'completed'
                              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {t(locale, 'status_completed')}
                        </button>
                        <div className="border-t border-neutral-100 dark:border-neutral-800" />
                        <button
                          type="button"
                          onClick={() => removeFromLibrary(userBook.id)}
                          className="w-full px-3 py-2 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          {locale === 'az' ? 'Siyahıdan sil' : 'Remove from library'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {/* Progress overlay */}
                {bookProgress && bookProgress.total_listened_seconds > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-b-xl overflow-hidden">
                    <div 
                      className="h-full bg-brand transition-all duration-500" 
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
