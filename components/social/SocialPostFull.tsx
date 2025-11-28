"use client"
import { useState, useEffect } from 'react'
import { useSocial } from '@/context/social'
import type { Post } from '@/lib/social'
import Link from 'next/link'
import { FiHeart } from 'react-icons/fi'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'

export function SocialPostFull({ initialPost }: { initialPost: Post }) {
  const locale = useLocale()
  const { posts, addComment, like, users } = useSocial()
  // Try to find updated post in context, fallback to initial
  const post = posts.find(p => p.id === initialPost.id) || initialPost
  const [comment, setComment] = useState('')
  
  const author = users.find(u => u.id === post.userId) || {
    id: post.userId,
    name: 'Unknown',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`,
    bio: ''
  }

  return (
    <article className="card p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <img src={author.avatar} alt={author.name} className="h-10 w-10 rounded-full object-cover" />
        <div className="min-w-0">
          <Link href={`/${locale}/social/profile/${author.id}` as any} className="font-medium leading-tight hover:text-brand line-clamp-1">{author.name}</Link>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo(post.createdAt)}</div>
        </div>
      </header>
      <div className="mt-3 text-sm sm:text-base whitespace-pre-wrap">{post.content}</div>
      <div className="mt-4 flex items-center gap-4 text-sm">
        <button onClick={() => like(post.id)} className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-brand" aria-pressed={post.likedByMe ? 'true' : 'false'}>
          <FiHeart className={post.likedByMe ? 'text-brand' : ''} /> {post.likes}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {post.comments.map(c => (
          <CommentItem key={c.id} userId={c.userId} content={c.content} createdAt={c.createdAt} />
        ))}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; addComment(post.id, comment.trim()); setComment('') }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t(locale, 'social_write_comment')}
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white text-neutral-900 placeholder-neutral-400 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder-neutral-400"
        />
        <button className="btn btn-primary text-sm px-3">{t(locale, 'social_post_button')}</button>
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
  const locale = useLocale()
  return (
    <div className="flex items-start gap-3">
      <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover" />
      <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100">
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/social/profile/${u.id}` as any} className="font-medium hover:text-brand">{u.name}</Link>
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
