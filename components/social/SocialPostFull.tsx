"use client"
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSocial } from '@/context/social'
import type { Post } from '@/lib/social'
import Link from 'next/link'
import { FiHeart, FiMessageCircle, FiTrash2, FiMoreHorizontal, FiCornerUpLeft, FiAlertTriangle, FiFlag, FiRepeat, FiX, FiChevronLeft, FiChevronRight, FiEdit2, FiCopy, FiMessageSquare } from 'react-icons/fi'
import { AiFillHeart } from 'react-icons/ai'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import { RichText } from './RichText'
import { ExternalLinkPreviewCard } from './ExternalLinkPreviewCard'
import { SocialComposer } from './SocialComposer'
import { QuotedPostCard } from './QuotedPostCard'
import { ReportModal } from '@/components/ReportModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { calculatePollPercentages } from '@/lib/pollUtils'
import * as Popover from '@radix-ui/react-popover'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { buildCommentThreads, isCommentEdited, type CommentThread } from '@/lib/commentTree'
import { UserHoverCard } from './UserHoverCard'

export function SocialPostFull({ initialPost }: { initialPost: Post }) {
  const locale = useLocale()
  const { posts, addComment, like, likeComment, users, voteOnPoll, currentUser, deletePost, editComment } = useSocial()
  // Try to find updated post in context, fallback to initial
  const post = posts.find(p => p.id === initialPost.id) || initialPost
  const [comment, setComment] = useState('')
  const [showQuoteComposer, setShowQuoteComposer] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [imageSlide, setImageSlide] = useState(0)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [showReportPost, setShowReportPost] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  const commentThreads = useMemo(() => buildCommentThreads(post.comments), [post.comments])
  
  const author = users.find(u => u.id === post.userId) || {
    id: post.userId,
    name: 'Unknown',
    username: 'unknown',
    avatar: `/api/avatar?name=${post.userId}`,
    bio: ''
  }

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username })
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {showReportPost && (
        <ReportModal
          targetId={post.id}
          targetType="post"
          onClose={() => setShowReportPost(false)}
        />
      )}
      {post.status === 'rejected' && currentUser?.id === post.userId && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg flex flex-col gap-1.5 text-sm font-medium border border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="shrink-0" />
            {t(locale, 'post_hidden_alert') || "Sistem Bildirişi: Bu paylaşım qaydaları pozduğu üçün gizlədilib."}
          </div>
          {post.rejectedAt && (
            <div className="text-xs text-red-500/80 dark:text-red-400/70 pl-6">
              {t(locale, 'post_auto_delete_warning') || "Bu paylaşım 30 gün ərzində avtomatik silinəcək."}{' '}
              <span className="font-semibold">
                {(() => {
                  const deleteDate = new Date(post.rejectedAt)
                  deleteDate.setDate(deleteDate.getDate() + 30)
                  const now = new Date()
                  const daysLeft = Math.max(0, Math.ceil((deleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                  return locale === 'az' 
                    ? `(${daysLeft} gün qalıb)` 
                    : `(${daysLeft} days left)`
                })()}
              </span>
            </div>
          )}
        </div>
      )}
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
                    toast.success(t(locale, 'link_copied') || "Link kopyalandı!")
                  }}
                  className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2"
                >
                  <FiCopy size={14} className="opacity-70" /> {t(locale, 'copy_link') || "URL kopyala"}
                </button>
                {currentUser?.id !== post.userId && (
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        toast.error(locale === 'az' ? 'Daxil olmalısınız.' : 'You must be logged in to report.')
                        return
                      }
                      setShowReportPost(true)
                    }}
                    className="w-full text-left p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors text-sm text-red-600 dark:text-red-400 font-medium border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1 flex items-center gap-2"
                  >
                    <FiAlertTriangle size={14} className="opacity-70" /> {t(locale, 'report_post') || "Şikayət et"}
                  </button>
                )}
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

        {post.linkPreview && (
          <div className="px-4 sm:px-6">
            <ExternalLinkPreviewCard preview={post.linkPreview} />
          </div>
        )}

        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="px-4 sm:px-6 pb-4">
            <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${imageSlide * 100}%)` }}
              >
                {post.imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="w-full min-w-full shrink-0 relative aspect-video sm:aspect-[21/9] max-h-[min(420px,50vh)] overflow-hidden bg-neutral-100 dark:bg-neutral-900"
                  >
                    <img
                      src={url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
              {post.imageUrls.length > 1 && (
                <>
                  {imageSlide > 0 && (
                    <button
                      type="button"
                      onClick={() => setImageSlide(s => s - 1)}
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {imageSlide < post.imageUrls.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setImageSlide(s => s + 1)}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  )}
                  <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                    {imageSlide + 1} / {post.imageUrls.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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

        {post.mentionedBook && (
          <div className="px-4 sm:px-6 pb-4">
            <Link
              href={`/${locale}/audiobooks/${post.mentionedBook.id}` as any}
              className="block bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700 hover:border-brand/30 dark:hover:border-brand/30 transition-colors group max-w-sm"
            >
              <div className="flex items-center gap-3 p-3">
                {post.mentionedBook.coverUrl ? (
                  <img
                    src={post.mentionedBook.coverUrl}
                    className="h-14 w-10 object-cover rounded shadow-sm group-hover:scale-105 transition-transform shrink-0"
                    alt={post.mentionedBook.title}
                  />
                ) : (
                  <div className="h-14 w-10 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center shrink-0">
                    <span className="text-lg">📚</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-brand font-medium mb-0.5 uppercase tracking-wide flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-brand" />
                    {t(locale, 'mentioned_book')}
                  </div>
                  <h4 className="font-medium text-sm text-neutral-900 dark:text-white truncate group-hover:text-brand transition-colors">
                    {post.mentionedBook.title}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{post.mentionedBook.author}</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {post.quotedPost && (
          <div className="px-4 sm:px-6 pb-4">
            <QuotedPostCard
              quoted={post.quotedPost}
              quotedAuthor={
                users.find((u) => u.id === post.quotedPost!.userId) ?? {
                  name: 'User',
                  username: 'unknown',
                  avatar: `/api/avatar?name=${post.quotedPost.userId}`,
                }
              }
              locale={locale}
            />
          </div>
        )}

        {/* Actions Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-6 flex-wrap">
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
          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                toast.error(t(locale, 'social_sign_in_prompt'))
                return
              }
              setShowQuoteComposer(true)
            }}
            className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-brand transition-colors"
            title={t(locale, 'social_quote')}
            aria-label={t(locale, 'social_quote')}
          >
            <FiRepeat size={20} />
            {t(locale, 'social_quote')}
          </button>
        </div>
      </div>

      {portalReady &&
        showQuoteComposer &&
        currentUser &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4"
            role="presentation"
            onClick={() => setShowQuoteComposer(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="flex max-h-[min(92vh,880px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-neutral-800 dark:bg-neutral-950"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                <span className="font-semibold text-neutral-900 dark:text-white">{t(locale, 'social_quote')}</span>
                <button
                  type="button"
                  onClick={() => setShowQuoteComposer(false)}
                  className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <SocialComposer
                  quotedPostId={post.id}
                  onPostCreated={() => setShowQuoteComposer(false)}
                  isInlineReply={false}
                  quoteOverlayChrome
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

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
            addComment(post.id, comment.trim(), replyingTo?.id ?? null); 
            setComment('') 
            setReplyingTo(null)
          }}
        >
          <div className="flex-1 relative">
            {replyingTo && (
              <div className="flex items-center justify-between gap-2 mb-2 text-xs text-neutral-500 dark:text-neutral-400 px-1">
                <span>
                  {t(locale, 'social_comment_replying_to').replace('{username}', replyingTo.username)}
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="font-medium text-brand hover:underline"
                >
                  {t(locale, 'cancel_btn')}
                </button>
              </div>
            )}
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

        <div className="max-h-[min(70vh,640px)] space-y-4 overflow-y-auto rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 pb-4 dark:border-neutral-800 dark:bg-neutral-900/30 sm:p-4">
          {commentThreads.map((thread) => (
            <CommentThreadBlock
              key={thread.id}
              thread={thread}
              depth={0}
              postId={post.id}
              postOwnerId={post.userId}
              onReplyClick={handleReplyClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface CommentItemProps {
  id: string
  postId: string
  userId: string
  content: string
  createdAt: string
  updatedAt?: string | null
  postOwnerId: string
  likes?: number
  likedByMe?: boolean
  onReply: () => void
}

function CommentThreadBlock({
  thread,
  depth,
  postId,
  postOwnerId,
  onReplyClick,
}: {
  thread: CommentThread
  depth: number
  postId: string
  postOwnerId: string
  onReplyClick: (commentId: string, username: string) => void
}) {
  const { users } = useSocial()
  const author = users.find((u) => u.id === thread.userId) || {
    id: thread.userId,
    username: 'unknown',
  }
  return (
    <div className={depth > 0 ? 'mt-3 ml-0.5 border-l-2 border-neutral-200 dark:border-neutral-700 pl-3' : ''}>
      <CommentItem
        id={thread.id}
        postId={postId}
        userId={thread.userId}
        content={thread.content}
        createdAt={thread.createdAt}
        updatedAt={thread.updatedAt ?? null}
        postOwnerId={postOwnerId}
        likes={thread.likes}
        likedByMe={thread.likedByMe}
        onReply={() => onReplyClick(thread.id, author.username)}
      />
      {thread.replies.map((r) => (
        <CommentThreadBlock
          key={r.id}
          thread={r}
          depth={depth + 1}
          postId={postId}
          postOwnerId={postOwnerId}
          onReplyClick={onReplyClick}
        />
      ))}
    </div>
  )
}

function CommentItem({
  id,
  postId,
  userId,
  content,
  createdAt,
  updatedAt,
  postOwnerId,
  likes = 0,
  likedByMe,
  onReply,
}: CommentItemProps) {
  const { users, currentUser, deleteComment, editComment, likeComment } = useSocial()
  const u = users.find(u => u.id === userId) || {
    id: userId,
    name: 'Unknown',
    username: 'unknown',
    avatar: `/api/avatar?name=${userId}`,
    bio: ''
  }
  const locale = useLocale()
  const [showReport, setShowReport] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)

  return (
    <>
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
          await deleteComment(id, postId, postOwnerId)
          setShowDeleteConfirm(false)
          setIsDeleting(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      {showReport && (
        <ReportModal
          targetId={id}
          targetType="comment"
          onClose={() => setShowReport(false)}
        />
      )}
      <div className="flex items-start gap-3 group">
        <UserHoverCard userId={u.id} className="shrink-0">
          <Link href={`/${locale}/social/profile/${u.username}` as any}>
            <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
          </Link>
        </UserHoverCard>
        <div className="flex-1 min-w-0">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl rounded-tl-none px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <UserHoverCard userId={u.id}>
                <Link href={`/${locale}/social/profile/${u.username}` as any} className="font-semibold text-sm hover:underline text-neutral-900 dark:text-white">
                  {u.name}
                </Link>
              </UserHoverCard>
              <span className="text-xs text-neutral-400 shrink-0">
                {timeAgo(createdAt)}
                {isCommentEdited(createdAt, updatedAt) && (
                  <span className="ml-1 italic opacity-70">({t(locale, 'edited') || 'redaktə edilib'})</span>
                )}
              </span>
            </div>
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/50 resize-y min-h-[60px]"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(content)
                    }}
                    className="text-xs px-2 py-1 font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    {t(locale, 'cancel_btn') || 'Ləğv et'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (editContent.trim() && editContent !== content) {
                        await editComment(id, postId, editContent)
                      }
                      setIsEditing(false)
                    }}
                    className="text-xs px-2 py-1 font-medium bg-brand text-white rounded-md hover:bg-brand/90 transition-colors"
                  >
                    {t(locale, 'save_btn') || 'Yadda saxla'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-700 dark:text-neutral-300 break-words whitespace-pre-wrap leading-relaxed">
                <RichText content={content} locale={locale} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 ml-2">
            <button
              type="button"
              onClick={() => onReply()}
              className="text-xs font-medium text-neutral-500 hover:text-brand transition-colors flex items-center gap-1"
            >
              {t(locale, 'reply')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  toast.error(locale === 'az' ? 'Daxil olmalısınız.' : 'You must be logged in.')
                  return
                }
                void likeComment(id, postId)
              }}
              className={`text-xs font-medium transition-colors flex items-center gap-1 ${
                likedByMe ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'
              }`}
            >
              {likedByMe ? <AiFillHeart size={14} /> : <FiHeart size={14} />}
              {t(locale, 'like')}
              {likes > 0 && <span className="tabular-nums">({likes})</span>}
            </button>

            <div className="flex-1" />

            <Popover.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                  title={t(locale, 'more_options') || 'Daha çox'}
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
                  {currentUser?.id === userId && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false)
                        setIsEditing(true)
                        setEditContent(content)
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-xs text-neutral-700 dark:text-neutral-300 font-medium"
                    >
                      <FiEdit2 size={12} />
                      {t(locale, 'edit_comment') || 'Şərhi düzəlt'}
                    </button>
                  )}
                  {(currentUser?.id === userId || currentUser?.id === postOwnerId) && (
                    <button
                      type="button"
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
                  {currentUser?.id !== userId && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false)
                        if (!currentUser) {
                          toast.error(locale === 'az' ? 'Daxil olmalısınız.' : 'You must be logged in to report.')
                          return
                        }
                        setShowReport(true)
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-xs text-neutral-600 dark:text-neutral-400 font-medium"
                    >
                      <FiFlag size={12} />
                      {t(locale, 'report_comment') || 'Şikayət et'}
                    </button>
                  )}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>
      </div>
    </>
  )
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s`
  if (diff < 3600) return `${Math.floor(diff/60)}m`
  if (diff < 86400) return `${Math.floor(diff/3600)}h`
  return `${Math.floor(diff/86400)}d`
}
