"use client"
import { t, type Locale } from '@/lib/i18n'

type Rank = 'novice' | 'reader' | 'bookworm' | 'scholar' | 'ozan' | 'writer'

interface RankBadgeProps {
  rank: Rank
  locale: Locale
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const rankConfig: Record<Rank, { icon: string; color: string; bg: string }> = {
  novice: {
    icon: '📖',
    color: 'text-neutral-600 dark:text-neutral-400',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
  },
  reader: {
    icon: '📚',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  bookworm: {
    icon: '🐛',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  scholar: {
    icon: '🎓',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  ozan: {
    icon: '🎭',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  writer: {
    icon: '✍️',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-900/30 dark:to-amber-900/30',
  },
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
}

export function RankBadge({ rank, locale, size = 'sm', showLabel = true }: RankBadgeProps) {
  const config = rankConfig[rank] || rankConfig.novice
  const rankKey = `rank_${rank}` as const

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses[size]}`}
      title={t(locale, rankKey)}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{t(locale, rankKey)}</span>}
    </span>
  )
}

// Sadəcə ikon göstərmək üçün
export function RankIcon({ rank, size = 16 }: { rank: Rank; size?: number }) {
  const config = rankConfig[rank] || rankConfig.novice
  return (
    <span style={{ fontSize: size }} title={rank}>
      {config.icon}
    </span>
  )
}
