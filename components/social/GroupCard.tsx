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
      {/* Banner Area */}
      {group.cover_url ? (
        <div className="h-28 w-full relative overflow-hidden">
          <img src={group.cover_url} alt={`${group.name} banner`} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      ) : (
        <div className={`h-24 bg-gradient-to-r ${gradient} opacity-90 relative overflow-hidden`}>
          {/* Subtle overlay pattern */}
          <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white space-y-2 to-transparent mix-blend-overlay"></div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-black/10 blur-2xl"></div>
        </div>
      )}
      
      <div className="p-5 -mt-10 relative z-10 w-full">
        <div className="flex items-end justify-between gap-3 mb-4 w-full">
          {/* Icon */}
          {group.icon_url ? (
            <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden border-4 border-white dark:border-neutral-900 shadow-md transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
               <img src={group.icon_url} alt={group.name} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className={`h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} border-4 border-white dark:border-neutral-900 shadow-md flex items-center justify-center transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300`}>
              <span className="text-2xl font-black text-white drop-shadow-sm">{initial}</span>
            </div>
          )}
          
          {/* Join/View Button */}
          <div className="px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-600 dark:text-neutral-300 group-hover:bg-brand group-hover:text-white transition-colors duration-300 shadow-sm mb-1">
            Bax
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-brand transition-colors line-clamp-1 mb-1.5 drop-shadow-sm">
          {group.name}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 min-h-[40px] leading-relaxed">
          {group.description}
        </p>
        
        {/* Stats */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400">
              <FiUsers size={14} />
            </div>
            {group.members_count} {t(locale as any, 'group_members_count')}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400">
              <FiMessageCircle size={14} />
            </div>
            {group.posts_count} {t(locale as any, 'social_stat_posts')}
          </div>
        </div>
      </div>
    </Link>
  )
}
