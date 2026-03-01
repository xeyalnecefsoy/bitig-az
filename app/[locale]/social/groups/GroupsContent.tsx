"use client"
import { useState, useMemo } from 'react'
import { Group } from '@/lib/social'
import { t } from '@/lib/i18n'
import { GroupCard } from '@/components/social/GroupCard'
import { FiSearch, FiX, FiChevronDown, FiUsers } from 'react-icons/fi'
import Link from 'next/link'

interface GroupsContentProps {
  groups: Group[]
  locale: string
}

type SortOption = 'popular' | 'newest' | 'alphabetical'

export function GroupsContent({ groups, locale }: GroupsContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('popular')

  // Filter and sort groups
  const filteredGroups = useMemo(() => {
    let result = [...groups]
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(g => 
        g.name.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query)
      )
    }
    
    // Sort
    switch (sortBy) {
      case 'popular':
        return result.sort((a, b) => b.members_count - a.members_count)
      case 'newest':
        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'alphabetical':
        return result.sort((a, b) => a.name.localeCompare(b.name, 'az'))
      default:
        return result
    }
  }, [groups, searchQuery, sortBy])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link 
        href={`/${locale}/social` as any}
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-6"
      >
        ← {t(locale as any, 'nav_social')}
      </Link>

      <div className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand mb-2 ring-1 ring-brand/20 dark:ring-brand/30 shadow-inner">
          <FiUsers className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl pr-1 font-bold text-neutral-900 dark:text-white tracking-tight">
          {t(locale as any, 'groups_title')}
        </h1>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed px-4">
          {t(locale as any, 'groups_desc')}
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(locale as any, 'search_groups_placeholder')}
            className="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm sm:text-base transition-all shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700"
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
            className="appearance-none w-full sm:w-auto min-w-[160px] bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-3.5 pr-12 text-sm sm:text-base font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer"
          >
            <option value="popular">{t(locale as any, 'sort_popular')}</option>
            <option value="newest">{t(locale as any, 'sort_newest')}</option>
            <option value="alphabetical">{t(locale as any, 'sort_alphabetical')}</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          {filteredGroups.length} {t(locale as any, 'search_groups_results')} "{searchQuery}"
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {filteredGroups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 mb-6 rounded-full bg-neutral-100 dark:bg-neutral-800/50 flex items-center justify-center">
            <FiSearch className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            {searchQuery 
              ? t(locale as any, 'no_search_results')
              : t(locale as any, 'no_groups_found')}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm">
            {searchQuery 
              ? "Axtarışınıza uyğun heç bir icma tapılmadı. Zəhmət olmasa fərqli açar sözlərlə yenidən cəhd edin." 
              : "Hazırda heç bir icma mövcud deyil. Tezliklə yeni icmalar əlavə olunacaq."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-6 px-6 py-2.5 rounded-xl bg-brand/10 text-brand font-medium hover:bg-brand/20 transition-colors"
            >
              Axtarışı təmizlə
            </button>
          )}
        </div>
      )}
    </div>
  )
}
