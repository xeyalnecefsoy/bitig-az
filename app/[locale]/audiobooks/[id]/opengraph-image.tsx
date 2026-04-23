import { createOgResponse, BookOgImage, FallbackOgImage } from '@/lib/og-image'
import { getPublicClient } from '@/lib/supabase/server-api'

export const alt = 'Audiobook on Bitig.az'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params

  const supabase = getPublicClient()
  const { data: book } = await supabase
    .from('books')
    .select('title, author, cover')
    .eq('id', id)
    .single()

  if (!book) {
    return createOgResponse(<FallbackOgImage />)
  }

  const node = await BookOgImage({
    title: book.title,
    author: book.author,
    cover: book.cover,
    label: 'Səsli Kitab',
  })

  return createOgResponse(node)
}
