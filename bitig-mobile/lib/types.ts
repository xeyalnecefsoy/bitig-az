// Shared types matching the web app's data structures

export interface Book {
  id: string
  title: string
  author: string
  cover: string | null
  cover_url?: string | null
  genre: string | null
  description: string | null
  price: number
  original_price?: number | null
  duration: number | null
  /** Human-readable length from DB, e.g. "21h 2m" */
  length?: string | null
  rating: number | null
  voice_type: string | null
  has_ambience?: boolean | null
  has_sound_effects?: boolean | null
  created_at: string
}

export interface BookTrack {
  id: string
  book_id: string
  title: string
  audio_url: string | null
  r2_key?: string | null
  duration: number
  position: number
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

/** Embedded original post for quote reposts */
export interface QuotedPostEmbed {
  id: string
  userId: string
  content: string
  imageUrls?: string[]
  createdAt: string
}

export interface Post {
  id: string
  userId: string
  content: string
  imageUrls?: string[]
  createdAt: string
  updatedAt?: string | null
  status?: string
  rejectedAt?: string | null
  likes: number
  likedByMe?: boolean
  comments: Comment[]
  poll?: Poll
  quotedPostId?: string
  quotedPost?: QuotedPostEmbed
  mentionedBookId?: string
  mentionedBook?: {
    id: string
    title: string
    coverUrl?: string
    author?: string
  }
  groupId?: string
  group?: Group
}

export interface Comment {
  id: string
  userId: string
  content: string
  createdAt: string
  updatedAt?: string | null
}

export interface PollOption {
  id: string
  text: string
  votesCount: number
  hasVoted: boolean
}

export interface Poll {
  expiresAt: string
  hasExpired: boolean
  options: PollOption[]
  totalVotes: number
}

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'system' | 'mod_rejected' | 'mod_deleted'
  actor_id: string
  entity_id: string
  read: boolean
  created_at: string
  actor?: {
    username: string
    avatar_url: string | null
  }
}

export interface Group {
  id: string
  name: string
  slug: string
  description?: string | null
  icon_url?: string | null
  cover_url?: string | null
  is_official: boolean
  members_count: number
  posts_count: number
  created_at: string
  is_member?: boolean
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
