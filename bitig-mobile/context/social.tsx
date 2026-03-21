import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { resolveAvatarUrl } from '@/lib/avatar'
import type { User, Post, Comment, QuotedPostEmbed } from '@/lib/types'

type PollOptionLike = {
  id: string
  text: string
  votesCount: number
  hasVoted: boolean
}

type PollLike = {
  expiresAt: string
  hasExpired: boolean
  totalVotes: number
  options: PollOptionLike[]
}

type PostWithExtras = Post & {
  updatedAt?: string | null
  status?: string
  rejectedAt?: string | null
  poll?: PollLike
}

type NotificationLike = {
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

export type SocialState = {
  currentUser: User | null
  users: User[]
  posts: PostWithExtras[]
  following: string[]
  loading: boolean
  hasMorePosts: boolean

  like: (postId: string) => Promise<void>
  addComment: (postId: string, content: string) => Promise<void>
  createPost: (
    content: string,
    mentionedBookId?: string,
    groupId?: string,
    imageUrls?: string[],
    parentPostId?: string,
    pollOptions?: string[],
    pollDurationHours?: number,
    quotedPostId?: string
  ) => Promise<string | undefined>

  voteOnPoll: (postId: string, optionId: string) => Promise<void>
  editPost: (postId: string, content: string) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  editComment: (commentId: string, postId: string, content: string) => Promise<void>
  deleteComment: (commentId: string, postId: string, postOwnerId?: string) => Promise<void>

  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
  isFollowing: (userId: string) => boolean

  loadMorePosts: () => Promise<void>
  loadForYouPosts: () => Promise<void>
  loadFeedPosts: () => Promise<void>
  /** Merge enriched post rows into state so profile / detail screens can use SocialPostCard + like(). */
  mergePostsFromSupabaseRows: (rows: any[]) => Promise<PostWithExtras[]>

  notifications: NotificationLike[]
  unreadCount: number
  markNotificationsAsRead: () => Promise<void>
}

const SocialCtx = createContext<SocialState | null>(null)

function mapProfileToUser(p: any): User {
  return {
    id: p.id,
    name: p.full_name || p.username || 'Anonymous',
    username: p.username || 'anonymous',
    avatar: resolveAvatarUrl(p.avatar_url, p.username || p.full_name || p.id),
    bio: p.bio,
    joinedAt: p.updated_at,
  } as User
}

function parseImagePathFromPostImagesUrl(url: string): string | null {
  if (!url) return null
  const marker = 'post-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const after = url.slice(idx + marker.length)
  if (!after) return null
  return after.split('?')[0]
}

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading: authLoading } = useAuth()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<PostWithExtras[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [notifications, setNotifications] = useState<NotificationLike[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const usersRef = useRef<User[]>([])
  const postsRef = useRef<PostWithExtras[]>([])
  useEffect(() => {
    usersRef.current = users
  }, [users])
  useEffect(() => {
    postsRef.current = posts
  }, [posts])

  const fetchAndMergeUsers = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return

    const currentUsers = usersRef.current
    const missingIds = userIds.filter(id => !currentUsers.find(u => u.id === id))
    if (missingIds.length === 0) return

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', missingIds)

    if (profiles && profiles.length > 0) {
      const newUsers: User[] = profiles.map(mapProfileToUser)
      setUsers(prev => {
        const existingIds = new Set(prev.map(u => u.id))
        const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.id))
        return [...prev, ...uniqueNewUsers]
      })
    }
  }, [])

  const loadUserProfile = useCallback(
    async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) return

      const userData = mapProfileToUser(profile)
      setCurrentUser(userData)
      setUsers(prev => {
        const filtered = prev.filter(u => u.id !== userData.id)
        return [userData, ...filtered]
      })

      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      setFollowing((follows || []).map((f: any) => f.following_id))
    },
    [],
  )

  const loadBooksMap = useCallback(async (bookIds: string[]) => {
    if (bookIds.length === 0) return {}
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .in('id', bookIds)

    const booksMap: Record<string, any> = {}
    if (books) {
      books.forEach(b => {
        booksMap[b.id] = b
      })
    }
    return booksMap
  }, [])

  const mapPoll = useCallback(
    (p: any, authUserId?: string | null): PollLike | undefined => {
      // Supabase sometimes returns arrays for one-to-one relationships.
      const poll = Array.isArray(p?.polls) ? p.polls[0] : p?.polls
      if (!poll) return undefined

      const hasExpired = new Date(poll.expires_at) < new Date()
      let totalVotes = 0
      const options: PollOptionLike[] = (poll.poll_options || []).map((opt: any) => {
        const votes = opt.poll_votes || []
        totalVotes += votes.length
        return {
          id: opt.id,
          text: opt.text,
          votesCount: votes.length,
          hasVoted: authUserId ? votes.some((v: any) => v.user_id === authUserId) : false,
        }
      })

      return {
        expiresAt: poll.expires_at,
        hasExpired,
        totalVotes,
        options,
      }
    },
    [],
  )

  const loadQuotedMap = useCallback(
    async (postsData: any[], userIds: Set<string>): Promise<Record<string, QuotedPostEmbed>> => {
      const quotedIds = [...new Set(postsData.map((p: any) => p.quoted_post_id).filter(Boolean))]
      if (quotedIds.length === 0) return {}
      const { data: quotedRows } = await supabase
        .from('posts')
        .select('id, user_id, content, image_urls, created_at')
        .in('id', quotedIds)
      const quotedMap: Record<string, QuotedPostEmbed> = {}
      if (quotedRows) {
        for (const q of quotedRows) {
          userIds.add(q.user_id)
          quotedMap[q.id] = {
            id: q.id,
            userId: q.user_id,
            content: q.content,
            imageUrls: q.image_urls ?? undefined,
            createdAt: q.created_at,
          }
        }
      }
      return quotedMap
    },
    [],
  )

  const mapPosts = useCallback(
    async (postsData: any[], authUserId?: string | null): Promise<PostWithExtras[]> => {
      if (!postsData || postsData.length === 0) return []

      const userIds = new Set<string>()
      postsData.forEach(p => {
        if (p.user_id) userIds.add(p.user_id)
        if (Array.isArray(p.comments)) {
          p.comments.forEach((c: any) => {
            if (c.user_id) userIds.add(c.user_id)
          })
        }
      })

      const quotedMap = await loadQuotedMap(postsData, userIds)
      await fetchAndMergeUsers(Array.from(userIds))

      const bookIds = postsData.filter(p => p.mentioned_book_id).map(p => p.mentioned_book_id)
      const booksMap = await loadBooksMap(bookIds)

      const mappedPosts: PostWithExtras[] = postsData.map((p: any) => {
        const mentionedBook =
          p.mentioned_book_id && booksMap[p.mentioned_book_id]
            ? {
                id: booksMap[p.mentioned_book_id].id,
                title: booksMap[p.mentioned_book_id].title,
                coverUrl: booksMap[p.mentioned_book_id].cover || booksMap[p.mentioned_book_id].cover_url,
                author: booksMap[p.mentioned_book_id].author,
              }
            : undefined

        return {
          id: p.id,
          userId: p.user_id,
          content: p.content,
          status: p.status,
          rejectedAt: p.rejected_at,
          updatedAt: p.updated_at,
          imageUrls: p.image_urls ?? undefined,
          parentPostId: p.parent_post_id,
          quotedPostId: p.quoted_post_id ?? undefined,
          quotedPost: p.quoted_post_id ? quotedMap[p.quoted_post_id] : undefined,
          createdAt: p.created_at,
          likes: Array.isArray(p.likes) ? p.likes.length : 0,
          likedByMe: authUserId && Array.isArray(p.likes) ? p.likes.some((l: any) => l.user_id === authUserId) : false,
          comments: Array.isArray(p.comments)
            ? p.comments.map((c: any) => ({
                id: c.id,
                userId: c.user_id,
                content: c.content,
                createdAt: c.created_at,
              }))
            : [],
          mentionedBook,
          groupId: p.group_id ?? undefined,
          // Poll mapping
          poll: mapPoll(p, authUserId),
        }
      })

      return mappedPosts
    },
    [fetchAndMergeUsers, loadBooksMap, mapPoll, loadQuotedMap],
  )

  const mergePostsFromSupabaseRows = useCallback(
    async (rows: any[]): Promise<PostWithExtras[]> => {
      const mapped = await mapPosts(rows, authUser?.id ?? null)
      if (mapped.length === 0) return []
      setPosts(prev => {
        const byId = new Map(prev.map(p => [p.id, p]))
        for (const p of mapped) byId.set(p.id, p)
        return Array.from(byId.values())
      })
      return mapped
    },
    [authUser?.id, mapPosts],
  )

  const loadPosts = useCallback(
    async (authUserId?: string | null) => {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          likes (user_id),
          comments (
            id, user_id, content, created_at
          ),
          polls (
            expires_at,
            poll_options (
              id, text,
              poll_votes (user_id)
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error loading posts:', error)
        setPosts([])
        return
      }

      const mapped = await mapPosts(postsData || [], authUserId ?? null)
      setPosts(mapped)
    },
    [mapPosts],
  )

  const loadForYouPosts = useCallback(async () => {
    const userIdToUse = authUser?.id || currentUser?.id
    if (!userIdToUse) {
      await loadPosts()
      return
    }

    // RPC returns post rows/ids; we then re-fetch full details for mapping consistency.
    const { data: recData, error } = await (supabase as any).rpc('get_recommended_posts_v1', { p_user_id: userIdToUse }).limit(15)
    if (error) {
      console.error('Error loading recommended posts:', error)
      await loadPosts(userIdToUse)
      return
    }

    if (!recData || recData.length === 0) {
      setPosts([])
      return
    }

    const postIds: string[] = (recData as any[]).map((p: any) => p.id)
    const { data: enriched } = await supabase
      .from('posts')
      .select(`
        *,
        likes (user_id),
        comments (
            id, user_id, content, created_at
        ),
        polls (
          expires_at,
          poll_options (
            id, text,
            poll_votes (user_id)
          )
        )
      `)
      .in('id', postIds)

    const enrichedMap = new Map((enriched || []).map((p: any) => [p.id, p]))
    const ordered = postIds.map(id => enrichedMap.get(id)).filter(Boolean)

    const mapped = await mapPosts(ordered as any[], userIdToUse)
    setPosts(mapped)
  }, [authUser?.id, currentUser?.id, loadPosts, mapPosts])

  const loadFeedPosts = useCallback(async () => {
    await loadPosts(authUser?.id ?? null)
  }, [authUser?.id, loadPosts])

  const loadMorePosts = useCallback(async () => {
    if (posts.length === 0) {
      await loadPosts(authUser?.id ?? null)
      return
    }

    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        *,
        likes (user_id),
        comments (
            id, user_id, content, created_at
        ),
        polls (
          expires_at,
          poll_options (
            id, text,
            poll_votes (user_id)
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(posts.length, posts.length + 9)

    if (error) {
      console.error('Error loading more posts:', error)
      return
    }

    const mapped = await mapPosts(postsData || [], authUser?.id ?? null)
    setPosts(prev => [...prev, ...mapped])
  }, [authUser?.id, loadPosts, mapPosts, posts.length])

  const hasMorePosts = posts.length > 0 && posts.length % 10 === 0

  useEffect(() => {
    let mounted = true
    const initialize = async () => {
      try {
        if (authLoading) return

        if (authUser) {
          await loadUserProfile(authUser.id)
          await loadPosts(authUser.id)
          // Notifications (optional for now)
          const { data: notifs } = await supabase
            .from('notifications')
            .select(`*, actor:profiles!actor_id(username, avatar_url)`)
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .limit(20)

          if (mounted && notifs) {
            const mappedNotifs: NotificationLike[] = (notifs as any[]).map((n: any) => ({
              ...n,
              actor: n.actor
                ? {
                    username: n.actor.username,
                    avatar_url: n.actor.avatar_url,
                  }
                : undefined,
            }))
            setNotifications(mappedNotifs.slice(0, 30))
            setUnreadCount(mappedNotifs.filter((n: any) => !n.read).length)
          }
        } else {
          setCurrentUser(null)
          setFollowing([])
          await loadPosts(null)
          setNotifications([])
          setUnreadCount(0)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initialize()
    return () => {
      mounted = false
    }
  }, [authLoading, authUser, loadPosts, loadUserProfile])

  const like = useCallback(
    async (postId: string) => {
      if (!currentUser) return

      const post = posts.find(p => p.id === postId)
      if (!post) return

      try {
        if (post.likedByMe) {
          const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUser.id })
          if (error) throw error
          setPosts(prev =>
            prev.map(p => (p.id === postId ? { ...p, likedByMe: false, likes: Math.max(0, p.likes - 1) } : p)),
          )
        } else {
          const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id })
          if (error) throw error
          setPosts(prev => prev.map(p => (p.id === postId ? { ...p, likedByMe: true, likes: p.likes + 1 } : p)))
        }
      } catch (e: any) {
        console.error('Error liking post:', e)
      }
    },
    [currentUser, posts],
  )

  const addComment = useCallback(
    async (postId: string, content: string) => {
      if (!currentUser) return
      const safe = content.trim()
      if (!safe) return

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: safe,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding comment:', error)
        Alert.alert('Xəta', error.message)
        return
      }

      const newComment: Comment = {
        id: data.id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at,
      } as Comment

      setPosts(prev => prev.map(p => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p)))
    },
    [currentUser],
  )

  const createPost = useCallback(
    async (
      content: string,
      mentionedBookId?: string,
      groupId?: string,
      imageUrls?: string[],
      parentPostId?: string,
      pollOptions?: string[],
      pollDurationHours?: number,
      quotedPostId?: string,
    ): Promise<string | undefined> => {
      if (!currentUser) return undefined

      const safeContent = content.trim() === '' ? ' ' : content

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          content: safeContent,
          image_urls: imageUrls,
          parent_post_id: parentPostId,
          quoted_post_id: quotedPostId ?? null,
          mentioned_book_id: mentionedBookId,
          group_id: groupId,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating post:', error)
        Alert.alert('Xəta', 'Paylaşım edilərkən xəta baş verdi')
        return undefined
      }

      const newPostId: string = data.id

      let quotedEmbed: QuotedPostEmbed | undefined
      if (quotedPostId) {
        const orig = postsRef.current.find(p => p.id === quotedPostId)
        if (orig) {
          quotedEmbed = {
            id: orig.id,
            userId: orig.userId,
            content: orig.content,
            imageUrls: orig.imageUrls,
            createdAt: orig.createdAt,
          }
        } else {
          const { data: q } = await supabase
            .from('posts')
            .select('id, user_id, content, image_urls, created_at')
            .eq('id', quotedPostId)
            .single()
          if (q) {
            quotedEmbed = {
              id: q.id,
              userId: q.user_id,
              content: q.content,
              imageUrls: q.image_urls ?? undefined,
              createdAt: q.created_at,
            }
            await fetchAndMergeUsers([q.user_id])
          }
        }
      }

      // Poll creation (optional)
      if (pollOptions && pollOptions.length >= 2 && pollDurationHours) {
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + pollDurationHours)

        const { error: pollError } = await supabase.from('polls').insert({
          post_id: newPostId,
          expires_at: expiresAt.toISOString(),
        })

        if (!pollError) {
          const optionsToInsert = pollOptions.map(opt => ({ post_id: newPostId, text: opt.trim() }))
          const { data: insertedOptions } = await supabase.from('poll_options').insert(optionsToInsert).select()

          if (insertedOptions) {
            // Optimistic: add post into list with empty poll data (accurate values loaded later)
            setPosts(prev => [
              {
                id: newPostId,
                userId: currentUser.id,
                content: safeContent,
                imageUrls,
                parentPostId,
                quotedPostId: quotedPostId ?? undefined,
                quotedPost: quotedEmbed,
                createdAt: data.created_at,
                likes: 0,
                likedByMe: false,
                comments: [],
                mentionedBook: undefined,
                groupId: groupId,
                poll: {
                  expiresAt: expiresAt.toISOString(),
                  hasExpired: false,
                  totalVotes: 0,
                  options: (insertedOptions as any[]).map(o => ({
                    id: o.id,
                    text: o.text,
                    votesCount: 0,
                    hasVoted: false,
                  })),
                },
              } as PostWithExtras,
              ...prev,
            ])
          }
        }
      } else {
        // Optimistic: insert plain post
        setPosts(prev => [
          {
            id: newPostId,
            userId: currentUser.id,
            content: safeContent,
            imageUrls,
            parentPostId,
            quotedPostId: quotedPostId ?? undefined,
            quotedPost: quotedEmbed,
            createdAt: data.created_at,
            likes: 0,
            likedByMe: false,
            comments: [],
            mentionedBook: undefined,
            groupId: groupId,
            poll: undefined,
          } as PostWithExtras,
          ...prev,
        ])
      }

      return newPostId
    },
    [currentUser, fetchAndMergeUsers],
  )

  const voteOnPoll = useCallback(
    async (postId: string, optionId: string) => {
      if (!currentUser) return

      // Optimistic UI update
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId || !p.poll) return p
          const newOptions = p.poll.options.map(opt => {
            if (opt.id === optionId) return { ...opt, votesCount: opt.votesCount + 1, hasVoted: true }
            return opt
          })
          return {
            ...p,
            poll: {
              ...p.poll,
              totalVotes: p.poll.totalVotes + 1,
              options: newOptions,
            },
          }
        }),
      )

      const { error } = await supabase.from('poll_votes').insert({
        post_id: postId,
        option_id: optionId,
        user_id: currentUser.id,
      })

      if (error) {
        console.error('Error voting on poll:', error)
      }
    },
    [currentUser],
  )

  const editPost = useCallback(
    async (postId: string, content: string) => {
      if (!currentUser) return
      const now = new Date().toISOString()

      // Optimistic update
      setPosts(prev => prev.map(p => (p.id === postId ? { ...p, content, updatedAt: now } : p)))

      const { error } = await supabase
        .from('posts')
        .update({ content, updated_at: now })
        .eq('id', postId)
        .eq('user_id', currentUser.id)

      if (error) console.error('Error editing post:', error)
    },
    [currentUser],
  )

  const deletePost = useCallback(
    async (postId: string) => {
      if (!currentUser) return

      const postToDelete = posts.find(p => p.id === postId)
      setPosts(prev => prev.filter(p => p.id !== postId))

      try {
        if (postToDelete?.imageUrls && postToDelete.imageUrls.length > 0) {
          const paths = postToDelete.imageUrls
            .map(parseImagePathFromPostImagesUrl)
            .filter((p): p is string => !!p)

          if (paths.length > 0) {
            await supabase.storage.from('post-images').remove(paths)
          }
        }
      } catch (e) {
        console.error('Error deleting post images:', e)
      }

      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id)
      if (error) console.error('Error deleting post:', error)
    },
    [currentUser, posts],
  )

  const deleteComment = useCallback(
    async (commentId: string, postId: string, postOwnerId?: string) => {
      if (!currentUser) return

      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p
          return { ...p, comments: p.comments.filter(c => c.id !== commentId) }
        }),
      )

      const isPostOwner = postOwnerId && currentUser.id === postOwnerId
      let query = supabase.from('comments').delete().eq('id', commentId)
      if (!isPostOwner) {
        query = query.eq('user_id', currentUser.id)
      }

      const { error } = await query
      if (error) console.error('Error deleting comment:', error)
    },
    [currentUser],
  )

  const editComment = useCallback(
    async (commentId: string, postId: string, content: string) => {
      if (!currentUser) return
      const now = new Date().toISOString()

      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p
          return {
            ...p,
            comments: p.comments.map(c => (c.id === commentId ? { ...c, content } : c)),
          }
        }),
      )

      const { error } = await supabase
        .from('comments')
        .update({ content, updated_at: now })
        .eq('id', commentId)
        .eq('user_id', currentUser.id)

      if (error) console.error('Error editing comment:', error)
    },
    [currentUser],
  )

  const follow = useCallback(
    async (userId: string) => {
      if (!currentUser) return
      setFollowing(prev => [...prev, userId])
      const { error } = await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: userId })
      if (error) {
        setFollowing(prev => prev.filter(id => id !== userId))
        console.error('Error following user:', error)
      }
    },
    [currentUser],
  )

  const unfollow = useCallback(
    async (userId: string) => {
      if (!currentUser) return
      setFollowing(prev => prev.filter(id => id !== userId))
      const { error } = await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId)
      if (error) {
        setFollowing(prev => [...prev, userId])
        console.error('Error unfollowing user:', error)
      }
    },
    [currentUser],
  )

  const isFollowing = useCallback((userId: string) => following.includes(userId), [following])

  const markNotificationsAsRead = useCallback(async () => {
    if (!currentUser || unreadCount === 0) return
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

    if (ids.length > 0) {
      const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids)
      if (error) console.error('Error marking notifications as read:', error)
    }
  }, [currentUser, notifications, unreadCount])

  const value: SocialState = useMemo(
    () => ({
      currentUser,
      users,
      posts,
      following,
      loading,
      hasMorePosts,
      like,
      addComment,
      createPost,
      voteOnPoll,
      editPost,
      deletePost,
      editComment,
      deleteComment,
      follow,
      unfollow,
      isFollowing,
      loadMorePosts,
      loadForYouPosts,
      loadFeedPosts,
      mergePostsFromSupabaseRows,
      notifications,
      unreadCount,
      markNotificationsAsRead,
    }),
    [
      addComment,
      createPost,
      currentUser,
      deleteComment,
      deletePost,
      editComment,
      editPost,
      editPost,
      following,
      hasMorePosts,
      isFollowing,
      like,
      loadForYouPosts,
      loadFeedPosts,
      loadMorePosts,
      mergePostsFromSupabaseRows,
      loading,
      notifications,
      posts,
      unfollow,
      users,
      unreadCount,
      voteOnPoll,
      follow,
      markNotificationsAsRead,
    ],
  )

  return <SocialCtx.Provider value={value}>{children}</SocialCtx.Provider>
}

export function useSocial() {
  const ctx = useContext(SocialCtx)
  if (!ctx) throw new Error('useSocial must be used within SocialProvider')
  return ctx
}

