import { createOgResponse, ProfileOgImage, FallbackOgImage } from '@/lib/og-image'
import { createClient } from '@/lib/supabase/server'

export const alt = 'Profile on Bitig.az'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  let query = supabase.from('profiles').select('full_name, username, bio, avatar_url, banner_url, books_read, reviews_count')
  if (isUuid) {
    query = query.eq('id', id)
  } else {
    query = query.eq('username', id)
  }

  const { data: profile } = await query.single()

  if (!profile) {
    return createOgResponse(<FallbackOgImage />)
  }

  const statsParts: string[] = []
  if (profile.books_read) statsParts.push(`${profile.books_read} kitab`)
  if (profile.reviews_count) statsParts.push(`${profile.reviews_count} rəy`)
  const stats = statsParts.length > 0 ? statsParts.join('  ·  ') : 'Bitig.az profili'

  const node = await ProfileOgImage({
    name: profile.full_name || profile.username || 'Bitig İstifadəçisi',
    username: profile.username || undefined,
    bio: profile.bio || undefined,
    avatar: profile.avatar_url,
    banner: profile.banner_url,
    stats,
  })

  return createOgResponse(node)
}
