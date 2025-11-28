"use client"
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import { FollowButton } from './FollowButton'
import { User } from '@/lib/social'

interface UserHoverCardProps {
  userId: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function UserHoverCard({ userId, children, disabled = false, className = 'relative inline-block' }: UserHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const locale = useLocale()
  const supabase = createClient()

  const handleMouseEnter = () => {
    if (disabled) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
    if (!user && !loading) {
      fetchUser()
    }
  }

  const handleMouseLeave = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 300) // Delay closing to allow moving mouse to the card
  }

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
          following: followingCount || 0
        })
      }
    } catch (error) {
      console.error('Error fetching user for hover card:', error)
    } finally {
      setLoading(false)
    }
  }

  if (disabled) return <div className={className}>{children}</div>

  return (
    <div 
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isOpen && (
        <div 
          className="absolute z-50 top-full left-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-in fade-in zoom-in-95 duration-200"
          style={{ transformOrigin: 'top left' }}
        >
          {loading && !user ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
            </div>
          ) : user ? (
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <Link href={`/${locale}/social/profile/${user.id}` as any}>
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-14 w-14 rounded-full object-cover border-2 border-white dark:border-neutral-900" 
                  />
                </Link>
                <FollowButton userId={user.id} size="sm" />
              </div>
              
              <div>
                <Link 
                  href={`/${locale}/social/profile/${user.id}` as any}
                  className="font-bold text-neutral-900 dark:text-white hover:underline block"
                >
                  {user.name}
                </Link>
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
        </div>
      )}
    </div>
  )
}
