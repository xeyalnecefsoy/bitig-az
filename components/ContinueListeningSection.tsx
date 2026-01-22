"use client"
import { useEffect, useState } from 'react'
import { useContinueListening } from '@/hooks/useProgress'
import { useAuth } from '@/context/auth'
import Link from 'next/link'
import Image from 'next/image'
import { FiPlay, FiClock } from 'react-icons/fi'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n'

type ContinueItem = {
  id: string
  book_id: string
  track_index: number
  position_seconds: number
  total_listened_seconds: number
  last_played_at: string
  books: {
    id: string
    title: string
    author: string
    cover?: string
    cover_url?: string
  }
}

// Format time helper
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}s ${m}d`
  return `${m} dəq`
}

function formatTimeAgo(dateString: string, locale: Locale): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return locale === 'az' ? `${diffMins} dəq əvvəl` : `${diffMins}m ago`
  if (diffHours < 24) return locale === 'az' ? `${diffHours} saat əvvəl` : `${diffHours}h ago`
  return locale === 'az' ? `${diffDays} gün əvvəl` : `${diffDays}d ago`
}

export function ContinueListeningSection({ locale }: { locale: Locale }) {
  const { user } = useAuth()
  const { getContinueListening } = useContinueListening()
  const [items, setItems] = useState<ContinueItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false)
        return
      }
      const data = await getContinueListening(4)
      setItems(data as ContinueItem[])
      setLoading(false)
    }
    load()
  }, [user, getContinueListening])

  if (!user || loading || items.length === 0) return null

  return (
    <section className="container-max py-8">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          {locale === 'az' ? 'Dinləməyə Davam Et' : 'Continue Listening'}
        </h2>
        <Link 
          href={`/${locale}/library` as any}
          className="text-sm text-brand hover:underline"
        >
          {t(locale, 'see_all')}
        </Link>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const book = item.books
          const cover = book.cover || book.cover_url || '/placeholder-book.jpg'
          
          return (
            <Link
              key={item.id}
              href={`/${locale}/audiobooks/${book.id}` as any}
              className="group relative flex gap-3 p-3 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 hover:border-brand/50 hover:shadow-md transition-all"
            >
              {/* Cover */}
              <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                <Image 
                  src={cover} 
                  alt={book.title}
                  fill
                  className="object-cover"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
                    <FiPlay className="text-white text-sm translate-x-[1px]" />
                  </div>
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <h3 className="font-semibold text-sm text-neutral-900 dark:text-white truncate group-hover:text-brand transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {book.author}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <FiClock size={12} />
                  <span>{formatTimeAgo(item.last_played_at, locale)}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
