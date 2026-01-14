import { createClient as createServerClient } from './server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { Book } from '@/lib/data'
import type { Post, User, Group } from '@/lib/social'

// Public client for cached/static data (no cookies needed)
function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createBrowserClient(url, key)
}

// For public data - uses public client (cacheable)
export async function getBooks(limit?: number): Promise<Book[]> {
  const supabase = getPublicClient()
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

// For public data - uses public client (cacheable)
export async function getGroups(): Promise<Group[]> {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('members_count', { ascending: false })

  if (error) {
    console.error('Error fetching groups:', error)
    return []
  }

  return data as Group[]
}

// For public data - uses public client (cacheable)
export async function getGroup(slug: string): Promise<Group | null> {
  const supabase = getPublicClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching group:', error)
    return null
  }

  return data as Group
}

// Needs auth context - uses server client with cookies
export async function getPost(id: string): Promise<Post | null> {
  const supabase = await createServerClient()
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

  return data as Post
}

// Needs auth context - uses server client with cookies
export async function getUser(id: string): Promise<User | null> {
  const supabase = await createServerClient()
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
    name: data.username || 'Anonymous',
    username: data.username || 'anonymous',
    avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
    bio: data.bio,
    joinedAt: data.updated_at
  } as User
}
