"use client"
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { useDebounce } from 'use-debounce'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'

const GENRES = [
  'Fiction', 'Non-fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 
  'Biography', 'History', 'Self-help', 'Business', 'Romance',
  'Classic', 'Poetry', 'Drama'
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'newest' },
  { value: 'popular', label: 'popular' },
  { value: 'a-z', label: 'a_z' },
  { value: 'z-a', label: 'z_a' },
]

export function SearchAndFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useLocale()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery] = useDebounce(query, 500)
  const [showFilters, setShowFilters] = useState(false)
  
  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const currentQ = params.get('q') || ''
    
    // Prevent infinite loop: only update if value actually changed
    if (currentQ === debouncedQuery && (debouncedQuery !== '' || !params.has('q'))) {
       return
    }

    if (debouncedQuery) {
      params.set('q', debouncedQuery)
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, [debouncedQuery, pathname, router, searchParams])

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const currentGenre = searchParams.get('genre')
  const currentSort = searchParams.get('sort') || 'newest'

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(locale, 'search_placeholder')}
          className="w-full h-12 rounded-xl border border-neutral-200 pl-11 pr-4 bg-white text-base focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
        />
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${showFilters ? 'bg-brand/10 text-brand' : 'hover:bg-neutral-100 text-neutral-500 dark:hover:bg-neutral-700'}`}
        >
          <FiFilter size={20} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 animate-in fade-in slide-in-from-top-2">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t(locale, 'filter_genre')}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilter('genre', null)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!currentGenre ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'}`}
                >
                  {t(locale, 'all')}
                </button>
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    onClick={() => updateFilter('genre', genre)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentGenre === genre ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'}`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t(locale, 'sort_by')}
              </label>
              <select
                value={currentSort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full p-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none focus:border-brand dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {t(locale, opt.label)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
