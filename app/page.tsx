import Link from 'next/link'
import Image from 'next/image'
import { getBooks } from '@/lib/supabase/server-api'
import type { Book } from '@/lib/data'
import { BookCard } from '@/components/BookCard'
import { HeroCarousel } from '@/components/HeroCarousel'

export default async function HomePage() {
  const books = await getBooks()
  
  return (
    <div>
      <section className="bg-gradient-to-b from-brand/10 to-transparent">
        <div className="container-max py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <span className="badge mb-3">Bitig</span>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
                Listen smarter with beautiful audiobooks
              </h1>
              <p className="text-neutral-600 mb-5 text-sm sm:text-base">
                Discover curated stories, immersive narration, and flexible pricing. Clean, distraction‑free.
              </p>
              <div className="flex gap-3">
                <Link href="/browse" className="btn btn-primary py-2 text-sm sm:text-base">Browse</Link>
                <Link href="#featured" className="btn btn-outline py-2 text-sm sm:text-base">Featured</Link>
              </div>
            </div>
            <HeroCarousel />
          </div>
        </div>
      </section>

      <section id="featured" className="container-max py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-semibold">Featured picks</h2>
          <Link href="/browse" className="text-brand hover:underline">See all</Link>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {books.slice(0, 6).map((b: Book) => (
            <BookCard key={b.id} book={b} locale="en" />
          ))}
        </div>
      </section>
    </div>
  )
}
