'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/cart'
import { books } from '@/lib/data'

export default function CartPage() {
  const { items, remove, clear } = useCart()
  const cartBooks = items.map(it => ({ ...it, book: books.find(b => b.id === it.id)! }))
  const total = cartBooks.reduce((sum, it) => sum + it.book.price * it.qty, 0)

  return (
    <section className="container-max py-10">
      <h1 className="text-3xl font-bold mb-6">Your cart</h1>
      {cartBooks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-4">Your cart is empty.</p>
          <Link href="/browse" className="btn btn-primary">Browse audiobooks</Link>
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
                <button className="text-red-600 hover:underline" onClick={() => remove(id)}>Remove</button>
              </li>
            ))}
          </ul>
          <aside className="card p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <div className="text-neutral-600">Subtotal</div>
              <div className="font-semibold">${total.toFixed(2)}</div>
            </div>
            <Link href="/checkout" className="btn btn-primary w-full mb-3">Checkout</Link>
            <button className="btn btn-outline w-full" onClick={clear}>Clear cart</button>
          </aside>
        </div>
      )}
    </section>
  )
}
