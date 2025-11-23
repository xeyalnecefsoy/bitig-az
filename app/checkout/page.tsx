'use client'
import Link from 'next/link'
import { useCart } from '@/context/cart'

export default function CheckoutPage() {
  const { items } = useCart()
  return (
    <section className="container-max py-10">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <form className="card p-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full rounded-md border border-neutral-200 px-3 py-2" placeholder="you@example.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">First name</label>
              <input className="w-full rounded-md border border-neutral-200 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Last name</label>
              <input className="w-full rounded-md border border-neutral-200 px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Card details</label>
            <input className="w-full rounded-md border border-neutral-200 px-3 py-2" placeholder="1234 1234 1234 1234" />
          </div>
          <button className="btn btn-primary w-full" type="button" onClick={() => alert('UI only demo')}>Pay now</button>
          <p className="text-xs text-neutral-500">This is a UI-only demo. No payment is processed.</p>
        </form>
        <aside className="card p-6 h-fit">
          <h2 className="font-semibold mb-4">Order summary</h2>
          <ul className="space-y-2 text-sm text-neutral-700">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>{it.id} × {it.qty}</span>
                <span>See cart for pricing</span>
              </li>
            ))}
          </ul>
          <Link href="/cart" className="text-brand hover:underline text-sm inline-block mt-4">Back to cart</Link>
        </aside>
      </div>
    </section>
  )
}
