"use client"
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { FiEdit2, FiSave, FiX, FiLogOut, FiUpload } from 'react-icons/fi'
import { uploadAvatar } from '@/lib/supabase/storage'
import { useAudio } from '@/context/audio'
import { FollowButton } from '@/components/social/FollowButton'
import { useSocial } from '@/context/social'
import { t, type Locale } from '@/lib/i18n'
import { RankBadge } from '@/components/RankBadge'

export default function MyProfilePage() {
  const { close: closeAudio } = useAudio()
  const { currentUser: globalUser, loading: globalLoading } = useSocial()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', bio: '' })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const router = useRouter()
  const pathname = usePathname()
  const locale = (pathname.split('/')[1] || 'en') as Locale
  const supabase = createClient()

  // Timeout constant
  const AUTH_TIMEOUT = 10000 // 10 seconds max loading

  useEffect(() => {
    // Safety timeout - always break loading after max time
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, AUTH_TIMEOUT)

    loadProfile()

    // Auth state listener - breaks loading on any auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Re-run loadProfile on auth changes
      loadProfile()
    })

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(overrideUser?: any) {
    try {
      let user = overrideUser
      
      if (!user) {
        const { data } = await supabase.auth.getUser()
        user = data.user
      }

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setCurrentUser(profile)
        setEditForm({ username: profile.username || '', bio: profile.bio || '' })
        setAvatarPreview(profile.avatar_url || '')

        // Fetch counts
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id)
        
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id)

        setFollowersCount(followers || 0)
        setFollowingCount(following || 0)
      }

      // Load initial 10 posts
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Don't fail if posts table doesn't exist or query fails
      if (!postsError && userPosts) {
        setPosts(userPosts)
        setHasMore(userPosts.length === 10)
      } else {
        setPosts([])
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setPosts([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  async function loadMorePosts() {
    if (!currentUser || loadingMore) return
    setLoadingMore(true)

    const { data: morePosts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .range(posts.length, posts.length + 9)

    if (morePosts && morePosts.length > 0) {
      setPosts(prev => [...prev, ...morePosts])
      setHasMore(morePosts.length === 10)
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSave() {
    if (!currentUser) return
    setSaving(true)

    let avatarUrl = currentUser.avatar_url

    // Upload new avatar if selected
    if (avatarFile) {
      const { url, error } = await uploadAvatar(avatarFile, currentUser.id)
      if (error) {
        alert('Error uploading avatar: ' + error)
        setSaving(false)
        return
      }
      avatarUrl = url || avatarUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: avatarUrl,
      })
      .eq('id', currentUser.id)

    if (error) {
      alert('Error updating profile: ' + error.message)
    } else {
      setEditing(false)
      loadProfile()
    }
    setSaving(false)
  }

  async function handleLogout() {
    closeAudio() // Stop audio playback
    await supabase.auth.signOut()
    router.push(`/${locale}` as any)
    router.refresh()
  }

  const [verifyingSession, setVerifyingSession] = useState(false)

  // Double-check session if context thinks we are logged out (fixes false positives on Vercel)
  useEffect(() => {
    if (!globalLoading && !globalUser && !currentUser && !loading) {
      setVerifyingSession(true)
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          // Found session! Self-heal instead of reloading.
          console.log("Context missed user, self-healing...")
          loadProfile(data.session.user)
        } 
        setVerifyingSession(false)
      })
    }
  }, [globalLoading, globalUser, currentUser, loading])

  if (loading || globalLoading || verifyingSession) {
    return (
      <section className="container-max py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </section>
    )
  }

  // If we have a global user but no local profile yet, it means we are still fetching. 
  // Show spinner instead of Sign In to prevent flickering.
  if (globalUser && !currentUser) {
    return (
       <section className="container-max py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </section>
    )
  }

  if (!currentUser) {
    return (
      <section className="container-max py-6 sm:py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">{t(locale, 'profile_sign_in_required')}</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{t(locale, 'profile_sign_in_required_desc')}</p>
          <Link href={`/${locale}/login` as any} className="btn btn-primary">{t(locale, 'sign_in')}</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="container-max py-6 sm:py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{t(locale, 'my_posts')}</h2>
        {posts.length === 0 ? (
          <div className="card p-6 text-sm text-neutral-600 dark:text-neutral-300">{t(locale, 'profile_no_posts')}</div>
        ) : (
          <div className="space-y-6">
          {posts.map(post => (
            <SocialPostCard key={post.id} postId={post.id} disableHover={true} />
          ))}
          
          {hasMore && (
              <div className="flex justify-center py-4">
                <button 
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  className="btn btn-outline"
                >
                  {loadingMore ? t(locale, 'loading') : t(locale, 'load_more')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4 order-first lg:order-last">
        <div className="card p-5">
          {editing ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t(locale, 'edit_profile')}</h3>
                <button onClick={() => setEditing(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                  <FiX />
                </button>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img 
                    src={avatarPreview || currentUser.avatar_url} 
                    alt="Avatar" 
                    className="h-24 w-24 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700" 
                  />
                  <label className="absolute bottom-0 right-0 p-2 bg-brand text-white rounded-full cursor-pointer hover:bg-brand/90 shadow-lg">
                    <FiUpload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t(locale, 'change_avatar_tip')}</p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'username')}</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                  placeholder={t(locale, 'username_placeholder')}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'bio')}</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none"
                  placeholder={t(locale, 'bio_placeholder')}
                />
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn btn-primary w-full gap-2"
              >
                <FiSave /> {saving ? t(locale, 'saving') : t(locale, 'save_changes')}
              </button>
            </div>
          ) : (
            // View Mode
            <>
              <div className="flex items-center gap-4">
                <img src={currentUser.avatar_url} alt={currentUser.username} className="h-16 w-16 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-semibold truncate">{currentUser.username || t(locale, 'profile_anonymous')}</h1>
                    <RankBadge rank={currentUser.rank || 'novice'} locale={locale} size="sm" />
                  </div>
                  {currentUser.bio && <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">{currentUser.bio}</p>}
                </div>
              </div>

              {/* Reputation Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t(locale, 'books_read')}</div>
                  <div className="font-bold text-blue-700 dark:text-blue-300">{currentUser.books_read || 0}</div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">{t(locale, 'reviews_written')}</div>
                  <div className="font-bold text-green-700 dark:text-green-300">{currentUser.reviews_count || 0}</div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-3">
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t(locale, 'review_likes')}</div>
                  <div className="font-bold text-amber-700 dark:text-amber-300">{currentUser.review_likes_received || 0}</div>
                </div>
              </div>

              {/* Social Stats */}
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{t(locale, 'posts')}</div>
                  <div className="font-semibold">{posts.length}</div>
                </div>
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{t(locale, 'following')}</div>
                  <div className="font-semibold">{followingCount}</div>
                </div>
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{t(locale, 'followers')}</div>
                  <div className="font-semibold">{followersCount}</div>
                </div>
              </div>

              {currentUser.created_at && (
                <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  {t(locale, 'profile_joined')} {new Date(currentUser.created_at).toLocaleDateString()}
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button onClick={() => setEditing(true)} className="btn btn-outline w-full gap-2">
                  <FiEdit2 /> {t(locale, 'edit_profile')}
                </button>
                <button onClick={handleLogout} className="btn btn-outline w-full gap-2 text-red-600 hover:text-red-700 hover:border-red-600">
                  <FiLogOut /> {t(locale, 'logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </section>
  )
}

