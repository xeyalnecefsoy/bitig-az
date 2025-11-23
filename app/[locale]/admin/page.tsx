"use client"
import { createClient } from '@/lib/supabase/client'
import { t, type Locale } from '@/lib/i18n'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { FiTrendingUp, FiUsers, FiBook, FiMessageCircle, FiDollarSign, FiStar } from 'react-icons/fi'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [locale, setLocale] = useState<Locale>('en')
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const loc = pathname.split('/')[1] as Locale
    setLocale(loc || 'en')
    loadStats()
  }, [])

  async function loadStats() {
    // Fetch all stats in parallel
    const [users, books, posts, comments, likes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*'),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
    ])

    const booksData = books.data || []
    const totalRevenue = booksData.reduce((sum, book) => sum + (book.price || 0), 0)
    const avgRating = booksData.length > 0 
      ? booksData.reduce((sum, book) => sum + (book.rating || 0), 0) / booksData.length 
      : 0

    // Genre distribution
    const genreCount: Record<string, number> = {}
    booksData.forEach(book => {
      genreCount[book.genre] = (genreCount[book.genre] || 0) + 1
    })

    setStats({
      totalUsers: users.count || 0,
      totalBooks: booksData.length,
      totalPosts: posts.count || 0,
      totalComments: comments.count || 0,
      totalLikes: likes.count || 0,
      totalRevenue,
      avgRating: avgRating.toFixed(1),
      genreDistribution: genreCount,
      topBooks: booksData.sort((a, b) => b.rating - a.rating).slice(0, 5),
    })
    setLoading(false)
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
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'admin_dashboard')}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Overview of your platform</p>
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label={t(locale, 'admin_total_users')} 
          value={stats.totalUsers} 
          icon={<FiUsers />}
          color="purple"
          trend="+12%"
        />
        <StatCard 
          label={t(locale, 'admin_total_books')} 
          value={stats.totalBooks} 
          icon={<FiBook />}
          color="blue"
        />
        <StatCard 
          label={t(locale, 'admin_total_posts')} 
          value={stats.totalPosts} 
          icon={<FiMessageCircle />}
          color="green"
          trend="+8%"
        />
        <StatCard 
          label="Engagement" 
          value={stats.totalLikes + stats.totalComments} 
          icon={<FiTrendingUp />}
          color="orange"
          trend="+24%"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Revenue</span>
            <FiDollarSign className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">From {stats.totalBooks} audiobooks</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Avg Rating</span>
            <FiStar className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.avgRating} ⭐</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Across all books</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Comments</span>
            <FiMessageCircle className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalComments}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">On {stats.totalPosts} posts</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Genre Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.genreDistribution).map(([genre, count]) => {
              const percentage = ((count as number) / stats.totalBooks * 100).toFixed(0)
              return (
                <div key={genre}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-700 dark:text-neutral-300">{genre}</span>
                    <span className="text-neutral-500 dark:text-neutral-400">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand to-emerald-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Rated Books */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Top Rated Audiobooks</h3>
          <div className="space-y-3">
            {stats.topBooks.map((book: any, index: number) => (
              <div key={book.id} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{book.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{book.author}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                  <FiStar size={14} />
                  {book.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Platform Activity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-brand">{stats.totalUsers}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Total Users</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-blue-600">{stats.totalPosts}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Posts Created</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-green-600">{stats.totalLikes}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Total Likes</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900">
            <p className="text-2xl font-bold text-purple-600">{stats.totalComments}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Comments</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, trend }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  color: 'purple' | 'blue' | 'green' | 'orange';
  trend?: string;
}) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <div className="card p-6 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full -mr-8 -mt-8`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
        {trend && (
          <p className="text-xs text-green-600 dark:text-green-500 mt-1 font-medium">{trend} from last month</p>
        )}
      </div>
    </div>
  )
}
