import { books } from '@/lib/data'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { t } from '@/lib/i18n'
import { AddToCartBtn } from './client'

export default async function AudiobookDetailsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const book = books.find((b) => b.id === id)

  if (!book) {
    notFound()
  }

  return (
    <section className="container-max py-10">
      <div className="grid gap-8 md:grid-cols-[300px_1fr] lg:gap-12">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 shadow-lg">
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-brand">{book.genre}</div>
          <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">{book.title}</h1>
          <div className="mb-6 text-lg text-neutral-600 dark:text-neutral-400">{book.author}</div>
          
          <div className="mb-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{book.rating}</span>
            </div>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div>{book.length}</div>
          </div>

          <div className="mb-8 text-2xl font-bold text-brand">${book.price}</div>

          <div className="mb-8 max-w-prose text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {book.description}
          </div>

          <div className="flex gap-4">
            <AddToCartBtn id={book.id} locale={locale} />
          </div>
        </div>
      </div>
    </section>
  )
}
