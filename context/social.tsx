"use client"
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Post, User, Comment } from '@/lib/social'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Timeout helper to prevent infinite loading
const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ])
}

// Constants
const AUTH_TIMEOUT = 5000 // 5 seconds for auth check
const DATA_TIMEOUT = 8000 // 8 seconds for data fetching
const SAFETY_TIMEOUT = 10000 // 10 seconds absolute max

export type SocialState = {
  currentUser: User | null
  users: User[]
  posts: Post[]
  like: (postId: string) => Promise<void>
  addComment: (postId: string, content: string) => Promise<void>
  createPost: (content: string, mentionedBookId?: string) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  deleteComment: (commentId: string, postId: string) => Promise<void>
  following: string[]
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
  isFollowing: (userId: string) => boolean
  loading: boolean
  loadMorePosts: () => Promise<void>
  hasMorePosts: boolean
}

const SocialCtx = createContext<SocialState | null>(null)

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    // Safety timeout - always break loading after max time
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, SAFETY_TIMEOUT)

    async function init() {
      try {
        // 1. Get Auth User FIRST (fastest check) with RETRY mechanism
        let { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        // Retry logic: If no user found initially, wait and try again (fixes Vercel timing issues)
        if (!authUser && !authError) {
           console.log("No user found initially, retrying...")
           await new Promise(r => setTimeout(r, 500))
           const retry1 = await supabase.auth.getUser()
           if (retry1.data.user) {
              console.log("User found on retry 1")
              authUser = retry1.data.user
           } else {
              await new Promise(r => setTimeout(r, 1000))
              const retry2 = await supabase.auth.getUser()
              if (retry2.data.user) {
                 console.log("User found on retry 2")
                 authUser = retry2.data.user
              }
           }
        }
      
        // 2. If user is authenticated, fetch their profile immediately
        // 2. If user is authenticated, fetch their profile immediately
        if (authUser) {
          const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
          
          let currentUserData: User;

          if (myProfile) {
            currentUserData = {
              id: myProfile.id,
              name: myProfile.username || 'Anonymous',
              username: myProfile.username || 'anonymous',
              avatar: myProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myProfile.id}`,
              bio: myProfile.bio,
              joinedAt: myProfile.updated_at
            }
          } else {
             // Fallback if profile doesn't exist yet (race condition with trigger)
             currentUserData = {
               id: authUser.id,
               name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
               username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
               avatar: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
               bio: '',
               joinedAt: authUser.created_at
             }
          }
          
          // Update currentUser immediately
          setCurrentUser(currentUserData)
          setUsers([currentUserData])
          
          // Fetch following list
          const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', authUser.id)
          
          if (follows) {
            setFollowing(follows.map(f => f.following_id))
          }
        }
        
        // CRITICAL: Stop loading HERE so the UI becomes interactive
        setLoading(false)
        clearTimeout(safetyTimeout)

        // 3. Background: Fetch other profiles
        supabase.from('profiles').select('*').order('updated_at', { ascending: false }).limit(10)
          .then(({ data: profiles }) => {
            if (profiles) {
              const mappedUsers: User[] = profiles.map(p => ({
                id: p.id,
                name: p.username || 'Anonymous',
                username: p.username || 'anonymous',
                avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
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

        // 4. Background: Get Posts
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
          // Process posts in background
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
            } : undefined
          }))
          setPosts(mappedPosts)
        }
      } catch (error) {
        console.error('Error initializing social context:', error)
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // CRITICAL: Break loading immediately on any auth state change
      // This prevents infinite loading when auth is slow or cookies are delayed
      setLoading(false)
      
      if (session?.user) {
        // Refresh user if needed
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) {
           const userData = {
             id: data.id,
             name: data.username || 'Anonymous',
             username: data.username || 'anonymous',
             avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
             bio: data.bio,
             joinedAt: data.updated_at
           }
           setCurrentUser(userData)
           // Update in users list if exists
           setUsers(prev => {
             const exists = prev.find(u => u.id === data.id)
             if (exists) {
               return prev.map(u => u.id === data.id ? userData : u)
             }
             return [userData, ...prev]
           })
        }
      } else {
        setCurrentUser(null)
      }
    })

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

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

  const createPost = async (content: string, mentionedBookId?: string) => {
    if (!currentUser) return

    const { data, error } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      content,
      mentioned_book_id: mentionedBookId
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
        mentionedBook: mentionedBookDetails
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
      // Revert if error (fetching posts again is safer than keeping snapshot)
      console.error('Error deleting post:', error)
      // Ideally we would revert state, but for simplicty we just reload or show error.
      // Re-fetching this page of posts would be best but let's just log for now.
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
        } : undefined
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
    hasMorePosts
  }), [currentUser, users, posts, following, loading])

  return <SocialCtx.Provider value={value}>{children}</SocialCtx.Provider>
}

export function useSocial() {
  const ctx = useContext(SocialCtx)
  if (!ctx) throw new Error('useSocial must be used within SocialProvider')
  return ctx
}
