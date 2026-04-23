import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SocialPostFull } from '@/components/social/SocialPostFull'
import { createClient } from '@/lib/supabase/server'
import { Post, Comment } from '@/lib/social'

function excerpt(input: string, max = 160): string {
  const text = input.replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}...`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: postData } = await supabase
    .from('posts')
    .select('id, user_id, content, image_urls, link_preview_image_url, created_at')
    .eq('id', id)
    .single()

  if (!postData) {
    return {}
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', postData.user_id)
    .single()

  const authorName = profile?.full_name || profile?.username || 'Bitig'
  const text = excerpt(postData.content || '')
  const title = text ? `${authorName}: ${excerpt(text, 80)}` : `${authorName} on Bitig`
  const description = text || 'Bitig paylaşımı'
  const baseUrl = 'https://bitig.az'
  const postUrl = `${baseUrl}/${locale}/social/post/${id}`
  const image =
    postData.image_urls?.[0] || postData.link_preview_image_url || `${baseUrl}/og.png`

  return {
    title,
    description,
    alternates: { canonical: postUrl },
    openGraph: {
      type: 'article',
      url: postUrl,
      title,
      description,
      siteName: 'Bitig',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@bitigaz',
      site: '@bitigaz',
    },
  }
}

export default async function SocialPostPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch post
  const { data: postData } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!postData) return notFound()

  // Fetch comments
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  // Fetch likes count
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', id)

  // Check if liked by current user
  let likedByMe = false
  if (user) {
    const { data: likeData } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()
    likedByMe = !!likeData
  }

  const post: Post = {
    id: postData.id,
    userId: postData.user_id,
    content: postData.content,
    imageUrls: postData.image_urls ?? undefined,
    linkPreview: postData.link_preview_url
      ? {
          url: postData.link_preview_url,
          title: postData.link_preview_title ?? postData.link_preview_url,
          description: postData.link_preview_description ?? undefined,
          imageUrl: postData.link_preview_image_url ?? undefined,
          siteName: postData.link_preview_site_name ?? undefined,
          type: postData.link_preview_type ?? undefined,
        }
      : undefined,
    createdAt: postData.created_at,
    likes: likesCount || 0,
    likedByMe,
    comments: (commentsData || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      updatedAt: c.updated_at ?? null,
      parentCommentId: c.parent_comment_id ?? null,
    }))
  }

  return (
    <section className="container-max py-6 sm:py-8">
      <SocialPostFull initialPost={post} />
    </section>
  )
}
