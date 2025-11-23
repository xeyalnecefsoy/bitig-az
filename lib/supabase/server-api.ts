import { createClient } from './server'
import type { Book } from '@/lib/data'
import type { Post, User } from '@/lib/social'

export async function getBooks(limit?: number): Promise<Book[]> {
  const supabase = await createClient()
  let query = supabase.from('books').select('*')
  
  if (limit) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching books:', error)
    return []
  }
  return data as Book[]
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient()
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
