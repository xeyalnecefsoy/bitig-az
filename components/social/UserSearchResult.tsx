"use client"
import Link from 'next/link'
import { FollowButton } from './FollowButton'
import { t } from '@/lib/i18n'
import { useLocale } from '@/context/locale'
import { useSocial } from '@/context/social'

export interface SearchedUser {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  bio?: string
}

interface UserSearchResultProps {
  user: SearchedUser
}

export function UserSearchResult({ user }: UserSearchResultProps) {
  const locale = useLocale()
  const { currentUser } = useSocial()
  const isMe = currentUser?.id === user.id
  const profileHref = isMe ? `/${locale}/profile` : `/${locale}/social/profile/${user.username}`

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800">
      <Link href={profileHref as any} className="shrink-0">
        <img 
          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover bg-neutral-100 dark:bg-neutral-800"
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link 
          href={profileHref as any}
          className="font-bold text-neutral-900 dark:text-white hover:underline truncate block"
        >
          {user.username}
        </Link>
        <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
          {user.full_name || `@${user.username}`}
        </div>
        {user.bio && (
          <p className="text-xs text-neutral-500 dark:text-neutral-500 line-clamp-1 mt-0.5">
            {user.bio}
          </p>
        )}
      </div>

      {!isMe && <FollowButton userId={user.id} size="sm" />}
    </div>
  )
}
