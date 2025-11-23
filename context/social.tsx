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
      setLoading(true)
      
      // 1. Get Auth User
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      // 2. Get Profiles (limit to recent/active)
      const { data: profiles } = await supabase.from('profiles').select('*').limit(50)
      if (profiles) {
        const mappedUsers: User[] = profiles.map(p => ({
          id: p.id,
          name: p.username || 'Anonymous',
          username: p.username || 'anonymous',
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          bio: p.bio,
          joinedAt: p.updated_at
        }))
        setUsers(mappedUsers)
        
        if (authUser) {
          // If current user is not in the top 50, we might need to fetch them separately
          // But for now, let's check if they are in the list
          const me = mappedUsers.find(u => u.id === authUser.id)
          if (me) {
            setCurrentUser(me)
          } else {
             // Fetch current user specifically if not found
             const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
             if (myProfile) {
                setCurrentUser({
                  id: myProfile.id,
                  name: myProfile.username || 'Anonymous',
                  username: myProfile.username || 'anonymous',
                  avatar: myProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myProfile.id}`,
                  bio: myProfile.bio,
                  joinedAt: myProfile.updated_at
                })
             }
          }
        }
      }

      // 3. Get Posts (limit to 20)
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
        .limit(20)

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

      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Refresh user if needed
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) {
           setCurrentUser({
             id: data.id,
             name: data.username || 'Anonymous',
             username: data.username || 'anonymous',
             avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
             bio: data.bio,
             joinedAt: data.updated_at
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

  const follow = async (userId: string) => {
    // Implement follow logic if you have a 'follows' table. 
    // For now, just local state or mock.
    setFollowing(prev => [...prev, userId])
  }

  const unfollow = async (userId: string) => {
    setFollowing(prev => prev.filter(id => id !== userId))
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
    loading
  }), [currentUser, users, posts, following, loading])

  return <SocialCtx.Provider value={value}>{children}</SocialCtx.Provider>
}

export function useSocial() {
  const ctx = useContext(SocialCtx)
  if (!ctx) throw new Error('useSocial must be used within SocialProvider')
  return ctx
}
