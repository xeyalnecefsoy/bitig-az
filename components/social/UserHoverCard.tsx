"use client"
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import { FollowButton } from './FollowButton'
import { User } from '@/lib/social'
import { Skeleton } from '@/components/ui/Skeleton'
import * as HoverCard from '@radix-ui/react-hover-card'
import { RankBadge } from '@/components/RankBadge'

interface UserHoverCardProps {
  userId: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function UserHoverCard({ userId, children, disabled = false, className = '' }: UserHoverCardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const supabase = createClient()

  async function fetchUser() {
    setLoading(true)
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile) {
        // Fetch counts
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId)

        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId)

          setUser({
          id: profile.id,
          name: profile.username || 'Anonymous',
          username: profile.username || 'anonymous',
          avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
          bio: profile.bio,
          joinedAt: profile.updated_at,
          followers: followersCount || 0,
          following: followingCount || 0,
          rank: profile.rank || 'novice'
        })
      }
    } catch (error) {
      console.error('Error fetching user for hover card:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !user && !loading) {
      fetchUser()
    }
  }

  if (disabled) return <div className={className}>{children}</div>

  return (
    <HoverCard.Root open={open} onOpenChange={handleOpenChange} openDelay={300} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <div className={className}>
          {children}
        </div>
      </HoverCard.Trigger>
      
      <HoverCard.Portal>
        <HoverCard.Content 
          className="z-[9999] w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200"
          sideOffset={5}
          collisionPadding={20}
        >
          {loading && !user ? (
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <Link href={`/${locale}/social/profile/${user.username}` as any}>
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-14 w-14 rounded-full object-cover border-2 border-white dark:border-neutral-900" 
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <FollowButton userId={user.id} size="sm" />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/${locale}/social/profile/${user.username}` as any}
                    className="font-bold text-neutral-900 dark:text-white hover:underline block"
                  >
                    {user.name}
                  </Link>
                  {/* @ts-ignore */}
                  <RankBadge 
                    rank={(user.username === 'khayalnajafov' || user.username === 'xeyalnecefsoy' ? 'founder' : (user.rank || 'novice')) as any} 
                    locale={locale} 
                    size="sm" 
                  />
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">@{user.username}</div>
              </div>

              {user.bio && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
                  {user.bio}
                </p>
              )}

              <div className="flex gap-4 text-sm pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="hover:underline cursor-pointer">
                  <span className="font-bold text-neutral-900 dark:text-white">{user.following || 0}</span>{' '}
                  <span className="text-neutral-500">{t(locale, 'following_tab')}</span>
                </div>
                <div className="hover:underline cursor-pointer">
                  <span className="font-bold text-neutral-900 dark:text-white">{user.followers || 0}</span>{' '}
                  <span className="text-neutral-500">{t(locale, 'followers')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-neutral-500 py-2">
              User not found
            </div>
          )}
          <HoverCard.Arrow className="fill-white dark:fill-neutral-900" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}
