"use client"
import Link from 'next/link'
import { Group } from '@/lib/social'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import { FiUsers, FiMessageCircle } from 'react-icons/fi'

interface GroupCardProps {
  group: Group
}

// Stabil gradient rəngləri
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

export function GroupCard({ group }: GroupCardProps) {
  const locale = useLocale()
  const gradient = getGradient(group.name)
  const initial = group.name.charAt(0).toUpperCase()

  return (
    <Link 
      href={`/${locale}/social/groups/${group.slug}` as any}
      className="block group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-brand dark:hover:border-brand transition-all hover:shadow-lg hover:shadow-brand/5"
    >
      {/* Mini Banner */}
      <div className={`h-16 bg-gradient-to-r ${gradient} opacity-80`} />
      
      <div className="p-4 -mt-8">
        <div className="flex items-end gap-3 mb-3">
          {/* Icon */}
          <div className={`h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br ${gradient} border-4 border-white dark:border-neutral-900 shadow-lg flex items-center justify-center`}>
            <span className="text-2xl font-bold text-white">{initial}</span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 pb-1">
            <span className="flex items-center gap-1">
              <FiUsers size={12} />
              {group.members_count}
            </span>
            <span className="flex items-center gap-1">
              <FiMessageCircle size={12} />
              {group.posts_count}
            </span>
          </div>
        </div>
        
        <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-brand transition-colors line-clamp-1">
          {group.name}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
          {group.description}
        </p>
      </div>
    </Link>
  )
}
