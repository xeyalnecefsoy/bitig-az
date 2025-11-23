"use client"
import { useState } from 'react'
import { useSocial } from '@/context/social'
import { FiHeart, FiMessageCircle } from 'react-icons/fi'
import { AiFillHeart } from 'react-icons/ai'
import Link from 'next/link'
import { useLocale } from '@/context/locale'
import { createClient } from '@/lib/supabase/client'
import { FiMoreHorizontal } from 'react-icons/fi'
import { ReportModal } from '@/components/ReportModal'

export function SocialPostCard({ postId }: { postId: string }) {
  const { posts, addComment, like, users } = useSocial()
  const post = posts.find(p => p.id === postId)
  const [comment, setComment] = useState('')
  const [showReport, setShowReport] = useState(false)
  const locale = useLocale()
  const supabase = createClient()
  if (!post) return null
  
  const author = users.find(u => u.id === post.userId) || {
    id: post.userId,
    name: 'Unknown',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`,
    bio: ''
  }

  return (
    <article className="card p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <Link href={`/${locale}/social/profile/${author.id}` as any}>
          <img src={author.avatar} alt={author.name} className="h-10 w-10 rounded-full object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/${locale}/social/profile/${author.id}` as any} className="font-medium leading-tight hover:text-brand line-clamp-1">{author.name}</Link>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo(post.createdAt)}</div>
        </div>
        <div className="relative">
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) {
                alert('You must be logged in to report.')
                return
              }
              setShowReport(true)
            }}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            title="Report Post"
          >
            <FiMoreHorizontal />
          </button>
        </div>
      </header>
      {showReport && (
        <ReportModal
          targetId={post.id}
          targetType="post"
          onClose={() => setShowReport(false)}
        />
      )}
      <Link href={`/${locale}/social/post/${post.id}` as any} className="mt-3 block text-sm sm:text-base whitespace-pre-wrap hover:text-neutral-900 dark:hover:text-neutral-50">
        {post.content}
      </Link>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <button
          onClick={() => like(post.id)}
          className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-brand"
          aria-pressed={post.likedByMe ? 'true' : 'false'}
        >
          {post.likedByMe ? <AiFillHeart className="text-brand" /> : <FiHeart />} {post.likes}
        </button>
        <Link href={`/${locale}/social/post/${post.id}` as any} className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-brand">
          <FiMessageCircle /> {post.comments.length}
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {post.comments.slice(0, 3).map(c => (
          <CommentItem key={c.id} userId={c.userId} content={c.content} createdAt={c.createdAt} />
        ))}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; addComment(post.id, comment.trim()); setComment('') }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment"
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white text-neutral-900 placeholder-neutral-400 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder-neutral-400"
        />
        <button className="btn btn-primary text-sm px-3">Post</button>
      </form>
    </article>
  )
}

function CommentItem({ userId, content, createdAt }: { userId: string; content: string; createdAt: string }) {
  const { users } = useSocial()
  const u = users.find(u => u.id === userId) || {
    id: userId,
    name: 'Unknown',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    bio: ''
  }
  return (
    <div className="flex items-start gap-3">
      <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover" />
      <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100">
        <div className="flex items-center gap-2">
          <span className="font-medium">{u.name}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo(createdAt)}</span>
        </div>
        <div className="mt-0.5">{content}</div>
      </div>
    </div>
  )
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s`
  if (diff < 3600) return `${Math.floor(diff/60)}m`
  if (diff < 86400) return `${Math.floor(diff/3600)}h`
  return `${Math.floor(diff/86400)}d`
}
