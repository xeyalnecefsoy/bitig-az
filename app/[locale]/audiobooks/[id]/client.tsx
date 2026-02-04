'use client'
import { useCart } from '@/context/cart'
import { t } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FaShoppingCart } from 'react-icons/fa'

export function AddToCartBtn({ id, locale }: { id: string; locale: string }) {
  const { add } = useCart()
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
    <button onClick={handleAdd} className="btn btn-primary px-8 py-3 flex items-center justify-center gap-2">
      <FaShoppingCart />
      {t(locale as any, 'add_to_cart')}
    </button>
  )
}
