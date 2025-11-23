import { createClient } from '@/lib/supabase/server'
import { CartClient } from './client'

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <CartClient locale={locale} user={user} />
}
