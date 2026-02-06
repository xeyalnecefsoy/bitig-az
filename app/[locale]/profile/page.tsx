"use client"
import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { FiEdit2, FiSave, FiX, FiLogOut, FiUpload } from 'react-icons/fi'
import { uploadAvatar, uploadBanner } from '@/lib/supabase/storage'
import { useAudio } from '@/context/audio'
import { FollowButton } from '@/components/social/FollowButton'
import { useSocial } from '@/context/social'
import { t, type Locale } from '@/lib/i18n'
import { RankBadge } from '@/components/RankBadge'
import { ProfileSkeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { ConfirmDialog } from '@/components/ConfirmDialog'

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
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [alert, setAlert] = useState<{ message: string, type: 'error' | 'success' | 'info' } | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const locale = (pathname.split('/')[1] || 'en') as Locale
  const supabase = useMemo(() => createClient(), [])

  // Short timeout - rely on SocialProvider for auth
  const AUTH_TIMEOUT = 3000 // 3 seconds max

  useEffect(() => {
    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, AUTH_TIMEOUT)

    // When globalUser becomes available from SocialProvider, use it
    if (!globalLoading) {
      if (globalUser) {
        loadProfileData(globalUser.id)
      } else {
        setLoading(false)
      }
      clearTimeout(safetyTimeout)
    }

    return () => clearTimeout(safetyTimeout)
  }, [globalUser, globalLoading])

  async function loadProfileData(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile) {
        setCurrentUser(profile)
        setEditForm({ username: profile.username || '', bio: profile.bio || '' })
        setAvatarPreview(profile.avatar_url || '')
        setBannerPreview(profile.banner_url || '')

        // Fetch counts in parallel
        const [{ count: followers }, { count: following }] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
        ])

        setFollowersCount(followers || 0)
        setFollowingCount(following || 0)
      }

      // Load initial posts
      const { data: userPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (userPosts) {
        setPosts(userPosts)
        setHasMore(userPosts.length === 10)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
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

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSave() {
    if (!currentUser) return
    setSaving(true)

    let avatarUrl = currentUser.avatar_url
    let bannerUrl = currentUser.banner_url
    const usernameChanged = currentUser.username !== editForm.username

    // Upload new avatar if selected
    if (avatarFile) {
      const { url, error } = await uploadAvatar(avatarFile, currentUser.id)
      if (error) {
        setAlert({ message: t(locale, 'error_avatar_upload'), type: 'error' })
        setSaving(false)
        return
      }
      avatarUrl = url || avatarUrl
    }

    // Upload new banner if selected
    if (bannerFile) {
      const { url, error } = await uploadBanner(bannerFile, currentUser.id)
      if (error) {
        setAlert({ message: t(locale, 'error_avatar_upload'), type: 'error' }) // Reuse error message or add new one
        setSaving(false)
        return
      }
      bannerUrl = url || bannerUrl
    }

    // Check username rules if changed
    if (usernameChanged) {
      const { data: check } = await supabase.rpc('can_change_username', {
        p_user_id: currentUser.id,
        p_new_username: editForm.username
      })

      if (check && !check.allowed) {
        let msg = t(locale, 'error_username_general')
        if (check.reason === 'taken') msg = t(locale, 'error_username_taken')
        if (check.reason === 'invalid_format') msg = t(locale, 'error_username_format')
        if (check.reason === 'time_limit') msg = t(locale, 'error_username_limit').replace('{days}', check.days_left)
        
        setAlert({ message: msg, type: 'error' })
        setSaving(false)
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      })
      .eq('id', currentUser.id)

    if (error) {
      setAlert({ message: t(locale, 'error_profile_update'), type: 'error' })
    } else {
      setAlert(null)
      setEditing(false)
      if (globalUser) loadProfileData(globalUser.id)
    }
    setSaving(false)
  }

  function handleLogout() {
    setShowLogoutConfirm(true)
  }

  async function confirmLogout() {
    closeAudio() // Stop audio playback
    await supabase.auth.signOut()
    router.push(`/${locale}` as any)
    router.refresh()
  }

  // Show skeleton while loading
  if (loading || globalLoading) {
    return <ProfileSkeleton />
  }

  // If we have a global user but no local profile yet, keep loading
  if (globalUser && !currentUser) {
    return <ProfileSkeleton />
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
                <button onClick={() => { setEditing(false); setAlert(null); }} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                  <FiX />
                </button>
              </div>

              {alert && (
                <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
              )}

              {/* Banner Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t(locale, 'banner_label')} <span className="text-neutral-400 font-normal ml-1">({t(locale, 'banner_recommended')})</span>
                </label>
                <div className="relative w-full aspect-[4/1] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 group">
                  {(bannerPreview || currentUser.banner_url) ? (
                    <img 
                      src={bannerPreview || currentUser.banner_url} 
                      alt="Banner" 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-neutral-400 group-hover:opacity-0 transition-opacity">
                      <span className="text-sm">{t(locale, 'no_banner')}</span>
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium">
                    <FiUpload className="mr-2" /> {t(locale, 'change_banner')}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t(locale, 'banner_crop_hint')}
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img 
                    src={avatarPreview || currentUser.avatar_url} 
                    alt="Avatar" 
                    className="h-24 w-24 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900" 
                    referrerPolicy="no-referrer" 
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
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 flex items-start gap-1">
                  <span className="text-amber-500 shrink-0">⚠</span> 
                  {t(locale, 'username_change_hint')}
                </p>
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
            <div className="-m-5">
              {/* Banner Area */}
              <div className="relative w-full aspect-[4/1] bg-neutral-100 dark:bg-neutral-800 rounded-t-xl overflow-hidden">
                {currentUser.banner_url ? (
                  <img 
                    src={currentUser.banner_url} 
                    alt="Banner" 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20" />
                )}
              </div>

              {/* Profile Info Area */}
              <div className="px-5 pb-5 relative">
                 {/* Avatar (Overlapping) */}
                 <div className="-mt-12 mb-3">
                   <img 
                      src={currentUser.avatar_url} 
                      alt={currentUser.username} 
                      className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-neutral-900 bg-white dark:bg-neutral-900 shadow-md" 
                      referrerPolicy="no-referrer" 
                    />
                 </div>

                 {/* Names & Badges & Actions */}
                 <div className="flex justify-between items-start gap-4">
                   <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                         <h1 className="text-2xl font-bold text-neutral-900 dark:text-white truncate">
                           {currentUser.full_name || t(locale, 'profile_anonymous')}
                         </h1>
                         <RankBadge 
                            rank={(currentUser.username === 'xeyalnecefsoy' ? 'founder' : (currentUser.rank || 'novice')) as any} 
                            locale={locale} 
                            size="sm" 
                         />
                      </div>
                      
                      {/* Username */}
                      {currentUser.username && (
                        <div className="text-neutral-500 dark:text-neutral-400 font-medium truncate">
                          @{currentUser.username}
                        </div>
                      )}
                   </div>

                   {/* Quick Actions */}
                   <div className="flex gap-1.5 shrink-0">
                     <button 
                       onClick={() => setEditing(true)} 
                       className="p-2 text-neutral-500 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                       title={t(locale, 'edit_profile')}
                     >
                       <FiEdit2 size={20} />
                     </button>
                     <button 
                       onClick={handleLogout} 
                       className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                       title={t(locale, 'logout')}
                     >
                       <FiLogOut size={20} />
                     </button>
                   </div>
                 </div>

                 {/* Bio */}
                 {currentUser.bio && (
                   <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                     {currentUser.bio}
                   </p>
                 )}
              </div>
            </div>

              {/* Reputation Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Link 
                  href={`/${locale}/audiobooks?tab=library` as any}
                  className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 hover:scale-[1.02] transition-transform cursor-pointer block"
                >
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t(locale, 'books_read')}</div>
                  <div className="font-bold text-blue-700 dark:text-blue-300">{currentUser.books_read || 0}</div>
                </Link>
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


            </>
          )}
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title={t(locale, 'logout')}
        message={t(locale, 'logout_confirm_desc') || "Are you sure you want to log out?"}
        confirmLabel={t(locale, 'logout')}
        cancelLabel={t(locale, 'cancel_btn')}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        variant="danger"
      />
    </section>
  )
}

