'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/cart'
import { books } from '@/lib/data'
import { useMemo } from 'react'
import { t } from '@/lib/i18n'
import { FiShoppingCart, FiLock } from 'react-icons/fi'

export function CartClient({ locale, user }: { locale: string; user: any }) {
  const { items, remove, clear } = useCart()
  const cartBooks = items.map(it => ({ ...it, book: books.find(b => b.id === it.id)! }))
  const total = cartBooks.reduce((sum, it) => sum + it.book.price * it.qty, 0)
  const suggestions = useMemo(() => books.slice(0, 8), [])

  if (!user) {
    return (
      <section className="container-max py-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-20 w-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6 text-neutral-400">
          <FiShoppingCart size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t(locale as any, 'guest_cart_title')}</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md">
          {t(locale as any, 'guest_cart_sub')}
        </p>
        <Link href={`/${locale}/login` as any} className="btn btn-primary px-8">
          {t(locale as any, 'sign_in')}
        </Link>
      </section>
    )
  }

  return (
    <section className="container-max py-10">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t(locale as any, 'recommended')}</h2>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{t(locale as any, 'swipe')}</div>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map(b => (
              <Link key={b.id} href={`/${locale}/audiobooks/${b.id}` as any} className="snap-start shrink-0 w-64 sm:w-72">
                <div className="relative h-36 w-full rounded-xl overflow-hidden">
                  <Image src={b.cover} alt={b.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
                </div>
                <div className="mt-2 line-clamp-1 font-medium">{b.title}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">{b.author}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">{t(locale as any, 'nav_cart')}</h1>
      {cartBooks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-4">{t(locale as any, 'cart_empty')}</p>
          <Link href={`/${locale}/audiobooks` as any} className="btn btn-primary">{t(locale as any, 'browse_audiobooks')}</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <ul className="space-y-4">
            {cartBooks.map(({ id, qty, book }) => (
              <li key={id} className="card p-4 flex gap-4 items-center">
                <div className="relative h-20 w-16">
                  <Image src={book.cover} alt={book.title} fill className="object-cover rounded" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{book.title}</div>
                  <div className="text-sm text-neutral-600">x{qty} • ${book.price.toFixed(2)}</div>
                </div>
                <button className="text-red-600 hover:underline" onClick={() => remove(id)}>{t(locale as any, 'remove')}</button>
              </li>
            ))}
          </ul>
          <aside className="card p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <div className="text-neutral-600">{t(locale as any, 'subtotal')}</div>
              <div className="font-semibold">${total.toFixed(2)}</div>
            </div>
            <Link href={`/${locale}/checkout` as any} className="btn btn-primary w-full mb-3">{t(locale as any, 'checkout')}</Link>
            <button className="btn btn-outline w-full" onClick={clear}>{t(locale as any, 'clear_cart')}</button>
          </aside>
        </div>
      )}
    </section>
  )
}
