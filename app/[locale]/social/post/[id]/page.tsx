import { notFound } from 'next/navigation'
import { SocialPostFull } from '@/components/social/SocialPostFull'
import { createClient } from '@/lib/supabase/server'
import { Post, Comment } from '@/lib/social'

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
    createdAt: postData.created_at,
    likes: likesCount || 0,
    likedByMe,
    comments: (commentsData || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at
    }))
  }

  return (
    <section className="container-max py-6 sm:py-8">
      <SocialPostFull initialPost={post} />
    </section>
  )
}
