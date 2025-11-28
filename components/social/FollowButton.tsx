import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import { useSocial } from '@/context/social'

interface FollowButtonProps {
  userId: string
  initialIsFollowing?: boolean
  showCount?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function FollowButton({ 
  userId, 
  initialIsFollowing = false,
  showCount = false,
  size = 'md',
  className = ''
}: FollowButtonProps) {
  const { follow, unfollow, isFollowing: checkIsFollowing, currentUser } = useSocial()
  const [loading, setLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(0) // We might need to fetch this or pass it in
  const locale = useLocale()
  
  // Use context state if available, otherwise fallback to initial
  const isFollowing = checkIsFollowing(userId)

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!currentUser) {
      window.location.href = `/${locale}/login`
      return
    }

    setLoading(true)
    try {
      if (isFollowing) {
        await unfollow(userId)
        setFollowerCount(prev => Math.max(0, prev - 1))
      } else {
        await follow(userId)
        setFollowerCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }

  const buttonSize = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  const buttonStyle = isFollowing
    ? 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
    : 'bg-brand text-white hover:bg-brand/90'

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`${buttonSize} ${buttonStyle} rounded-lg font-medium transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <span className="inline-block animate-spin">⏳</span>
      ) : isFollowing ? (
        t(locale, 'unfollow')
      ) : (
        t(locale, 'follow')
      )}
      {showCount && followerCount > 0 && ` (${followerCount})`}
    </button>
  )
}
