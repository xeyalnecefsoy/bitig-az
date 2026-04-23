"use client"
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { type Post, type User, type Comment, type Notification, type QuotedPostEmbed, type LinkPreview } from '@/lib/social'
import { collectSubtreeCommentIds } from '@/lib/commentTree'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth'
import {
  SOCIAL_POST_ENRICHED_SELECT,
  SOCIAL_POST_FEED_SELECT_BARE,
  SOCIAL_POST_FEED_SELECT_FALLBACK,
  SOCIAL_POST_FEED_SELECT_MINIMAL,
} from '@/lib/socialPostSelect'

// Constants - much shorter timeouts
const SAFETY_TIMEOUT = 3000 // 3 seconds max for initial load

/** PostgREST errors often don't enumerate for console — stringify important fields. */
function formatSupabaseError(err: unknown): string {
  if (err == null) return 'null'
  if (typeof err === 'string') return err
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>
    const msg = e.message != null ? String(e.message) : ''
    const code = e.code != null ? String(e.code) : ''
    const details = e.details != null ? String(e.details) : ''
    const hint = e.hint != null ? String(e.hint) : ''
    const parts = [msg && `message: ${msg}`, code && `code: ${code}`, details && `details: ${details}`, hint && `hint: ${hint}`].filter(Boolean)
    if (parts.length) return parts.join(' | ')
  }
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

const FEED_SELECT_TIERS = [
  { label: 'full+comment_likes+polls', select: SOCIAL_POST_ENRICHED_SELECT },
  { label: 'no_comment_likes+polls', select: SOCIAL_POST_FEED_SELECT_FALLBACK },
  { label: 'no_polls', select: SOCIAL_POST_FEED_SELECT_MINIMAL },
  { label: 'bare_comments', select: SOCIAL_POST_FEED_SELECT_BARE },
] as const

/** Try progressively simpler selects until one succeeds (nested embeds often break PostgREST). */
async function runFeedPostQuery(
  /** Returns a PostgREST builder (thenable) with `{ data, error }`. */
  build: (select: string) => PromiseLike<{ data: unknown; error: unknown }>,
) {
  let lastError: unknown
  for (let i = 0; i < FEED_SELECT_TIERS.length; i++) {
    const tier = FEED_SELECT_TIERS[i]
    const res = await build(tier.select)
    if (!res.error) return res
    lastError = res.error
    console.warn(`[Social] Feed select tier ${i + 1}/${FEED_SELECT_TIERS.length} (${tier.label}) failed:`, formatSupabaseError(res.error))
  }
  return { data: null, error: lastError }
}

function mapCommentFromSupabase(c: any, authUserId?: string | null): Comment {
  const cl = Array.isArray(c.comment_likes) ? c.comment_likes : []
  return {
    id: c.id,
    userId: c.user_id,
    content: c.content,
    createdAt: c.created_at,
    updatedAt: c.updated_at ?? null,
    parentCommentId: c.parent_comment_id ?? null,
    likes: cl.length,
    likedByMe: !!(authUserId && cl.some((l: any) => l.user_id === authUserId)),
  }
}

export type SocialState = {
  currentUser: User | null
  users: User[]
  posts: Post[]
  like: (postId: string) => Promise<void>
  likeComment: (commentId: string, postId: string) => Promise<void>
  addComment: (postId: string, content: string, parentCommentId?: string | null) => Promise<void>
  createPost: (content: string, mentionedBookId?: string, groupId?: string, imageUrls?: string[], parentPostId?: string, pollOptions?: string[], pollDurationHours?: number, quotedPostId?: string, linkPreview?: LinkPreview) => Promise<string | undefined>
  voteOnPoll: (postId: string, optionId: string) => Promise<void>
  editPost: (postId: string, content: string) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  editComment: (commentId: string, postId: string, content: string) => Promise<void>
  deleteComment: (commentId: string, postId: string, postOwnerId?: string) => Promise<void>
  following: string[]
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
  isFollowing: (userId: string) => boolean
  loading: boolean
  loadMorePosts: () => Promise<void>
  loadForYouPosts: () => Promise<void>
  hasMorePosts: boolean
  /** Merge enriched post rows into context so SocialPostCard can resolve postId (profile, etc.). */
  mergePostsFromSupabaseRows: (rows: any[]) => Promise<Post[]>
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
  
  // Use ref to track users for stable access in callbacks without dependency changes
  const usersRef = useRef<User[]>([])
  
  // Keep ref in sync with state
  useEffect(() => {
    usersRef.current = users
  }, [users])

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
        avatar: profile.avatar_url || `/api/avatar?name=${encodeURIComponent(profile.username || profile.full_name || profile.id)}`,
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
        avatar: userMetadata.avatar_url || userMetadata.picture || `/api/avatar?name=${encodeURIComponent(userMetadata.username || userMetadata.full_name || userMetadata.name || userId)}`,
        bio: '',
        joinedAt: new Date().toISOString()
      }
      setCurrentUser(userData)
      return userData
    }
    return null
  }, [supabase])

  // Helper to fetch and merge users
  const fetchAndMergeUsers = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return

    // Filter out users we already have using ref to avoid dependency cycle
    const currentUsers = usersRef.current
    const missingIds = userIds.filter(id => !currentUsers.find(u => u.id === id))
    
    if (missingIds.length === 0) return

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', missingIds)

      if (profiles) {
        const newUsers: User[] = profiles.map(p => ({
          id: p.id,
          name: p.full_name || p.username || 'Anonymous',
          username: p.username || 'anonymous',
          avatar: p.avatar_url || `/api/avatar?name=${encodeURIComponent(p.username || p.full_name || p.id)}`,
          bio: p.bio,
          joinedAt: p.updated_at
        }))

        setUsers(prev => {
          const existingIds = new Set(prev.map(u => u.id))
          const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.id))
          return [...prev, ...uniqueNewUsers]
        })
      }
    } catch (e) {
      console.error('Error fetching profiles:', e)
    }
  }, [supabase]) // Removed users dependency

  /** Batch-load embedded quoted posts and merge their authors into userIds. */
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
    [supabase],
  )

  /** Map Supabase post rows (with likes, comments, polls) to `Post[]` — shared by feed, load more, profile merge. */
  const mapEnrichedPostRowsToPosts = useCallback(
    async (postsData: any[], authUserId?: string | null): Promise<Post[]> => {
      if (!postsData?.length) return []

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
      let booksMap: Record<string, any> = {}
      if (bookIds.length > 0) {
        const { data: books } = await supabase.from('books').select('*').in('id', bookIds)
        if (books) {
          books.forEach(b => {
            booksMap[b.id] = b
          })
        }
      }

      return postsData.map(p => {
        let pollData = undefined
        const poll = Array.isArray(p.polls) ? p.polls[0] : p.polls
        if (poll) {
          const hasExpired = new Date(poll.expires_at) < new Date()
          let totalVotes = 0
          const options = (poll.poll_options || []).map((opt: any) => {
            const votes = opt.poll_votes || []
            totalVotes += votes.length
            return {
              id: opt.id,
              text: opt.text,
              votesCount: votes.length,
              hasVoted: authUserId ? votes.some((v: any) => v.user_id === authUserId) : false,
            }
          })
          pollData = {
            expiresAt: poll.expires_at,
            hasExpired,
            totalVotes,
            options,
          }
        }

        const likesArr = Array.isArray(p.likes) ? p.likes : []

        return {
          id: p.id,
          userId: p.user_id,
          content: p.content,
          status: p.status,
          rejectedAt: p.rejected_at,
          imageUrls: p.image_urls,
          linkPreview: p.link_preview_url
            ? {
                url: p.link_preview_url,
                title: p.link_preview_title ?? p.link_preview_url,
                description: p.link_preview_description ?? undefined,
                imageUrl: p.link_preview_image_url ?? undefined,
                siteName: p.link_preview_site_name ?? undefined,
                type: p.link_preview_type ?? undefined,
              }
            : undefined,
          parentPostId: p.parent_post_id,
          quotedPostId: p.quoted_post_id ?? undefined,
          quotedPost: p.quoted_post_id ? quotedMap[p.quoted_post_id] : undefined,
          createdAt: p.created_at,
          likes: likesArr.length,
          likedByMe: !!(authUserId && likesArr.some((l: any) => l.user_id === authUserId)),
          comments: Array.isArray(p.comments)
            ? p.comments.map((c: any) => mapCommentFromSupabase(c, authUserId ?? null))
            : [],
          mentionedBookId: p.mentioned_book_id,
          mentionedBook:
            p.mentioned_book_id && booksMap[p.mentioned_book_id]
              ? {
                  id: booksMap[p.mentioned_book_id].id,
                  title: booksMap[p.mentioned_book_id].title,
                  coverUrl: booksMap[p.mentioned_book_id].cover || booksMap[p.mentioned_book_id].cover_url,
                  author: booksMap[p.mentioned_book_id].author,
                }
              : undefined,
          groupId: p.group_id,
          poll: pollData,
        }
      })
    },
    [supabase, fetchAndMergeUsers, loadQuotedMap],
  )

  const mergePostsFromSupabaseRows = useCallback(
    async (rows: any[]): Promise<Post[]> => {
      const mapped = await mapEnrichedPostRowsToPosts(rows, authUser?.id ?? null)
      if (mapped.length === 0) return []
      setPosts(prev => {
        const byId = new Map(prev.map(p => [p.id, p]))
        for (const p of mapped) byId.set(p.id, p)
        return Array.from(byId.values())
      })
      return mapped
    },
    [authUser?.id, mapEnrichedPostRowsToPosts],
  )

  // Load posts helper
  const loadPosts = useCallback(async (authUserId?: string) => {
    const res = await runFeedPostQuery(select =>
      supabase.from('posts').select(select).order('created_at', { ascending: false }).limit(10),
    )
    if (res.error) {
      console.error('[Social] loadPosts failed (all select tiers):', formatSupabaseError(res.error))
      return
    }
    const postsData = res.data as any[] | null
    if (postsData && postsData.length > 0) {
      try {
        const mappedPosts = await mapEnrichedPostRowsToPosts(postsData, authUserId ?? null)
        setPosts(mappedPosts)
      } catch (e) {
        console.error('[Social] mapEnrichedPostRowsToPosts failed:', e)
      }
    } else {
      setPosts([])
    }
  }, [supabase, mapEnrichedPostRowsToPosts])

  // Load For You posts helper
  const loadForYouPosts = useCallback(async (authUserId?: string) => {
    const userIdToUse = authUserId ?? authUser?.id ?? currentUser?.id
    if (!userIdToUse) {
       await loadPosts(); // Fallback to normal feed if logged out
       return;
    }

    const { data: postsData, error } = await supabase
      .rpc('get_recommended_posts_v1', { p_user_id: userIdToUse })
      .limit(15);
      
    if (error) {
       console.error("Error loading recommended posts:", error);
       // Fallback
       await loadPosts(userIdToUse);
       return;
    }

    if (!postsData || postsData.length === 0) {
      await loadPosts(userIdToUse)
      return
    }

    // Collect all user IDs involved
    const userIds = new Set<string>()
      
      // Since it's an RPC, we need to fetch likes and comments manually or we can just fetch the detailed profiles.
      // The RPC returns basic post rows. We need to enrich them.
      // To keep it simple and match the `loadPosts` shape, we can just fetch the full posts data for the IDs returned by the RPC, keeping the order.
      const postIds = postsData.map((p: any) => p.id);
      
      const enrichRes = await runFeedPostQuery(select =>
        supabase.from('posts').select(select).in('id', postIds),
      )
      if (enrichRes.error) {
        console.error('[Social] loadForYouPosts enrich failed:', formatSupabaseError(enrichRes.error))
        await loadPosts(userIdToUse)
        return
      }
      const enrichedPostsData = enrichRes.data as any[] | null

      if (enrichedPostsData) {
         // Sort enriched data back to original RPC order
         const enrichedPostsMap = new Map(enrichedPostsData.map(p => [p.id, p]));
         const sortedEnrichedPosts = postIds.map((id: string) => enrichedPostsMap.get(id)).filter(Boolean);

         sortedEnrichedPosts.forEach((p: any) => {
           if (p.user_id) userIds.add(p.user_id)
           if (Array.isArray(p.comments)) {
             p.comments.forEach((c: any) => {
                if (c.user_id) userIds.add(c.user_id)
             })
           }
         })

         const quotedMapFy = await loadQuotedMap(sortedEnrichedPosts, userIds)
         
         await fetchAndMergeUsers(Array.from(userIds))

         const bookIds = sortedEnrichedPosts
           .filter((p: any) => p.mentioned_book_id)
           .map((p: any) => p.mentioned_book_id)

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

         const mappedPosts: Post[] = sortedEnrichedPosts.map((p: any) => {
             return {
               id: p.id,
               userId: p.user_id,
               content: p.content,
               imageUrls: p.image_urls,
               linkPreview: p.link_preview_url
                 ? {
                     url: p.link_preview_url,
                     title: p.link_preview_title ?? p.link_preview_url,
                     description: p.link_preview_description ?? undefined,
                     imageUrl: p.link_preview_image_url ?? undefined,
                     siteName: p.link_preview_site_name ?? undefined,
                     type: p.link_preview_type ?? undefined,
                   }
                 : undefined,
               parentPostId: p.parent_post_id,
               quotedPostId: p.quoted_post_id ?? undefined,
               quotedPost: p.quoted_post_id ? quotedMapFy[p.quoted_post_id] : undefined,
               createdAt: p.created_at,
               likes: p.likes ? p.likes.length : 0,
               likedByMe: userIdToUse && p.likes ? p.likes.some((l: any) => l.user_id === userIdToUse) : false,
               comments: Array.isArray(p.comments)
                 ? p.comments.map((c: any) => mapCommentFromSupabase(c, userIdToUse ?? null))
                 : [],
               mentionedBookId: p.mentioned_book_id,
               mentionedBook: p.mentioned_book_id && booksMap[p.mentioned_book_id] ? {
                  id: booksMap[p.mentioned_book_id].id,
                  title: booksMap[p.mentioned_book_id].title,
                  coverUrl: booksMap[p.mentioned_book_id].cover || booksMap[p.mentioned_book_id].cover_url,
                  author: booksMap[p.mentioned_book_id].author
               } : undefined,
               groupId: p.group_id,
               // Simplify poll for now in recommendations
               poll: undefined 
             }
         })
         setPosts(mappedPosts)
      }
  }, [supabase, fetchAndMergeUsers, authUser?.id, currentUser?.id, loadPosts, loadQuotedMap])

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
               avatar_url: n.actor.avatar_url || `/api/avatar?name=${encodeURIComponent(n.actor.username || n.actor_id)}`
             } : undefined
           }))
           // Ensure we only keep latest 30
           const finalNotifs = mappedNotifs.slice(0, 30)
           setNotifications(finalNotifs)
           // Bell badge should not count DM items (DM has its own inbox badge).
           setUnreadCount(finalNotifs.filter((n: any) => !n.read && n.type !== 'dm').length)
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
            // payload.new includes read/unread state; update badge even if actor enrichment is blocked by RLS.
            const raw = payload.new as any
            const shouldIncrementUnread = !raw.read && raw.type !== 'dm'

            let mappedNew: any = {
              ...raw,
              actor: undefined,
            }

            try {
              // Enrich actor for better UX (name/avatar). If this fails, unread indicator still must work.
              const { data: newNotif } = await supabase
                .from('notifications')
                .select(`*, actor:profiles!actor_id(username, avatar_url)`)
                .eq('id', raw.id)
                .single()

              if (newNotif) {
                mappedNew = {
                  ...newNotif,
                  actor: newNotif.actor
                    ? {
                        username: newNotif.actor.username,
                        avatar_url:
                          newNotif.actor.avatar_url ||
                          `/api/avatar?name=${encodeURIComponent(newNotif.actor.username || newNotif.actor_id)}`,
                      }
                    : undefined,
                }
              }
            } catch {
              // ignore enrichment failures
            }

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const actorName = mappedNew.actor?.username || 'Bitig'
              const text =
                mappedNew.type === 'like' ? 'paylaşımınızı bəyəndi' :
                mappedNew.type === 'comment' ? 'paylaşımınıza şərh yazdı' :
                mappedNew.type === 'follow' ? 'sizi izləməyə başladı' :
                mappedNew.type === 'dm' ? 'sizə mesaj göndərdi' :
                'yeni bildiriş'
              const n = new Notification(actorName, { body: text })
              n.onclick = () => {
                const localeSeg = window.location.pathname.split('/')[1] || 'az'
                const target =
                  mappedNew.type === 'dm'
                    ? (mappedNew.actor?.username
                        ? `/${localeSeg}/messages/${encodeURIComponent(mappedNew.actor.username)}`
                        : `/${localeSeg}/messages?id=${mappedNew.entity_id}`)
                    : `/${localeSeg}/social`
                window.location.href = target
              }
            }

            setNotifications(prev => {
              const newArray = [mappedNew, ...prev]
              return newArray.slice(0, 30)
            })
            if (shouldIncrementUnread) setUnreadCount(prev => prev + 1)
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

      // Prefetch a few recent profiles for suggestions — must MERGE into state, not replace.
      // Replacing dropped post authors merged in loadPosts (anyone not in "top 10 by updated_at"),
      // which made SocialPostCard fall back to Unknown until something refetched.
      supabase.from('profiles').select('*').order('updated_at', { ascending: false }).limit(10)
        .then(({ data: profiles }) => {
          if (profiles && mounted) {
            const mappedUsers: User[] = profiles.map(p => ({
              id: p.id,
              name: p.full_name || p.username || 'Anonymous',
              username: p.username || 'anonymous',
              avatar: p.avatar_url || `/api/avatar?name=${encodeURIComponent(p.username || p.full_name || p.id)}`,
              bio: p.bio,
              joinedAt: p.updated_at
            }))

            setUsers(prev => {
              const merged = new Map(prev.map(u => [u.id, u]))
              for (const u of mappedUsers) {
                if (!merged.has(u.id)) merged.set(u.id, u)
              }
              const list = Array.from(merged.values())
              const selfId = authUser?.id
              if (selfId) {
                const idx = list.findIndex(u => u.id === selfId)
                if (idx >= 0) {
                  const [self] = list.splice(idx, 1)
                  return [self, ...list]
                }
              }
              return list
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

  const likeComment = async (commentId: string, postId: string) => {
    if (!currentUser) return
    const post = posts.find(p => p.id === postId)
    const comment = post?.comments.find(c => c.id === commentId)
    if (!comment) return

    if (comment.likedByMe) {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .match({ comment_id: commentId, user_id: currentUser.id })
      if (!error) {
        setPosts(prev =>
          prev.map(p => {
            if (p.id !== postId) return p
            return {
              ...p,
              comments: p.comments.map(c =>
                c.id === commentId
                  ? { ...c, likes: Math.max(0, (c.likes ?? 0) - 1), likedByMe: false }
                  : c,
              ),
            }
          }),
        )
      }
    } else {
      const { error } = await supabase.from('comment_likes').insert({
        comment_id: commentId,
        user_id: currentUser.id,
      })
      if (!error) {
        setPosts(prev =>
          prev.map(p => {
            if (p.id !== postId) return p
            return {
              ...p,
              comments: p.comments.map(c =>
                c.id === commentId
                  ? { ...c, likes: (c.likes ?? 0) + 1, likedByMe: true }
                  : c,
              ),
            }
          }),
        )
      }
    }
  }

  const addComment = async (postId: string, content: string, parentCommentId?: string | null) => {
    if (!currentUser) return

    // Parse @username mentions from content
    const mentionRegex = /@([a-zA-Z0-9_]{3,20})/g
    const usernames: string[] = []
    let match: RegExpExecArray | null
    while ((match = mentionRegex.exec(content)) !== null) {
      usernames.push(match[1].toLowerCase())
    }

    // Resolve usernames to user ids
    let mentionedUserIds: string[] = []
    if (usernames.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('username', usernames)
      if (profiles) {
        mentionedUserIds = profiles.map((p: { id: string }) => p.id)
      }
    }

    const payload: Record<string, unknown> = {
      post_id: postId,
      user_id: currentUser.id,
      content,
    }
    if (parentCommentId) payload.parent_comment_id = parentCommentId
    if (mentionedUserIds.length > 0) payload.mentioned_user_ids = mentionedUserIds

    const { data, error } = await supabase.from('comments').insert(payload).select().single()

    if (!error && data) {
      const newComment: Comment = {
        id: data.id,
        userId: data.user_id,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? null,
        parentCommentId: data.parent_comment_id ?? null,
        likes: 0,
        likedByMe: false,
        mentionedUserIds: data.mentioned_user_ids ?? [],
      }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    }
  }

  const createPost = async (content: string, mentionedBookId?: string, groupId?: string, imageUrls?: string[], parentPostId?: string, pollOptions?: string[], pollDurationHours?: number, quotedPostId?: string, linkPreview?: LinkPreview): Promise<string | undefined> => {
    if (!currentUser) return undefined

    // Ensure content is strictly not completely empty to avoid Postgres `not null` or implicit checks failing
    const safeContent = content.trim() === '' ? ' ' : content

    const insertPayload: Record<string, any> = {
      user_id: currentUser.id,
      content: safeContent,
      image_urls: imageUrls,
      link_preview_url: linkPreview?.url ?? null,
      link_preview_title: linkPreview?.title ?? null,
      link_preview_description: linkPreview?.description ?? null,
      link_preview_image_url: linkPreview?.imageUrl ?? null,
      link_preview_site_name: linkPreview?.siteName ?? null,
      link_preview_type: linkPreview?.type ?? null,
      quoted_post_id: quotedPostId ?? null,
      mentioned_book_id: mentionedBookId,
      group_id: groupId
    }
    if (parentPostId) insertPayload.parent_post_id = parentPostId

    let { data, error } = await supabase.from('posts').insert(insertPayload).select().single()

    if (error) {
      if (error.message?.includes('parent_post_id') && parentPostId) {
        delete insertPayload.parent_post_id
        const retry = await supabase.from('posts').insert(insertPayload).select().single()
        if (retry.error) {
          console.error('Error creating post (retry):', retry.error)
          toast.error('Paylaşım edilərkən xəta baş verdi: ' + retry.error.message)
          return undefined
        }
        if (retry.data) { data = retry.data } else { return undefined }
      } else {
        console.error('Error creating post:', error)
        toast.error('Paylaşım edilərkən xəta baş verdi: ' + error.message)
        return undefined
      }
    }

    if (data) {
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

      let quotedEmbed: QuotedPostEmbed | undefined
      if (quotedPostId) {
        const orig = posts.find(p => p.id === quotedPostId)
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

      let pollData = undefined;
      // Handle Poll Creation
      if (pollOptions && pollOptions.length >= 2 && pollDurationHours) {
         const expiresAt = new Date();
         expiresAt.setHours(expiresAt.getHours() + pollDurationHours);
         
         const { error: pollError } = await supabase.from('polls').insert({
            post_id: data.id,
            expires_at: expiresAt.toISOString()
         });

         if (!pollError) {
             const optionsToInsert = pollOptions.map(opt => ({
                 post_id: data.id,
                 text: opt.trim()
             }));
             const { data: insertedOptions } = await supabase.from('poll_options').insert(optionsToInsert).select();
             
             if (insertedOptions) {
                 pollData = {
                     expiresAt: expiresAt.toISOString(),
                     hasExpired: false,
                     totalVotes: 0,
                     options: insertedOptions.map(o => ({
                         id: o.id,
                         text: o.text,
                         votesCount: 0,
                         hasVoted: false
                     }))
                 };
             }
         }
      }

      const newPost: Post = {
        id: data.id,
        userId: data.user_id,
        content: data.content,
        imageUrls: data.image_urls,
        linkPreview: data.link_preview_url
          ? {
              url: data.link_preview_url,
              title: data.link_preview_title ?? data.link_preview_url,
              description: data.link_preview_description ?? undefined,
              imageUrl: data.link_preview_image_url ?? undefined,
              siteName: data.link_preview_site_name ?? undefined,
              type: data.link_preview_type ?? undefined,
            }
          : undefined,
        createdAt: data.created_at,
        likes: 0,
        likedByMe: false,
        comments: [],
        parentPostId: data.parent_post_id,
        quotedPostId: data.quoted_post_id ?? undefined,
        quotedPost: quotedEmbed,
        mentionedBookId: data.mentioned_book_id,
        mentionedBook: mentionedBookDetails,
        groupId: data.group_id,
        poll: pollData
      }
      setPosts(prev => [newPost, ...prev])
      return data.id
    }
  }

  const voteOnPoll = async (postId: string, optionId: string) => {
    if (!currentUser) return;

    // Optimistically update
    setPosts(prev => prev.map(p => {
        if (p.id === postId && p.poll) {
            const newOptions = p.poll.options.map(opt => {
                if (opt.id === optionId) {
                    return { ...opt, votesCount: opt.votesCount + 1, hasVoted: true };
                }
                return opt;
            });
            return {
                ...p,
                poll: {
                    ...p.poll,
                    totalVotes: p.poll.totalVotes + 1,
                    options: newOptions
                }
            };
        }
        return p;
    }));

    const { error } = await supabase.from('poll_votes').insert({
        post_id: postId,
        option_id: optionId,
        user_id: currentUser.id
    });

    if (error) {
       console.error("Error voting on poll:", error);
       // Reverting optimistic UI on error could be implemented here
    }
  }

  const editPost = async (postId: string, content: string) => {
    if (!currentUser) return
    const now = new Date().toISOString()

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, content, updatedAt: now }
      }
      return p
    }))

    const { error } = await supabase
      .from('posts')
      .update({ content, updated_at: now })
      .eq('id', postId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error editing post:', error)
      // We could ideally revert the optimistic update here on error
    }
  }

  const deletePost = async (postId: string) => {
    if (!currentUser) return

    const postToDelete = posts.find(p => p.id === postId)

    // Find all descendants in the thread chain (children, grandchildren, etc.)
    const descendantIds: string[] = []
    const queue = [postId]
    while (queue.length > 0) {
      const current = queue.shift()!
      const children = posts.filter(p => p.parentPostId === current && p.userId === currentUser.id)
      for (const child of children) {
        descendantIds.push(child.id)
        queue.push(child.id)
      }
    }

    const allIdsToDelete = [postId, ...descendantIds]

    // Optimistic update — remove the post and all its descendants from local state
    setPosts(prev => prev.filter(p => !allIdsToDelete.includes(p.id)))

    // Delete images from storage first
    if (postToDelete && postToDelete.imageUrls && postToDelete.imageUrls.length > 0) {
      const { deletePostImages } = await import('@/lib/supabase/storage')
      await deletePostImages(postToDelete.imageUrls)
    }

    // Also delete images from descendant posts
    for (const id of descendantIds) {
      const child = posts.find(p => p.id === id)
      if (child && child.imageUrls && child.imageUrls.length > 0) {
        const { deletePostImages } = await import('@/lib/supabase/storage')
        await deletePostImages(child.imageUrls)
      }
    }

    // Delete all posts in the chain from the database
    for (const id of allIdsToDelete) {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id)

      if (error) {
        console.error('Error deleting post:', error)
      }
    }
  }

  const deleteComment = async (commentId: string, postId: string, postOwnerId?: string) => {
    if (!currentUser) return

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const removeIds = collectSubtreeCommentIds(p.comments, commentId)
      return {
        ...p,
        comments: p.comments.filter(c => !removeIds.has(c.id)),
      }
    }))

    // Post owner can delete any comment on their post
    const isPostOwner = postOwnerId && currentUser.id === postOwnerId

    let query = supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    // If not the post owner, restrict to own comments only
    if (!isPostOwner) {
      query = query.eq('user_id', currentUser.id)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const editComment = async (commentId: string, postId: string, content: string) => {
    if (!currentUser) return
    const now = new Date().toISOString()

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.map(c => c.id === commentId ? { ...c, content, updatedAt: now } : c)
        }
      }
      return p
    }))

    const { error } = await supabase
      .from('comments')
      .update({ content, updated_at: now })
      .eq('id', commentId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error editing comment:', error)
    }
  }

  const loadMorePosts = async () => {
    const { data: { user: authUserFromSession } } = await supabase.auth.getUser()
    const res = await runFeedPostQuery(select =>
      supabase
        .from('posts')
        .select(select)
        .order('created_at', { ascending: false })
        .range(posts.length, posts.length + 9),
    )
    if (res.error) {
      console.error('[Social] loadMorePosts failed:', formatSupabaseError(res.error))
      return
    }
    const postsData = res.data as any[] | null
    if (postsData && postsData.length > 0) {
      try {
        const mappedPosts = await mapEnrichedPostRowsToPosts(postsData, authUserFromSession?.id ?? null)
        setPosts(prev => [...prev, ...mappedPosts])
      } catch (e) {
        console.error('[Social] loadMorePosts map failed:', e)
      }
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

    // Do not mark DM notifications here; DM read-state is tied to opening the conversation.
    const ids = notifications.filter(n => !n.read && n.type !== 'dm').map(n => n.id)
    
    // Optimistic update
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => (n.type === 'dm' ? n : { ...n, read: true })))

    if (ids.length > 0) {
      const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids)
      if (error) {
        console.error('Error marking notifications as read:', error)
      }
    }
  }

  const value: SocialState = useMemo(() => ({
    currentUser,
    users,
    posts,
    like,
    likeComment,
    addComment,
    createPost,
    editPost,
    deletePost,
    editComment,
    deleteComment,
    voteOnPoll,
    following,
    follow,
    unfollow,
    isFollowing,
    loading,
    loadMorePosts,
    loadForYouPosts,
    hasMorePosts,
    mergePostsFromSupabaseRows,
    notifications,
    unreadCount,
    markNotificationsAsRead
  }), [currentUser, users, posts, following, loading, notifications, unreadCount, loadForYouPosts, mergePostsFromSupabaseRows, likeComment])

  return <SocialCtx.Provider value={value}>{children}</SocialCtx.Provider>
}

export function useSocial() {
  const ctx = useContext(SocialCtx)
  if (!ctx) throw new Error('useSocial must be used within SocialProvider')
  return ctx
}
