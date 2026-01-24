export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  joinedAt?: string;
  followers?: number;
  following?: number;
};

export type Notification = {
  id: string
  type: 'like' | 'comment' | 'follow' | 'system'
  actor_id: string
  entity_id: string
  read: boolean
  created_at: string
  actor?: {
    username: string
    avatar_url: string
  }
}

export type Comment = {
  id: string
  userId: string
  content: string
  createdAt: string
}

export type Group = {
  id: string
  name: string
  slug: string
  description?: string
  icon_url?: string
  cover_url?: string
  is_official: boolean
  members_count: number
  posts_count: number
  created_at: string
  is_member?: boolean // For UI logic
}

export type Post = {
  id: string
  userId: string
  content: string
  createdAt: string
  likes: number
  likedByMe?: boolean
  comments: Comment[]
  mentionedBookId?: string
  mentionedBook?: {
    id: string
    title: string
    coverUrl?: string
    author?: string
  }
  groupId?: string
  group?: {
    id: string
    name: string
    slug: string
    icon_url?: string
  }
}

// Neutral, professional default avatar (Silhouette)
export const DEFAULT_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23E5E5E5'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`

export const users: User[] = []
export const posts: Post[] = []

export function getUser(id: string) {
  return users.find(u => u.id === id)
}

export function getPost(id: string) {
  return posts.find(p => p.id === id)
}
