import { createOgResponse, BookOgImage, FallbackOgImage } from '@/lib/og-image'
import { books } from '@/lib/data'

export const alt = 'Book on Bitig.az'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const book = books.find((b) => b.id === id)

  if (!book) {
    return createOgResponse(<FallbackOgImage />)
  }

  const node = await BookOgImage({
    title: book.title,
    author: book.author,
    cover: book.cover,
    label: 'Kitab',
  })

  return createOgResponse(node)
}
