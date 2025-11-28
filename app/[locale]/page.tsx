import Link from 'next/link'
import type { Book } from '@/lib/data'
import { BookCard } from '@/components/BookCard'
import { HeroCarousel } from '@/components/HeroCarousel'
import { t } from '@/lib/i18n'
import { posts, getUser } from '@/lib/social'
import { FiHeart, FiMessageCircle } from 'react-icons/fi'
import { createClient } from '@/lib/supabase/server'
import { AdBanner } from '@/components/ads/AdBanner'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  
  // Fetch books from database
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('rating', { ascending: false })
    .limit(6)
  
  return (
    <div>
      <section className="bg-gradient-to-b from-brand/10 to-transparent">
        <div className="container-max py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
                {t(locale as any, 'home_headline')}
              </h1>
              <div className="flex gap-3">
                <Link href={`/${locale}/audiobooks` as any} className="btn btn-primary py-2 text-sm sm:text-base">{t(locale as any, 'cta_browse')}</Link>
                <Link href={`/${locale}#featured` as any} className="btn btn-outline py-2 text-sm sm:text-base">{t(locale as any, 'cta_featured')}</Link>
              </div>
            </div>
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* Sponsor Banner */}
      <AdBanner placement="homepage" className="container-max my-8" />

      <section id="featured" className="container-max py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-semibold">Featured picks</h2>
          <Link href={`/${locale}/audiobooks` as any} className="text-brand hover:underline">See all</Link>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {books?.map((b: Book) => (
            <BookCard key={b.id} book={b} locale={locale} />
          ))}
        </div>
      </section>

      <section className="container-max py-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-semibold">{t(locale as any, 'home_social_title')}</h2>
          <Link href={`/${locale}/social` as any} className="text-brand hover:underline">{t(locale as any, 'view_all')}</Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 6).map(p => {
            const u = getUser(p.userId)!
            return (
              <li key={p.id} className="card overflow-hidden">
                <Link href={`/${locale}/social/post/${p.id}` as any} className="block">
                  <div className="h-1 bg-gradient-to-r from-brand/60 via-emerald-400/60 to-transparent" />
                  <div className="p-4 sm:p-5">
                    <header className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
                      <div className="min-w-0">
                        <div className="font-medium leading-tight line-clamp-1 hover:text-brand">{u.name}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo(p.createdAt)}</div>
                      </div>
                    </header>
                    <p className="mt-3 text-sm sm:text-base line-clamp-3 text-neutral-800 dark:text-neutral-100">{p.content}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300">
                      <span className="inline-flex items-center gap-2"><FiHeart className={p.likedByMe ? 'text-brand' : ''} /> {p.likes}</span>
                      <span className="inline-flex items-center gap-2"><FiMessageCircle /> {p.comments.length}</span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s`
  if (diff < 3600) return `${Math.floor(diff/60)}m`
  if (diff < 86400) return `${Math.floor(diff/3600)}h`
  return `${Math.floor(diff/86400)}d`
}
