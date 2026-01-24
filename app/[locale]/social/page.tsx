"use client"
import { useState, useMemo } from 'react'
import { useSocial } from '@/context/social'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import { SocialComposer } from '@/components/social/SocialComposer'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import { FiSearch, FiChevronDown, FiX } from 'react-icons/fi'
import { PostCardSkeleton } from '@/components/ui/Skeleton'

import { createClient } from '@/lib/supabase/client'
import { UserSearchResult, type SearchedUser } from '@/components/social/UserSearchResult'
import { useEffect, useRef } from 'react'

type SortOption = 'newest' | 'oldest' | 'popular'

export default function SocialPage() {
  const { posts, currentUser, following, loadMorePosts, hasMorePosts, loading } = useSocial()
  const [tab, setTab] = useState<'feed' | 'following'>('feed')
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const supabase = createClient()
  const locale = useLocale()
  
  // User Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedUsers([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(5)
        
        if (data) {
          setSearchedUsers(data)
        }
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setIsSearchingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = tab === 'feed' 
      ? posts 
      : posts.filter(p => following.includes(p.userId))
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.content.toLowerCase().includes(query)
      )
    }
    
    // Sort
    switch (sortBy) {
      case 'newest':
        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'oldest':
        return result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'popular':
        return result.sort((a, b) => b.likes - a.likes)
      default:
        return result
    }
  }, [posts, tab, following, searchQuery, sortBy])
    
  // If tab is following but user is guest, switch to feed
  if (tab === 'following' && !currentUser) setTab('feed')

  const handleLoadMore = async () => {
    setLoadingMore(true)
    await loadMorePosts()
    setLoadingMore(false)
  }

  return (
    <section className="container-max py-6 sm:py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4 sm:space-y-5">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'nav_social')}</h1>
        </div>

        <div className="mb-6 flex gap-4 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setTab('feed')}
            className={`pb-3 text-sm font-medium transition-colors ${tab === 'feed' ? 'border-b-2 border-brand text-brand' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
          >
            {t(locale, 'social_community_feed')}
          </button>
          {currentUser && (
            <button
              onClick={() => setTab('following')}
              className={`pb-3 text-sm font-medium transition-colors ${tab === 'following' ? 'border-b-2 border-brand text-brand' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
            >
              {t(locale, 'following_tab')}
            </button>
          )}
          <Link
            href={`/${locale}/social/groups` as any}
            className="pb-3 text-sm font-medium transition-colors text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 ml-auto flex items-center gap-1"
          >
            {t(locale, 'groups_title')}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(locale, 'search_posts_placeholder')}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none w-full sm:w-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer"
            >
              <option value="newest">{t(locale, 'sort_newest')}</option>
              <option value="oldest">{t(locale, 'sort_oldest')}</option>
              <option value="popular">{t(locale, 'sort_popular')}</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="space-y-6">
            {/* Users Results */}
            {(searchedUsers.length > 0 || isSearchingUsers) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1">
                  {t(locale, 'section_users')}
                </h3>
                {isSearchingUsers ? (
                   <div className="flex items-center gap-2 p-4 text-sm text-neutral-500">
                     <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                     {t(locale, 'social_loading')}
                   </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {searchedUsers.map(user => (
                      <UserSearchResult key={user.id} user={user} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Posts Header */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t(locale, 'section_posts')}
              </h3>
              <span className="text-sm text-neutral-500">
                {filteredPosts.length} {t(locale, 'search_results_count')}
              </span>
            </div>
          </div>
        )}

        <SocialComposer />
        
        {/* Show skeleton while loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}
        
        {/* Show posts or empty state only after loading completes */}
        {!loading && filteredPosts.length > 0 && (
          filteredPosts.map((p) => (
            <SocialPostCard key={p.id} postId={p.id} />
          ))
        )}
        
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            {searchQuery 
              ? t(locale, 'no_search_results')
              : t(locale, 'no_posts_yet')}
          </div>
        )}
        
        {hasMorePosts && !searchQuery && (
          <div className="flex justify-center py-4">
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="btn btn-outline"
            >
              {loadingMore ? t(locale, 'social_loading') : t(locale, 'social_load_more')}
            </button>
          </div>
        )}
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-2">{t(locale, 'social_what_is_title')}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{t(locale, 'social_what_is_desc')}</p>
          </div>
          
          <div className="card p-5">
            <h2 className="font-semibold mb-2">{t(locale, 'groups_title')}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{t(locale, 'groups_desc')}</p>
            <Link href={`/${locale}/social/groups` as any} className="btn btn-outline w-full justify-center text-sm">
              {t(locale, 'view_all')}
            </Link>
          </div>
        </div>
      </aside>
    </section>
  )
}
