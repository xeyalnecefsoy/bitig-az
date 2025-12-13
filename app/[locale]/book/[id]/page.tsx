import Image from 'next/image'
import { notFound } from 'next/navigation'
import { books } from '@/lib/data'
import { RatingStars } from '@/components/RatingStars'
import { AddToCart } from '@/components/AddToCart'
import type { Metadata } from 'next'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { AudioPlayer } from '@/components/AudioPlayer'

export default async function BookDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id, locale } = await params
  const book = books.find(b => b.id === id)
  if (!book) return notFound()

  return (
    <section className="container-max py-10 grid gap-8 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-sm lg:max-w-md">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl ring-1 ring-neutral-200 shadow-soft dark:ring-neutral-800">
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 40vw, 90vw"
            priority
          />
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
        <p className="text-neutral-600 dark:text-neutral-300 mb-4">{t(locale as Locale, 'book_by')} {book.author}</p>
        <div className="flex items-center gap-3 mb-6">
          <RatingStars rating={book.rating} />
          <span className="text-sm text-neutral-600 dark:text-neutral-300">{book.length}</span>
        </div>
        <p className="mb-6 text-neutral-800 dark:text-neutral-100">{book.description}</p>
        <AddToCart id={book.id} price={book.price} />
        <div className="mt-6">
          <AudioPlayer
            tracks={[
              {
                id: book.id,
                title: `${t(locale as Locale, 'book_sample')} - ${book.title}`,
                audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                duration: 0,
              },
            ]}
            title={book.title}
            cover={book.cover}
          />
        </div>
      </div>
    </section>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const book = books.find(b => b.id === id)
  if (!book || !isLocale(locale)) return {}
  const title = `${book.title} — ${book.author}`
  const description = book.description.slice(0, 160)
  return {
    title,
    description,
    alternates: {
      languages: {
        en: `/en/book/${book.id}`,
        az: `/az/book/${book.id}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      images: [{ url: book.cover, width: 800, height: 1066, alt: book.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [book.cover],
    },
  }
}
