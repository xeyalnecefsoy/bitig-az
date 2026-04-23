import { createOgResponse, GroupOgImage, FallbackOgImage } from '@/lib/og-image'
import { getGroup } from '@/lib/supabase/server-api'

export const alt = 'Group on Bitig.az'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const group = await getGroup(slug)

  if (!group) {
    return createOgResponse(<FallbackOgImage />)
  }

  const node = await GroupOgImage({
    name: group.name,
    description: group.description || undefined,
    icon: group.icon_url,
    cover: group.cover_url,
    members: group.members_count,
  })

  return createOgResponse(node)
}
