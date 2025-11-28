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

export default function MyProfilePage() {
  const { close: closeAudio } = useAudio()
  const { currentUser: authUser } = useSocial()
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
  const locale = pathname.split('/')[1] || 'en'
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
    router.push(`/${locale}`)
    router.refresh()
  }

  if (loading) {
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
          <h2 className="text-xl font-semibold mb-3">Sign in to view your profile</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">You need to be signed in to access your profile page.</p>
          <Link href={`/${locale}/login`} className="btn btn-primary">Sign in</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="container-max py-6 sm:py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">My Posts</h2>
        {posts.length === 0 ? (
          <div className="card p-6 text-sm text-neutral-600 dark:text-neutral-300">No posts yet.</div>
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
                  {loadingMore ? 'Loading...' : 'Load More Posts'}
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
                <h3 className="font-semibold text-lg">Edit Profile</h3>
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
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Click icon to change avatar</p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                  placeholder="Your username"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn btn-primary w-full gap-2"
              >
                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            // View Mode
            <>
              <div className="flex items-center gap-4">
                <img src={currentUser.avatar_url} alt={currentUser.username} className="h-16 w-16 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-semibold truncate">{currentUser.username || 'Anonymous'}</h1>
                  {currentUser.bio && <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">{currentUser.bio}</p>}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Posts</div>
                  <div className="font-semibold">{posts.length}</div>
                </div>
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Following</div>
                  <div className="font-semibold">{followingCount}</div>
                </div>
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Followers</div>
                  <div className="font-semibold">{followersCount}</div>
                </div>
              </div>

              {currentUser.created_at && (
                <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  Joined {new Date(currentUser.created_at).toLocaleDateString()}
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button onClick={() => setEditing(true)} className="btn btn-outline w-full gap-2">
                  <FiEdit2 /> Edit Profile
                </button>
                <button onClick={handleLogout} className="btn btn-outline w-full gap-2 text-red-600 hover:text-red-700 hover:border-red-600">
                  <FiLogOut /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </section>
  )
}
