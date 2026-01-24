"use client"
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { type Post, type User, type Comment, type Notification, DEFAULT_AVATAR } from '@/lib/social'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth'

// Constants - much shorter timeouts
const SAFETY_TIMEOUT = 3000 // 3 seconds max for initial load

export type SocialState = {
  currentUser: User | null
  users: User[]
  posts: Post[]
  like: (postId: string) => Promise<void>
  addComment: (postId: string, content: string) => Promise<void>
  createPost: (content: string, mentionedBookId?: string, groupId?: string) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  deleteComment: (commentId: string, postId: string) => Promise<void>
  following: string[]
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
  isFollowing: (userId: string) => boolean
  loading: boolean
  loadMorePosts: () => Promise<void>
  hasMorePosts: boolean
  notifications: Notification[]
  unreadCount: number
  markNotificationsAsRead: () => Promise<void>
}

const SocialCtx = createContext<SocialState | null>(null)

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  
  // AuthProvider-dən user al
  const { user: authUser, loading: authLoading } = useAuth()
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load user profile helper
  const loadUserProfile = useCallback(async (userId: string, userMetadata?: any) => {
     let profile = null
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      profile = data
    } catch (e) {
      console.warn('Error fetching profile:', e)
    }

    // Always prefer DB profile if exists
    if (profile) {
      const userData: User = {
        id: profile.id,
        name: profile.full_name || profile.username || 'Anonymous', // Prefer full name
        username: profile.username || 'anonymous',
        avatar: profile.avatar_url || DEFAULT_AVATAR,
        bio: profile.bio,
        joinedAt: profile.updated_at
      }
      setCurrentUser(userData)
      setUsers(prev => {
        const filtered = prev.filter(u => u.id !== userData.id)
        return [userData, ...filtered]
      })

      // Load following list in background
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .then(({ data: follows }) => {
          if (follows) {
            setFollowing(follows.map(f => f.following_id))
          }
        })
      return userData
    } 
    
    // Fallback to auth metadata ONLY if no DB profile
    if (userMetadata) {
      console.log('[Social] Profile missing in DB, using metadata fallback')
      const userData: User = {
        id: userId,
        name: userMetadata.full_name || userMetadata.name || userMetadata.username || 'Anonymous',
        username: userMetadata.username || 'anonymous',
        avatar: userMetadata.avatar_url || userMetadata.picture || DEFAULT_AVATAR,
        bio: '',
        joinedAt: new Date().toISOString()
      }
      setCurrentUser(userData)
      return userData
    }
    return null
  }, [supabase])

  // Load posts helper
  const loadPosts = useCallback(async (authUserId?: string) => {
    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        likes (user_id),
        comments (
          id, user_id, content, created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (postsData && postsData.length > 0) {
      const bookIds = postsData
        .filter(p => p.mentioned_book_id)
        .map(p => p.mentioned_book_id)

      let booksMap: Record<string, any> = {}
      if (bookIds.length > 0) {
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds)
        
        if (books) {
          books.forEach(b => {
            booksMap[b.id] = b
          })
        }
      }

      const mappedPosts: Post[] = postsData.map(p => ({
        id: p.id,
        userId: p.user_id,
        content: p.content,
        createdAt: p.created_at,
        likes: p.likes.length,
        likedByMe: authUserId ? p.likes.some((l: any) => l.user_id === authUserId) : false,
        comments: p.comments.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          content: c.content,
          createdAt: c.created_at
        })),
        mentionedBookId: p.mentioned_book_id,
        mentionedBook: p.mentioned_book_id && booksMap[p.mentioned_book_id] ? {
           id: booksMap[p.mentioned_book_id].id,
           title: booksMap[p.mentioned_book_id].title,
           coverUrl: booksMap[p.mentioned_book_id].cover || booksMap[p.mentioned_book_id].cover_url,
           author: booksMap[p.mentioned_book_id].author
        } : undefined,
        groupId: p.group_id
      }))
      setPosts(mappedPosts)
    }
  }, [supabase])

  // Sadələşdirilmiş initialization - AuthProvider-dən user-i izləyir
  useEffect(() => {
    let mounted = true
    let cleanup: (() => void) | undefined

    const initialize = async () => {
      // AuthProvider hələ yüklənir - gözlə
      if (authLoading) {
        return
      }

      // AuthProvider-dən user varsa, profile, posts və notifications yüklə
      if (authUser) {
        console.log('[Social] AuthProvider user detected:', authUser.email)
        await loadUserProfile(authUser.id, authUser.user_metadata)
        await loadPosts(authUser.id)
        
        // Load notifications
        const { data: notifs } = await supabase
          .from('notifications')
          .select(`*, actor:profiles!actor_id(username, avatar_url)`)
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (notifs) {
           const mappedNotifs = notifs.map((n: any) => ({
             ...n,
             actor: n.actor ? {
               username: n.actor.username,
               avatar_url: n.actor.avatar_url || DEFAULT_AVATAR
             } : undefined
           }))
           setNotifications(mappedNotifs)
           setUnreadCount(mappedNotifs.filter((n: any) => !n.read).length)
        }

        // Subscribe to notifications
        const channel = supabase
        .channel('social_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${authUser.id}`,
          },
          async (payload) => {
             // Fetch new notification details
             const { data: newNotif } = await supabase
               .from('notifications')
               .select(`*, actor:profiles!actor_id(username, avatar_url)`)
               .eq('id', payload.new.id)
               .single()
             
             if (newNotif) {
                const mappedNew = {
                  ...newNotif,
                  actor: newNotif.actor ? {
                    username: newNotif.actor.username,
                    avatar_url: newNotif.actor.avatar_url || DEFAULT_AVATAR
                  } : undefined
                }
                setNotifications(prev => [mappedNew, ...prev])
                setUnreadCount(prev => prev + 1)
             }
          }
        )
        .subscribe()

        cleanup = () => {
          supabase.removeChannel(channel)
        }

      } else {
        console.log('[Social] No user from AuthProvider')
        setCurrentUser(null)
        setFollowing([])
        // Posts hələ də yükləyə bilərik (public posts)
        await loadPosts()
      }

      // Load other profiles in background
      supabase.from('profiles').select('*').order('updated_at', { ascending: false }).limit(10)
        .then(({ data: profiles }) => {
          if (profiles && mounted) {
            const mappedUsers: User[] = profiles.map(p => ({
              id: p.id,
              name: p.username || 'Anonymous',
              username: p.username || 'anonymous',
              avatar: p.avatar_url || DEFAULT_AVATAR,
              bio: p.bio,
              joinedAt: p.updated_at
            }))
            
            setUsers(prev => {
              const currentUserId = prev[0]?.id
              const filtered = mappedUsers.filter(u => u.id !== currentUserId)
              return currentUserId ? [prev[0], ...filtered] : mappedUsers
            })
          }
        })

      if (mounted) {
        setLoading(false)
      }
    }

    initialize()

    return () => {
      mounted = false
      if (cleanup) cleanup()
    }
  }, [authUser, authLoading, supabase, loadUserProfile, loadPosts])


  const like = async (postId: string) => {
    if (!currentUser) return
    
    const post = posts.find(p => p.id === postId)
    if (!post) return

    if (post.likedByMe) {
      // Unlike
      const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUser.id })
      if (!error) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes - 1, likedByMe: false } : p))
      }
    } else {
      // Like
      const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id })
      if (!error) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1, likedByMe: true } : p))
      }
    }
  }

  const addComment = async (postId: string, content: string) => {
    if (!currentUser) return
    
    const { data, error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUser.id,
      content
    }).select().single()

    if (!error && data) {
      const newComment: Comment = {
        id: data.id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at
      }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    }
  }

  const createPost = async (content: string, mentionedBookId?: string, groupId?: string) => {
    if (!currentUser) return

    const { data, error } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      content,
      mentioned_book_id: mentionedBookId,
      group_id: groupId
    }).select().single()

    if (!error && data) {
      let mentionedBookDetails = undefined
      if (mentionedBookId) {
         const { data: b } = await supabase.from('books').select('*').eq('id', mentionedBookId).single()
         if (b) {
            mentionedBookDetails = {
              id: b.id,
              title: b.title,
              coverUrl: b.cover || b.cover_url,
              author: b.author
            }
         }
      }

      const newPost: Post = {
        id: data.id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at,
        likes: 0,
        likedByMe: false,
        comments: [],
        mentionedBookId: data.mentioned_book_id,
        mentionedBook: mentionedBookDetails,
        groupId: data.group_id
      }
      setPosts(prev => [newPost, ...prev])
    }
  }

  const deletePost = async (postId: string) => {
    if (!currentUser) return
    
    // Optimistic update
    setPosts(prev => prev.filter(p => p.id !== postId))

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error deleting post:', error)
    }
  }

  const deleteComment = async (commentId: string, postId: string) => {
    if (!currentUser) return

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.filter(c => c.id !== commentId)
        }
      }
      return p
    }))

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const loadMorePosts = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        likes (user_id),
        comments (
          id, user_id, content, created_at
        )
      `)
      .order('created_at', { ascending: false })
      .range(posts.length, posts.length + 9)

    if (postsData && postsData.length > 0) {
      // Fetch mentioned books for new batch
      const bookIds = postsData
        .filter(p => p.mentioned_book_id)
        .map(p => p.mentioned_book_id)

      let booksMap: Record<string, any> = {}
      if (bookIds.length > 0) {
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds)
        
        if (books) {
          books.forEach(b => {
            booksMap[b.id] = b
          })
        }
      }

      const mappedPosts: Post[] = postsData.map(p => ({
        id: p.id,
        userId: p.user_id,
        content: p.content,
        createdAt: p.created_at,
        likes: p.likes.length,
        likedByMe: authUser ? p.likes.some((l: any) => l.user_id === authUser.id) : false,
        comments: p.comments.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          content: c.content,
          createdAt: c.created_at
        })),
        mentionedBookId: p.mentioned_book_id,
        mentionedBook: p.mentioned_book_id && booksMap[p.mentioned_book_id] ? {
            id: booksMap[p.mentioned_book_id].id,
            title: booksMap[p.mentioned_book_id].title,
            coverUrl: booksMap[p.mentioned_book_id].cover || booksMap[p.mentioned_book_id].cover_url,
            author: booksMap[p.mentioned_book_id].author
        } : undefined,
        groupId: p.group_id
      }))
      setPosts(prev => [...prev, ...mappedPosts])
    }
  }

  const hasMorePosts = posts.length % 10 === 0 && posts.length > 0

  const follow = async (userId: string) => {
    if (!currentUser) return
    
    // Optimistic update
    setFollowing(prev => [...prev, userId])
    
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUser.id,
        following_id: userId
      })
      
    if (error) {
      // Revert on error
      setFollowing(prev => prev.filter(id => id !== userId))
      console.error('Error following user:', error)
    }
  }

  const unfollow = async (userId: string) => {
    if (!currentUser) return

    // Optimistic update
    setFollowing(prev => prev.filter(id => id !== userId))
    
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      
    if (error) {
      // Revert on error
      setFollowing(prev => [...prev, userId])
      console.error('Error unfollowing user:', error)
    }
  }

  const isFollowing = (userId: string) => following.includes(userId)

  const markNotificationsAsRead = async () => {
    if (!currentUser || unreadCount === 0) return

    const ids = notifications.filter(n => !n.read).map(n => n.id)
    
    // Optimistic update
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

    if (ids.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', ids)
    }
  }

  const value: SocialState = useMemo(() => ({
    currentUser,
    users,
    posts,
    like,
    addComment,
    createPost,
    deletePost,
    deleteComment,
    following,
    follow,
    unfollow,
    isFollowing,
    loading,
    loadMorePosts,
    hasMorePosts,
    notifications,
    unreadCount,
    markNotificationsAsRead
  }), [currentUser, users, posts, following, loading, notifications, unreadCount])

  return <SocialCtx.Provider value={value}>{children}</SocialCtx.Provider>
}

export function useSocial() {
  const ctx = useContext(SocialCtx)
  if (!ctx) throw new Error('useSocial must be used within SocialProvider')
  return ctx
}
