import { createOgResponse, BlogOgImage, FallbackOgImage } from '@/lib/og-image'
import { getSeoGuideBySlug } from '@/lib/seoGuides'

export const alt = 'Blog article on Bitig.az'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const guide = getSeoGuideBySlug(slug)

  if (!guide) {
    return createOgResponse(<FallbackOgImage />)
  }

  const node = await BlogOgImage({
    title: guide.title[locale as 'az' | 'en'] || guide.title.az,
    excerpt: guide.excerpt[locale as 'az' | 'en'] || guide.excerpt.az,
    image: guide.image,
    readingMinutes: guide.readingMinutes,
  })

  return createOgResponse(node)
}
