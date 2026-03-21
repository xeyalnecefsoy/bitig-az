"use client"

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SOCIAL_POST_ENRICHED_SELECT } from '@/lib/socialPostSelect'
import { useSocial } from '@/context/social'
import { SocialFeed } from '@/components/social/SocialFeed'
import type { Post } from '@/lib/social'
import type { Locale } from '@/lib/i18n'
import { t } from '@/lib/i18n'

type ProfilePostsSectionProps = {
  userId: string
  locale: Locale
  disableHover?: boolean
}

/** Loads a user's posts with the same enrichment as the main feed and merges into SocialProvider so SocialPostCard resolves. */
export function ProfilePostsSection({ userId, locale, disableHover = true }: ProfilePostsSectionProps) {
  const supabase = useMemo(() => createClient(), [])
  const { mergePostsFromSupabaseRows } = useSocial()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data: rows } = await supabase
          .from('posts')
          .select(SOCIAL_POST_ENRICHED_SELECT)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (cancelled) return
        if (rows?.length) {
          const mapped = await mergePostsFromSupabaseRows(rows)
          setPosts(mapped)
        } else {
          setPosts([])
        }
      } catch (e) {
        console.error('ProfilePostsSection load failed:', e)
        if (!cancelled) setPosts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, supabase, mergePostsFromSupabaseRows])

  if (loading) {
    return (
      <div className="card p-8 text-center text-neutral-500 dark:text-neutral-400">
        {t(locale, 'loading')}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="card p-6 text-sm text-neutral-600 dark:text-neutral-300">{t(locale, 'profile_no_posts')}</div>
    )
  }

  return <SocialFeed posts={posts} disableHover={disableHover} />
}
