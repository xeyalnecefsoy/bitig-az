"use client"
import { useCart } from '@/context/cart'

export function AddToCart({ id, price }: { id: string; price?: number }) {
  const { add } = useCart()
  return (
    <div className="flex items-center gap-4">
      {typeof price === 'number' && (
        <div className="text-2xl font-semibold">${price.toFixed(2)}</div>
      )}
      <button className="btn btn-primary" onClick={() => add(id)}>
        Add to cart
      </button>
    </div>
  )
}
