"use client"
import { useMemo, useState } from 'react'
import { books } from '@/lib/data'
import type { Book } from '@/lib/data'
import { BookCard } from '@/components/BookCard'
import { FiHeadphones, FiSearch } from 'react-icons/fi'

import { useLocale } from '@/context/locale'

export default function BrowsePage() {
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState<string>('all')
  const [minRating, setMinRating] = useState<number>(0)
  const locale = useLocale()

  const genres = useMemo(() => ['all', ...Array.from(new Set(books.map(b => b.genre)))], [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return books.filter((b) => {
      const matchText = !query || (
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query)
      )
      const matchGenre = genre === 'all' || b.genre === genre
      const matchRating = b.rating >= minRating
      return matchText && matchGenre && matchRating
    })
  }, [q, genre, minRating])

  return (
    <section className="container-max py-6 sm:py-8">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-100 mb-5 sm:mb-6">
        <div className="relative p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-brand/15 via-emerald-100/40 to-transparent">
          <div className="absolute -top-10 -left-10 h-36 w-36 rounded-full bg-brand/20 blur-2xl" />
          <div className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-emerald-300/30 blur-2xl" />
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="grid place-items-center h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white/80 text-brand shadow-soft">
              <FiHeadphones size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold truncate">Find your next listen</h2>
              <p className="text-xs sm:text-sm text-neutral-600 truncate">Curated picks. Smart filters. Fresh releases.</p>
            </div>
            <button
              onClick={() => {
                const el = document.querySelector('#filters') as HTMLElement | null
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="btn btn-outline py-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-2"><FiSearch /> Filters</span>
            </button>
          </div>
        </div>
      </div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Browse audiobooks</h1>
        <p className="text-neutral-600 mt-1 text-sm sm:text-base">Explore our growing collection.</p>
      </div>

      <div id="filters" className="card p-3 sm:p-4 mb-5 sm:mb-6 grid gap-3 sm:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or author"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm">
          {genres.map(g => (
            <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
          ))}
        </select>
        <select value={String(minRating)} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm">
          {[0,3,3.5,4,4.5].map(r => (
            <option key={r} value={r}>Min rating: {r === 0 ? 'Any' : r.toFixed(1)}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((b: Book) => (
          <BookCard key={b.id} book={b} locale={locale} />
        ))}
      </div>
    </section>
  )
}
