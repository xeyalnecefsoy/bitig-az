import { notFound } from 'next/navigation'
import Image from 'next/image'
import { t } from '@/lib/i18n'
import { AddToCartBtn } from './client'
import { AudiobookPlayerWrapper } from '@/components/AudiobookPlayerWrapper'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FiLock } from 'react-icons/fi'

export default async function AudiobookDetailsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch book details
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (!book) {
    notFound()
  }

  // Fetch tracks
  const { data: tracks } = await supabase
    .from('book_tracks')
    .select('*')
    .eq('book_id', id)
    .order('position', { ascending: true })

  return (
    <section className="container-max py-10">
      <div className="grid gap-8 md:grid-cols-[300px_1fr] lg:gap-12">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 shadow-lg">
          <Image
            src={book.cover || '/placeholder-book.jpg'}
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
              <span className="font-medium">{book.rating || 0}</span>
            </div>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div>{book.length}</div>
          </div>

          <div className="mb-8 text-2xl font-bold text-brand">${book.price}</div>

          {user ? (
            <div className="mb-8">
              <AudiobookPlayerWrapper 
                tracks={tracks || []}
                title={book.title} 
                cover={book.cover || ''} 
              />
            </div>
          ) : (
            <div className="mb-8 rounded-xl bg-neutral-50 border border-neutral-200 p-6 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <FiLock size={24} className="text-neutral-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Sign in to listen</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">You need an account to listen to this audiobook.</p>
                </div>
                <Link href={`/${locale}/login` as any} className="btn btn-primary whitespace-nowrap">
                  Sign In
                </Link>
              </div>
            </div>
          )}

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
