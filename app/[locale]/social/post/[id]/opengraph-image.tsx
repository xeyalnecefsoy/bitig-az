import { createOgResponse, PostOgImage, FallbackOgImage } from '@/lib/og-image'
import { createClient } from '@/lib/supabase/server'

export const alt = 'Post on Bitig.az'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('content, image_urls, link_preview_image_url, user_id')
    .eq('id', id)
    .single()

  if (!post) {
    return createOgResponse(<FallbackOgImage />)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', post.user_id)
    .single()

  const authorName = profile?.full_name || profile?.username || 'Bitig'
  const image = post.image_urls?.[0] || post.link_preview_image_url || null

  const node = await PostOgImage({
    authorName,
    content: post.content || '',
    image,
  })

  return createOgResponse(node)
}
