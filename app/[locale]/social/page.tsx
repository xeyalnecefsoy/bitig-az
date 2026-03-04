"use client"
import { useState, useMemo } from 'react'
import { useSocial } from '@/context/social'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import { SocialComposer } from '@/components/social/SocialComposer'
import { SocialFeed } from '@/components/social/SocialFeed'
import { SocialLoginPrompt } from '@/components/social/SocialLoginPrompt'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import { FiSearch, FiChevronDown, FiX } from 'react-icons/fi'
import { PostCardSkeleton } from '@/components/ui/Skeleton'

import { createClient } from '@/lib/supabase/client'
import { UserSearchResult, type SearchedUser } from '@/components/social/UserSearchResult'
import { useEffect, useRef, useCallback } from 'react'

type SortOption = 'newest' | 'oldest' | 'popular'

export default function SocialPage() {
  const { posts, currentUser, following, loadMorePosts, loadForYouPosts, hasMorePosts, loading } = useSocial()
  const [tab, setTab] = useState<'foryou' | 'feed' | 'following'>('foryou')
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([])
  const [userSearchFilter, setUserSearchFilter] = useState<'all' | 'following'>('all')
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const supabase = createClient()
  const locale = useLocale()
  
  // User Search & Debounce Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      setDebouncedSearchQuery(searchQuery)

      if (!searchQuery.trim()) {
        setSearchedUsers([])
        setIsSearchingUsers(false)
        return
      }

      setIsSearchingUsers(true)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .order('full_name', { ascending: true })
          .order('username', { ascending: true })
          .limit(10)
        
        if (data) {
          // Sort computationally: Give priority to users we ARE following (per user request), 
          // while preserving the alphabetical order we got from the DB.
          // Also always put the current user at the very end if they search themselves.
          const sortedUsers = [...data].sort((a, b) => {
             if (currentUser) {
               if (a.id === currentUser.id) return 1;
               if (b.id === currentUser.id) return -1;
               
               const aFollowed = following.includes(a.id);
               const bFollowed = following.includes(b.id);
               
               if (aFollowed === bFollowed) return 0;
               return aFollowed ? -1 : 1; // Followed users first
             }
             return 0;
          });
          setSearchedUsers(sortedUsers)
        }
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setIsSearchingUsers(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // When tab changes, load appropriate posts
  useEffect(() => {
    if (tab === 'foryou') {
      loadForYouPosts()
    } else {
      // Feed and following are handled by the main posts state currently loaded
      // Ideally, we'd have dedicated loaders, but for now we fallback to standard loaded posts
    }
  }, [tab])

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = posts 
    
    if (tab === 'following') {
      result = posts.filter(p => following.includes(p.userId))
    }
    
    // Search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      result = result.filter(p => 
        p.content.toLowerCase().includes(query)
      )
    }
    
    // Sort
    const sortedResult = [...result]
    switch (sortBy) {
      case 'newest':
        return sortedResult.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'oldest':
        return sortedResult.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'popular':
        return sortedResult.sort((a, b) => b.likes - a.likes)
      default:
        return sortedResult
    }
  }, [posts, tab, following, searchQuery, sortBy])
    
  // If tab is following but user is guest, switch to foryou
  if (tab === 'following' && !currentUser) setTab('foryou')

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMorePosts) return
    setLoadingMore(true)
    await loadMorePosts()
    setLoadingMore(false)
  }, [loadingMore, hasMorePosts, loadMorePosts])

  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !loadingMore && !searchQuery) {
          handleLoadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMorePosts, loadingMore, searchQuery, handleLoadMore])

  return (
    <section className="container-max py-6 sm:py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4 sm:space-y-5 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'nav_social')}</h1>
        </div>

        <div className="mb-6 flex gap-4 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setTab('foryou')}
            className={`pb-2 whitespace-nowrap text-sm font-medium transition-colors ${tab === 'foryou' ? 'border-b-2 border-brand text-brand' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
          >
            Sizin Üçün
          </button>
          <button
            onClick={() => setTab('feed')}
            className={`pb-2 whitespace-nowrap text-sm font-medium transition-colors ${tab === 'feed' ? 'border-b-2 border-brand text-brand' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
          >
            Ən Yenilər
          </button>
          {currentUser && (
            <button
              onClick={() => setTab('following')}
              className={`pb-2 whitespace-nowrap text-sm font-medium transition-colors ${tab === 'following' ? 'border-b-2 border-brand text-brand' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
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

            {/* Floating User Search Results */}
            {searchQuery && (searchedUsers.length > 0 || isSearchingUsers) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t(locale, 'section_users')}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setUserSearchFilter('all')}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${userSearchFilter === 'all' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                      >
                        Hamısı
                      </button>
                      <button 
                        onClick={() => setUserSearchFilter('following')}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${userSearchFilter === 'following' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                      >
                        İzlədiklərim
                      </button>
                    </div>
                  </div>
                  {isSearchingUsers ? (
                     <div className="flex items-center gap-2 p-3 text-sm text-neutral-500">
                       <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                       {t(locale, 'social_loading') || 'Axtarılır...'}
                     </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {searchedUsers.filter(u => userSearchFilter === 'all' || following.includes(u.id)).length > 0 ? (
                        searchedUsers.filter(u => userSearchFilter === 'all' || following.includes(u.id)).map(user => (
                          <div key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors">
                            <UserSearchResult user={user} />
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-neutral-500 text-center">Nəticə tapılmadı</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
        {debouncedSearchQuery && (
          <div className="space-y-4 mb-6">
            <div className="bg-brand/5 dark:bg-brand/10 p-5 rounded-2xl border border-brand/20 flex gap-4 items-start">
               <div className="p-2 bg-brand/10 dark:bg-brand/20 rounded-xl text-brand">
                 <FiSearch className="w-5 h-5" />
               </div>
               <div>
                  <h2 className="font-semibold text-neutral-900 dark:text-white text-lg">
                    "{debouncedSearchQuery}" üçün tapılan paylaşımlar
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    "{debouncedSearchQuery}" kəliməsinə görə {filteredPosts.length > 0 ? `${filteredPosts.length} nəticə tapıldı` : 'heç bir nəticə tapılmadı'}. Axtarışı təmizləyərək yenidən normal axına (Feed) qayıda bilərsiniz.
                  </p>
               </div>
            </div>
          </div>
        )}

        {currentUser ? (
          <SocialComposer />
        ) : (
          !loading && <SocialLoginPrompt />
        )}
        
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
          <SocialFeed posts={filteredPosts} />
        )}
        
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            {searchQuery 
              ? t(locale, 'no_search_results')
              : t(locale, 'no_posts_yet')}
          </div>
        )}
        
        {hasMorePosts && !debouncedSearchQuery && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                {t(locale, 'social_loading') || 'Yüklənir...'}
              </div>
            )}
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
