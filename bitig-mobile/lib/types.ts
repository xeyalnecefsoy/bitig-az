// Shared types matching the web app's data structures

export interface Book {
  id: string
  title: string
  author: string
  cover: string | null
  genre: string | null
  description: string | null
  price: number
  duration: number | null
  rating: number | null
  voice_type: string | null
  created_at: string
}

export interface BookTrack {
  id: string
  book_id: string
  title: string
  audio_url: string
  duration: number
  track_number: number
}

export interface UserBook {
  id: string
  user_id: string
  book_id: string
  status: 'reading' | 'completed' | 'want_to_read'
  created_at: string
  book?: Book
}

export interface User {
  id: string
  name: string
  username: string
  avatar: string
  bio?: string
  followers?: number
  following?: number
}

export interface Post {
  id: string
  userId: string
  content: string
  imageUrls?: string[]
  createdAt: string
  likes: number
  likedByMe?: boolean
  comments: Comment[]
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

export interface Comment {
  id: string
  userId: string
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  last_message: string | null
  updated_at: string
  otherUser: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
  status: string
}

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  message_type: 'text' | 'book_share' | 'post_share'
  entity_id: string | null
  created_at: string
}

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string
  banner_url?: string | null
  created_at?: string
}
