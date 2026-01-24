"use client"
import { useState, useEffect } from 'react'
import { useSocial } from '@/context/social'
import type { Post } from '@/lib/social'
import Link from 'next/link'
import { FiHeart, FiMessageCircle, FiTrash2, FiMoreHorizontal, FiCornerUpLeft, FiAlertTriangle, FiFlag } from 'react-icons/fi'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import { RichText } from './RichText'
import { ReportModal } from '@/components/ReportModal'
import { useRef } from 'react'
import { DEFAULT_AVATAR } from '@/lib/social'

export function SocialPostFull({ initialPost }: { initialPost: Post }) {
  const locale = useLocale()
  const { posts, addComment, like, users } = useSocial()
  // Try to find updated post in context, fallback to initial
  const post = posts.find(p => p.id === initialPost.id) || initialPost
  const [comment, setComment] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const author = users.find(u => u.id === post.userId) || {
    id: post.userId,
    name: 'Unknown',
    username: 'unknown',
    avatar: DEFAULT_AVATAR,
    bio: ''
  }

  const handleReply = (username: string) => {
    setComment(prev => `@${username} ${prev}`)
    inputRef.current?.focus()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {/* Post Header */}
        <div className="p-4 sm:p-6 pb-0 flex items-start gap-4">
          <Link href={`/${locale}/social/profile/${author.username}` as any} className="shrink-0">
             <img src={author.avatar} alt={author.name} className="h-12 w-12 rounded-full object-cover border border-neutral-100 dark:border-neutral-800" />
          </Link>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex justify-between items-start">
               <Link href={`/${locale}/social/profile/${author.username}` as any} className="font-bold text-lg text-neutral-900 dark:text-white hover:text-brand line-clamp-1">
                 {author.name}
               </Link>
               <span className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-2">
                 {timeAgo(post.createdAt)}
               </span>
            </div>
            <Link href={`/${locale}/social/profile/${author.username}` as any} className="text-sm text-neutral-500 hover:underline block -mt-0.5">
              @{author.username}
            </Link>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 sm:px-6 py-4">
          <div className="text-base sm:text-lg text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap break-words leading-relaxed">
            <RichText content={post.content} locale={locale} />
          </div>
        </div>

        {/* Actions Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-6">
          <button 
            onClick={() => like(post.id)} 
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.likedByMe ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400 hover:text-red-500'}`}
          >
            <FiHeart className={post.likedByMe ? 'fill-current' : ''} size={20} />
            {post.likes}
          </button>
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            <FiMessageCircle size={20} />
            {post.comments.length}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-6 space-y-6">
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider px-1">
          {t(locale, 'comments')} ({post.comments.length})
        </h3>
        
        {/* Comment Input */}
        <form 
          className="flex gap-3 items-start" 
          onSubmit={(e) => { 
            e.preventDefault(); 
            if (!comment.trim()) return; 
            addComment(post.id, comment.trim()); 
            setComment('') 
          }}
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t(locale, 'social_write_comment')}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/50 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-800"
            />
            <button 
              type="submit"
              disabled={!comment.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand font-medium text-sm px-3 py-1 hover:bg-brand/10 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              {t(locale, 'social_post_button')}
            </button>
          </div>
        </form>

        <div className="space-y-4 pb-12">
          {post.comments.map(c => (
            <CommentItem 
              key={c.id} 
              id={c.id}
              postId={post.id}
              userId={c.userId} 
              content={c.content} 
              createdAt={c.createdAt} 
              onReply={handleReply}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface CommentItemProps { 
  id?: string
  postId?: string
  userId: string 
  content: string 
  createdAt: string 
  onReply: (username: string) => void 
}

function CommentItem({ id, postId, userId, content, createdAt, onReply }: CommentItemProps) {
  const { users, currentUser, deleteComment } = useSocial()
  const u = users.find(u => u.id === userId) || {
    id: userId,
    name: 'Unknown',
    username: 'unknown',
    avatar: DEFAULT_AVATAR,
    bio: ''
  }
  const locale = useLocale()
  const [showReport, setShowReport] = useState(false)

  return (
    <div className="flex items-start gap-3 group">
      <Link href={`/${locale}/social/profile/${u.username}` as any} className="shrink-0">
         <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl rounded-tl-none px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Link href={`/${locale}/social/profile/${u.username}` as any} className="font-semibold text-sm hover:underline text-neutral-900 dark:text-white">
              {u.name}
            </Link>
            <span className="text-xs text-neutral-400">{timeAgo(createdAt)}</span>
          </div>
          <div className="text-sm text-neutral-700 dark:text-neutral-300 break-words whitespace-pre-wrap leading-relaxed">
            <RichText content={content} locale={locale} />
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-1 ml-2">
          <button 
            onClick={() => onReply(u.username)}
            className="text-xs font-medium text-neutral-500 hover:text-brand transition-colors flex items-center gap-1"
          >
            {t(locale, 'reply')}
          </button>
          {/* Mock Like for now */}
          <button className="text-xs font-medium text-neutral-500 hover:text-red-500 transition-colors flex items-center gap-1">
            {t(locale, 'like')}
          </button>

          <div className="flex-1" />

          {currentUser?.id === userId && id && postId && (
            <button 
              onClick={() => deleteComment(id, postId)}
              className="text-xs text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title={t(locale, 'delete')}
            >
              <FiTrash2 size={12} />
            </button>
          )}

          {currentUser && (
            <>
              <button 
                onClick={() => setShowReport(true)}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors opacity-0 group-hover:opacity-100"
                title="Report"
              >
                <FiFlag size={12} />
              </button>
              {showReport && id && (
                <ReportModal
                  targetId={id}
                  targetType="comment"
                  onClose={() => setShowReport(false)}
                />
              )}
            </>
          )}
        </div>
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
