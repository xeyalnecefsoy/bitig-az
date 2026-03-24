import { createClient } from './client'
import type { Book } from '@/lib/data'
import type { Post, User, Comment } from '@/lib/social'

export async function getBooks(): Promise<Book[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('books').select('*')
  if (error) {
    console.error('Error fetching books:', error)
    return []
  }
  return data as Book[]
}

export async function getPosts(): Promise<Post[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url, bio),
      comments (
        id,
        user_id,
        content,
        created_at,
        parent_comment_id,
        profiles:user_id (id, username, avatar_url)
      ),
      likes (user_id)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data.map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    content: p.content,
    linkPreview: p.link_preview_url
      ? {
          url: p.link_preview_url,
          title: p.link_preview_title ?? p.link_preview_url,
          description: p.link_preview_description ?? undefined,
          imageUrl: p.link_preview_image_url ?? undefined,
          siteName: p.link_preview_site_name ?? undefined,
          type: p.link_preview_type ?? undefined,
        }
      : undefined,
    createdAt: p.created_at,
    likes: p.likes.length,
    comments: p.comments.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      parentCommentId: c.parent_comment_id ?? null,
    })),
    // We'll need to handle 'likedByMe' in the component or a separate call if we want it per user
  }))
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url, bio),
      comments (
        id,
        user_id,
        content,
        created_at,
        parent_comment_id,
        profiles:user_id (id, username, avatar_url)
      ),
      likes (user_id)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    linkPreview: data.link_preview_url
      ? {
          url: data.link_preview_url,
          title: data.link_preview_title ?? data.link_preview_url,
          description: data.link_preview_description ?? undefined,
          imageUrl: data.link_preview_image_url ?? undefined,
          siteName: data.link_preview_site_name ?? undefined,
          type: data.link_preview_type ?? undefined,
        }
      : undefined,
    createdAt: data.created_at,
    likes: data.likes.length,
    comments: data.comments.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      parentCommentId: c.parent_comment_id ?? null,
    })),
  }
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return {
    id: data.id,
    name: data.username || 'Unknown',
    username: data.username || 'unknown',
    avatar: data.avatar_url || '',
    bio: data.bio,
    joinedAt: data.updated_at, // or created_at if we had it
  }
}
