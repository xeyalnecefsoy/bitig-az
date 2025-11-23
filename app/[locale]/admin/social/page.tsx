"use client"
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'
import { FiTrash2, FiMessageCircle, FiHeart, FiUser } from 'react-icons/fi'

export default function AdminSocialPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('en')
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const loc = pathname.split('/')[1] as Locale
    setLocale(loc || 'en')
    loadPosts()
  }, [])

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, avatar_url),
        comments (count),
        likes (count)
      `)
      .order('created_at', { ascending: false })
    
    setPosts(data || [])
    setLoading(false)
  }

  async function deletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post? This will also delete all comments and likes.')) return
    
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadPosts()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Social Posts</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage community posts and content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FiMessageCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{posts.length}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Posts</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <FiHeart size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {posts.reduce((sum, p) => sum + (p.likes?.[0]?.count || 0), 0)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Likes</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <FiMessageCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {posts.reduce((sum, p) => sum + (p.comments?.[0]?.count || 0), 0)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Comments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Post</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-900 dark:text-white line-clamp-2 max-w-md">{post.content}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                          <FiUser className="text-neutral-500" size={16} />
                        </div>
                      )}
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {post.profiles?.username || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <FiHeart size={14} /> {post.likes?.[0]?.count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiMessageCircle size={14} /> {post.comments?.[0]?.count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-1"
                      title="Delete post"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
          {posts.map((post) => (
            <div key={post.id} className="p-4">
              <div className="flex items-start gap-3 mb-3">
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                    <FiUser className="text-neutral-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {post.profiles?.username || 'Unknown'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2"
                >
                  <FiTrash2 />
                </button>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">{post.content}</p>
              <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <FiHeart size={14} /> {post.likes?.[0]?.count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <FiMessageCircle size={14} /> {post.comments?.[0]?.count || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
            No posts yet.
          </div>
        )}
      </div>
    </div>
  )
}
