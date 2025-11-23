'use client'
import Link from 'next/link'
import { useCart } from '@/context/cart'
import { useLocale } from '@/context/locale'

export default function CheckoutPage() {
  const { items } = useCart()
  const locale = useLocale()
  return (
    <section className="container-max py-10">
      <h1 className="text-3xl font-bold mb-6">{locale === 'az' ? 'Ödəniş' : 'Checkout'}</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <form className="card p-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full rounded-md border border-neutral-200 px-3 py-2" placeholder="you@example.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">{locale === 'az' ? 'Ad' : 'First name'}</label>
              <input className="w-full rounded-md border border-neutral-200 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">{locale === 'az' ? 'Soyad' : 'Last name'}</label>
              <input className="w-full rounded-md border border-neutral-200 px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">{locale === 'az' ? 'Kart məlumatları' : 'Card details'}</label>
            <input className="w-full rounded-md border border-neutral-200 px-3 py-2" placeholder="1234 1234 1234 1234" />
          </div>
          <button className="btn btn-primary w-full" type="button" onClick={() => alert('UI only demo')}>{locale === 'az' ? 'İndi ödə' : 'Pay now'}</button>
          <p className="text-xs text-neutral-500">This is a UI-only demo. No payment is processed.</p>
        </form>
        <aside className="card p-6 h-fit">
          <h2 className="font-semibold mb-4">{locale === 'az' ? 'Sifariş xülasəsi' : 'Order summary'}</h2>
          <ul className="space-y-2 text-sm text-neutral-700">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>{it.id} × {it.qty}</span>
                <span>{locale === 'az' ? 'Qiymət üçün səbətə baxın' : 'See cart for pricing'}</span>
              </li>
            ))}
          </ul>
          <Link href={`/${locale}/cart` as any} className="text-brand hover:underline text-sm inline-block mt-4">{locale === 'az' ? 'Səbətə qayıt' : 'Back to cart'}</Link>
        </aside>
      </div>
    </section>
  )
}
