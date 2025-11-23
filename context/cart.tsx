'use client'
import { createContext, useContext, useMemo, useState } from 'react'

type Item = { id: string; qty: number }

type CartState = {
  items: Item[]
  count: number
  add: (id: string) => void
  remove: (id: string) => void
  clear: () => void
}

const CartCtx = createContext<CartState | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([])

  const api = useMemo<CartState>(() => ({
    items,
    count: items.reduce((n, it) => n + it.qty, 0),
    add: (id: string) => setItems(prev => {
      const idx = prev.findIndex(p => p.id === id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }
        return copy
      }
      return [...prev, { id, qty: 1 }]
    }),
    remove: (id: string) => setItems(prev => prev.filter(p => p.id !== id)),
    clear: () => setItems([])
  }), [items])

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
