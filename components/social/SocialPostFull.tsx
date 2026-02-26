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
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useRef } from 'react'
import { DEFAULT_AVATAR } from '@/lib/social'
import { calculatePollPercentages } from '@/lib/pollUtils'
import { FiEdit2, FiCopy, FiMessageSquare } from 'react-icons/fi'
import * as Popover from '@radix-ui/react-popover'

export function SocialPostFull({ initialPost }: { initialPost: Post }) {
  const locale = useLocale()
  const { posts, addComment, like, users, voteOnPoll, currentUser, deletePost } = useSocial()
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

          {/* Options Dropdown */}
          <div className="flex items-center gap-2">
            {post.userId === currentUser?.id && (
              <button 
                onClick={() => {
                  if (confirm(t(locale, 'confirm_delete_post') || 'Are you sure?')) {
                    deletePost(post.id)
                  }
                }}
                className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title={t(locale, 'delete_post')}
              >
                <FiTrash2 size={16} />
              </button>
            )}
            <div className="relative group">
              <button className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <FiMoreHorizontal size={18} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/${locale}/social/post/${post.id}`
                    navigator.clipboard.writeText(url)
                    alert(t(locale, 'link_copied') || "Link kopyalandı!")
                  }}
                  className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2"
                >
                  <FiCopy size={14} className="opacity-70" /> {t(locale, 'copy_link') || "URL kopyala"}
                </button>
                <button
                  onClick={() => alert("Report logic here")}
                  className="w-full text-left p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors text-sm text-red-600 dark:text-red-400 font-medium border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1 flex items-center gap-2"
                >
                  <FiAlertTriangle size={14} className="opacity-70" /> {t(locale, 'report_post') || "Şikayət et"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 sm:px-6 py-4">
          <div className="text-base sm:text-lg text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap break-words leading-relaxed">
            <RichText content={post.content} locale={locale} />
          </div>
        </div>

        {/* Poll Rendering */}
        {post.poll && (
          <div className="px-4 sm:px-6 pb-4">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 sm:p-5">
              <div className="space-y-3">
                {post.poll.options.map((opt, idx) => {
                  const showResults = post.poll?.hasExpired || opt.hasVoted;
                  const percentages = post.poll ? calculatePollPercentages(post.poll.options, post.poll.totalVotes) : [];
                  const percentage = percentages[idx] || 0;
                  const isWinning = showResults && post.poll && opt.votesCount === Math.max(...post.poll.options.map(o => o.votesCount));

                  return (
                    <div key={opt.id} className="relative">
                      {!showResults ? (
                        <button
                          onClick={() => voteOnPoll(post.id, opt.id)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-brand/30 hover:border-brand hover:bg-brand/5 dark:border-brand/40 dark:hover:border-brand text-[15px] font-medium transition-colors text-neutral-800 dark:text-neutral-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-400 dark:border-neutral-500 flex items-center justify-center shrink-0"></div>
                            <span className="truncate">{opt.text}</span>
                          </div>
                        </button>
                      ) : (
                        <div className="relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent">
                          <div 
                            className={`absolute top-0 bottom-0 left-0 ${isWinning ? 'bg-brand/20 dark:bg-brand/30' : 'bg-neutral-200 dark:bg-neutral-700'}`} 
                            style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}
                          ></div>
                          <div className="relative px-4 py-3 flex justify-between items-center text-[15px] font-medium">
                            <div className="flex items-center gap-2 truncate pr-4">
                              <span className={`truncate ${isWinning ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                {opt.text}
                              </span>
                              {opt.hasVoted && (
                                <svg className="w-4.5 h-4.5 text-brand shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className={`shrink-0 ${isWinning ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span>{post.poll.totalVotes} {t(locale, 'votes') || 'səs'}</span>
              </div>
            </div>
          </div>
        )}

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
              postOwnerId={post.userId}
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
  postOwnerId?: string
  onReply: (username: string) => void 
}

function CommentItem({ id, postId, userId, content, createdAt, postOwnerId, onReply }: CommentItemProps) {
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
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

          {/* 3-dot menu */}
          <Popover.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <Popover.Trigger asChild>
              <button
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                title={t(locale, 'more_options') || "Daha çox"}
              >
                <FiMoreHorizontal size={14} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="w-44 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 p-1 z-50 animate-in fade-in zoom-in-95 duration-200"
                align="end"
                sideOffset={5}
              >
                {(currentUser?.id === userId || currentUser?.id === postOwnerId) && id && postId && (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false)
                      setShowDeleteConfirm(true)
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-xs text-red-600 dark:text-red-400 font-medium"
                  >
                    <FiTrash2 size={12} />
                    {t(locale, 'delete_comment')}
                  </button>
                )}
                {currentUser && (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false)
                      setShowReport(true)
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-xs text-neutral-600 dark:text-neutral-400 font-medium"
                  >
                    <FiFlag size={12} />
                    {t(locale, 'report_comment') || "Şikayət et"}
                  </button>
                )}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {/* Dialogs */}
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            title={t(locale, 'delete_comment')}
            message={t(locale, 'confirm_delete_comment_desc')}
            confirmLabel={t(locale, 'confirm_btn')}
            cancelLabel={t(locale, 'cancel_btn')}
            variant="danger"
            isLoading={isDeleting}
            onConfirm={async () => {
              setIsDeleting(true)
              if (id && postId) await deleteComment(id, postId, postOwnerId)
              setShowDeleteConfirm(false)
              setIsDeleting(false)
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
          {showReport && id && (
            <ReportModal
              targetId={id}
              targetType="comment"
              onClose={() => setShowReport(false)}
            />
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
