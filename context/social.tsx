"use client"
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Post, User, Comment } from '@/lib/social'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export type SocialState = {
  currentUser: User | null
  users: User[]
  posts: Post[]
  like: (postId: string) => Promise<void>
  addComment: (postId: string, content: string) => Promise<void>
  createPost: (content: string) => Promise<void>
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
    async function init() {
      // 1. Get Auth User FIRST (fastest check)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      // 2. If user is authenticated, fetch their profile immediately
      if (authUser) {
        const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        if (myProfile) {
          const currentUserData = {
            id: myProfile.id,
            name: myProfile.username || 'Anonymous',
            username: myProfile.username || 'anonymous',
            avatar: myProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myProfile.id}`,
            bio: myProfile.bio,
            joinedAt: myProfile.updated_at
          }
          // Update currentUser, users, and loading in one batch to prevent flash
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
          
          setLoading(false)
        } else {
          // Profile not found, but user is authenticated
          setLoading(false)
        }
      } else {
        // No authenticated user
        setLoading(false)
      }
      
      // 4. Fetch other profiles in background (reduced from 50 to 10 for performance)
      const { data: profiles } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false }).limit(10)
      if (profiles) {
        const mappedUsers: User[] = profiles.map(p => ({
          id: p.id,
          name: p.username || 'Anonymous',
          username: p.username || 'anonymous',
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          bio: p.bio,
          joinedAt: p.updated_at
        }))
        
        // Merge with current user, avoiding duplicates
        setUsers(prev => {
          const currentUserId = prev[0]?.id
          const filtered = mappedUsers.filter(u => u.id !== currentUserId)
          return currentUserId ? [prev[0], ...filtered] : mappedUsers
        })
      }

      // 5. Get Posts in background (reduced from 20 to 10 for initial load)
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

      if (postsData) {
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
          }))
        }))
        setPosts(mappedPosts)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

  const createPost = async (content: string) => {
    if (!currentUser) return

    const { data, error } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      content
    }).select().single()

    if (!error && data) {
      const newPost: Post = {
        id: data.id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at,
        likes: 0,
        likedByMe: false,
        comments: []
      }
      setPosts(prev => [newPost, ...prev])
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
        }))
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
