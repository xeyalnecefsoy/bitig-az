"use client"
import { useState, useMemo } from 'react'
import { Group } from '@/lib/social'
import { t } from '@/lib/i18n'
import { GroupCard } from '@/components/social/GroupCard'
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi'
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

      <div className="mb-8 text-center space-y-3">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          {t(locale as any, 'groups_title')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
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
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          {searchQuery 
            ? t(locale as any, 'no_search_results')
            : t(locale as any, 'no_groups_found')}
        </div>
      )}
    </div>
  )
}
