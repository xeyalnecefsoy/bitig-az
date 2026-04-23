import { useMemo } from 'react'
import { Post } from '@/lib/social'
import { SocialPostCard } from './SocialPostCard'
import Link from 'next/link'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'

interface SocialFeedProps {
  posts: Post[]
  disableHover?: boolean
}

const THREAD_PREVIEW_LIMIT = 2

export function SocialFeed({ posts, disableHover = false }: SocialFeedProps) {
  const locale = useLocale()

  const threads = useMemo(() => {
    const renderedIds = new Set<string>()
    const threadGroups: JSX.Element[] = []

    for (const post of posts) {
      if (renderedIds.has(post.id)) continue

      // Find if this post is part of a thread by the same author
      let rootPost = post
      while (rootPost.parentPostId) {
        const parent = posts.find(p => p.id === rootPost.parentPostId && p.userId === rootPost.userId)
        if (parent && !renderedIds.has(parent.id)) {
          rootPost = parent
        } else {
          break
        }
      }

      // Collect the thread
      const currentThread: Post[] = [rootPost]
      renderedIds.add(rootPost.id)

      let lastChild = rootPost
      while (true) {
        const nextChild = posts.find(p => p.parentPostId === lastChild.id && p.userId === rootPost.userId)
        if (nextChild && !renderedIds.has(nextChild.id)) {
          currentThread.push(nextChild)
          renderedIds.add(nextChild.id)
          lastChild = nextChild
        } else {
          break
        }
      }

      const isTruncated = currentThread.length > THREAD_PREVIEW_LIMIT
      const visiblePosts = isTruncated
        ? currentThread.slice(0, THREAD_PREVIEW_LIMIT)
        : currentThread

      // Render the thread group
      if (currentThread.length === 1) {
        threadGroups.push(
          <SocialPostCard
            key={currentThread[0].id}
            postId={currentThread[0].id}
            disableHover={disableHover}
          />
        )
      } else {
        threadGroups.push(
          <div key={`thread-${currentThread[0].id}`} className="card overflow-hidden">
            {visiblePosts.map((p, idx) => (
              <SocialPostCard
                key={p.id}
                postId={p.id}
                isThread={idx > 0}
                inThread={true}
                isLastInThread={idx === visiblePosts.length - 1 && !isTruncated}
                threadPosition={idx + 1}
                threadTotal={currentThread.length}
                disableHover={disableHover}
              />
            ))}
            {isTruncated && (
              <Link
                href={`/${locale}/social/post/${rootPost.id}`}
                className="block px-4 sm:px-5 py-3 text-sm font-medium text-brand hover:underline border-t border-neutral-200 dark:border-neutral-800"
              >
                {t(locale, 'show_this_thread')} →
              </Link>
            )}
          </div>
        )
      }
    }

    return threadGroups
  }, [posts, disableHover, locale])

  return <div className="space-y-4">{threads}</div>
}
