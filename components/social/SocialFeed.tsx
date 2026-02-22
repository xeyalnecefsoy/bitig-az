import { useMemo } from 'react'
import { Post } from '@/lib/social'
import { SocialPostCard } from './SocialPostCard'

interface SocialFeedProps {
  posts: Post[]
  disableHover?: boolean
}

export function SocialFeed({ posts, disableHover = false }: SocialFeedProps) {
  const threads = useMemo(() => {
    const renderedIds = new Set<string>()
    const threadGroups: JSX.Element[] = []

    for (const post of posts) {
      if (renderedIds.has(post.id)) continue

      // Find if this post is part of a thread by the same author
      let rootPost = post
      // Try to find the absolute root within our loaded posts
      while (rootPost.parentPostId) {
        const parent = posts.find(p => p.id === rootPost.parentPostId && p.userId === rootPost.userId)
        if (parent && !renderedIds.has(parent.id)) {
          rootPost = parent
        } else {
          break // Parent not loaded or different author
        }
      }

      // Collect the thread
      const currentThread = [rootPost]
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
          <div key={`thread-${currentThread[0].id}`} className="flex flex-col relative">
            {currentThread.map((p, idx) => (
              <SocialPostCard 
                key={p.id} 
                postId={p.id} 
                isThread={idx > 0} 
                disableHover={disableHover}
              />
            ))}
          </div>
        )
      }
    }

    return threadGroups
  }, [posts, disableHover])

  return <div className="space-y-4">{threads}</div>
}
