"use client"
import Link from 'next/link'
import Image from 'next/image'
import { FiPlay, FiShoppingCart, FiLock } from 'react-icons/fi'
import { useCart } from '@/context/cart'
import type { Book } from '@/lib/data'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function BookCard({ book, locale, disabled }: { book: any; locale: string; disabled?: boolean }) {
  return (
    <div className={`group relative flex flex-col gap-2 ${disabled ? 'opacity-75' : ''}`}>
      <div className="aspect-[2/3] w-full overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800 relative">
        <Link href={`/${locale}/audiobooks/${book.id}` as any} className="block h-full w-full relative">
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] pointer-events-none">
            <div className="bg-black/50 p-2 rounded-full text-white">
              <FiLock />
            </div>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base line-clamp-1 text-neutral-900 dark:text-white mb-1">{book.title}</h3>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-1">{book.author}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-brand">${book.price}</span>
          <div className="flex items-center gap-1 text-xs sm:text-sm">
            <span className="text-yellow-500">★</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{book.rating}</span>
          </div>
        </div>
        <Add id={book.id} />
      </div>
    </div>
  )
}

function Add({ id }: { id: string }) {
  const { add } = useCart()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const handleAdd = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/${locale}/login` as any)
      return
    }
    add(id)
  }

  return (
    <button onClick={handleAdd} className="btn btn-primary w-full mt-3 py-2 text-sm">
      {t(locale, 'add_to_cart')}
    </button>
  )
}
