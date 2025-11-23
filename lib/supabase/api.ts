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
    createdAt: p.created_at,
    likes: p.likes.length,
    comments: p.comments.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
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
    createdAt: data.created_at,
    likes: data.likes.length,
    comments: data.comments.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
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
