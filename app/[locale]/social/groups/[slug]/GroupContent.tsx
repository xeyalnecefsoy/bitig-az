"use client"
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Group } from '@/lib/social'
import { t } from '@/lib/i18n'
import { useSocial } from '@/context/social'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import { SocialComposer } from '@/components/social/SocialComposer'
import { FiUsers, FiMessageCircle, FiCheck, FiX, FiChevronDown } from 'react-icons/fi'
import { createClient } from '@/lib/supabase/client'

// Gradient rəngləri
const gradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-600',
]

function getGradient(name: string) {
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

interface GroupContentProps {
  group: Group
  locale: string
}

type SortOption = 'newest' | 'oldest' | 'popular'

export function GroupContent({ group, locale }: GroupContentProps) {
  const { posts, currentUser } = useSocial()
  const [isMember, setIsMember] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [memberCount, setMemberCount] = useState(group.members_count)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  
  const gradient = getGradient(group.name)
  const initial = group.name.charAt(0).toUpperCase()

  // Group posts - those with matching group_id
  const groupPosts = posts.filter(p => p.groupId === group.id)
  
  // Sorted posts
  const sortedPosts = useMemo(() => {
    const sorted = [...groupPosts]
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'popular':
        return sorted.sort((a, b) => b.likes - a.likes)
      default:
        return sorted
    }
  }, [groupPosts, sortBy])

  // Check if user is member AND fetch real member count
  useEffect(() => {
    async function fetchGroupData() {
      const supabase = createClient()
      
      // Fetch real member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)
      
      if (count !== null) {
        setMemberCount(count)
      }
      
      // Check membership
      if (!currentUser) return
      const { data } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', currentUser.id)
        .single()
      
      setIsMember(!!data)
    }
    fetchGroupData()
  }, [currentUser, group.id])

  // Fetch members when modal opens
  const fetchMembers = async () => {
    setLoadingMembers(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('group_members')
      .select(`
        id,
        role,
        joined_at,
        profiles:user_id (id, username, avatar_url)
      `)
      .eq('group_id', group.id)
      .order('joined_at', { ascending: false })
    
    setMembers(data || [])
    setLoadingMembers(false)
  }

  const handleShowMembers = () => {
    setShowMembers(true)
    fetchMembers()
  }

  const handleJoinLeave = async () => {
    if (!currentUser) {
      alert('Please sign in to join groups')
      return
    }

    setIsJoining(true)
    const supabase = createClient()

    if (isMember) {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', currentUser.id)
      
      setIsMember(false)
      setMemberCount(prev => Math.max(0, prev - 1))
    } else {
      await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: currentUser.id })
      
      setIsMember(true)
      setMemberCount(prev => prev + 1)
    }

    setIsJoining(false)
  }

  return (
    <div className="container-max py-6">
      {/* Back Link */}
      <Link 
        href={`/${locale}/social/groups` as any}
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-4"
      >
        ← {t(locale as any, 'groups_title')}
      </Link>

      {/* Group Header - REDESIGNED */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden mb-6">
        {/* Gradient Banner */}
        <div className={`h-20 sm:h-28 bg-gradient-to-r ${gradient}`} />
        
        {/* Info Section - Proper positioning */}
        <div className="px-4 sm:px-6 pb-5 pt-3 bg-white dark:bg-neutral-900">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Icon - pulled up into banner */}
            <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gradient-to-br ${gradient} border-4 border-white dark:border-neutral-900 shadow-lg flex items-center justify-center shrink-0 -mt-12 sm:-mt-14`}>
              <span className="text-2xl sm:text-3xl font-bold text-white">{initial}</span>
            </div>
            
            {/* Name & Stats - on white/dark background */}
            <div className="flex-1 min-w-0 sm:pt-0">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">{group.name}</h1>
              <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap">
                <button 
                  onClick={handleShowMembers}
                  className="flex items-center gap-1.5 hover:text-brand transition-colors"
                >
                  <FiUsers size={14} />
                  {memberCount} {t(locale as any, 'group_members_count')}
                </button>
                <span className="flex items-center gap-1.5">
                  <FiMessageCircle size={14} />
                  {group.posts_count} {t(locale as any, 'social_stat_posts')}
                </span>
              </div>
              
              {/* Description */}
              <p className="text-neutral-600 dark:text-neutral-400 mt-3 text-sm line-clamp-2">
                {group.description}
              </p>
            </div>

            {/* Join Button */}
            <div className="w-full sm:w-auto mt-2 sm:mt-0">
              <button 
                onClick={handleJoinLeave}
                disabled={isJoining || !currentUser}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${
                  isMember 
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    : 'bg-brand text-neutral-900 hover:bg-brand/90'
                }`}
              >
                {isJoining ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isMember ? (
                  <span className="flex items-center justify-center gap-2">
                    <FiCheck size={16} />
                    {t(locale as any, 'group_joined')}
                  </span>
                ) : (
                  t(locale as any, 'group_join')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        {/* Feed */}
        <div className="space-y-4">
          {/* Post Filter */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t(locale as any, 'group_posts_label')}
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 pr-8 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer"
              >
                <option value="newest">{t(locale as any, 'sort_newest')}</option>
                <option value="oldest">{t(locale as any, 'sort_oldest')}</option>
                <option value="popular">{t(locale as any, 'sort_popular')}</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Composer - only for members */}
          {isMember && currentUser && (
            <div className="mb-4">
              <SocialComposer groupId={group.id} />
            </div>
          )}

          {/* Posts */}
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <SocialPostCard key={post.id} postId={post.id} />
            ))
          ) : (
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-700">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-neutral-500 dark:text-neutral-400">
                {isMember 
                  ? t(locale as any, 'group_empty_member')
                  : t(locale as any, 'group_join_to_view')}
              </p>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold mb-3 text-neutral-900 dark:text-white">{t(locale as any, 'group_about')}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{group.description}</p>
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-sm text-neutral-500">
                <button 
                  onClick={handleShowMembers}
                  className="flex justify-between w-full mb-2 hover:text-brand transition-colors"
                >
                  <span>{t(locale as any, 'group_members_label')}</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{memberCount}</span>
                </button>
                <div className="flex justify-between">
                  <span>{t(locale as any, 'group_posts_label')}</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{group.posts_count}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMembers(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">
                {t(locale as any, 'group_members_modal_title')} ({memberCount})
              </h2>
              <button 
                onClick={() => setShowMembers(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-96 p-4">
              {loadingMembers ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((m) => (
                    <Link
                      key={m.id}
                      href={`/${locale}/social/profile/${m.profiles?.username || m.profiles?.id}` as any}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      onClick={() => setShowMembers(false)}
                    >
                      <img 
                        src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.profiles?.id}`}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 dark:text-white truncate">
                          {m.profiles?.username || 'İstifadəçi'}
                        </div>
                        {m.role === 'admin' && (
                          <span className="text-xs text-brand font-medium">{t(locale as any, 'group_role_admin')}</span>
                        )}
                        {m.role === 'moderator' && (
                          <span className="text-xs text-blue-500 font-medium">{t(locale as any, 'group_role_moderator')}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-500 py-8">{t(locale as any, 'group_no_members')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
