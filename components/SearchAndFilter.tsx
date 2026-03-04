"use client"
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { useDebounce } from 'use-debounce'
import { useLocale } from '@/context/locale'
import { t, translateGenre, DEFAULT_GENRES_AZ } from '@/lib/i18n'

const GENRES = DEFAULT_GENRES_AZ

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
          <div className="flex flex-wrap items-start gap-6 lg:gap-8">
            {/* Genre Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                {t(locale, 'filter_genre')}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilter('genre', null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border ${!currentGenre ? 'bg-brand text-white border-brand' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                >
                  {t(locale, 'all')}
                </button>
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    onClick={() => updateFilter('genre', genre)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border ${currentGenre === genre ? 'bg-brand text-white border-brand' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                  >
                    {translateGenre(locale, genre)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-filters Group */}
            <div className="flex flex-wrap items-start gap-6 lg:gap-8">
              {/* Voice Type Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  {t(locale, 'filter_voice_type')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilter('voice_type', null)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border ${!searchParams.get('voice_type') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                  >
                    {t(locale, 'voice_any') || 'Any'}
                  </button>
                  {['single', 'multiple', 'radio_theater'].map(vt => (
                    <button
                      key={vt}
                      onClick={() => updateFilter('voice_type', vt)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border ${searchParams.get('voice_type') === vt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                    >
                      {t(locale, `voice_${vt}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  {t(locale, 'filter_price') || 'Price'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilter('price', null)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border ${!searchParams.get('price') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                  >
                    {t(locale, 'price_any') || 'Any'}
                  </button>
                  {['free', 'paid'].map(p => (
                    <button
                      key={p}
                      onClick={() => updateFilter('price', p)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border ${searchParams.get('price') === p ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                    >
                      {t(locale, `price_${p}`) || p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length Filter */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  {t(locale, 'filter_length') || 'Length'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFilter('length', null)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border ${!searchParams.get('length') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                  >
                    {t(locale, 'length_any') || 'Any'}
                  </button>
                  {['short', 'medium', 'long'].map(l => (
                    <button
                      key={l}
                      onClick={() => updateFilter('length', l)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border ${searchParams.get('length') === l ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                    >
                      {t(locale, `length_${l}`) || l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atmosphere (Ambience & SFX) */}
              <div>
                 <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  {t(locale, 'filter_atmosphere')}
                </label>
                <div className="flex gap-2">
                  <button 
                    title={t(locale, 'has_ambience')}
                    onClick={() => updateFilter('has_ambience', searchParams.get('has_ambience') === 'true' ? null : 'true')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border flex items-center gap-2 ${searchParams.get('has_ambience') === 'true' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                  >
                    {t(locale, 'has_ambience')}
                  </button>
                  <button 
                    title={t(locale, 'has_sound_effects')}
                    onClick={() => updateFilter('has_sound_effects', searchParams.get('has_sound_effects') === 'true' ? null : 'true')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors font-medium border flex items-center gap-2 ${searchParams.get('has_sound_effects') === 'true' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                  >
                    {t(locale, 'has_sound_effects')}
                  </button>
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  {t(locale, 'sort_by')}
                </label>
                <select
                  value={currentSort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="w-full sm:w-auto p-2 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-700 outline-none focus:border-brand dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300"
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
        </div>
      )}
    </div>
  )
}
