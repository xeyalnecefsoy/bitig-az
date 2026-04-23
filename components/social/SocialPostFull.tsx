"use client"
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSocial } from '@/context/social'
import type { Post } from '@/lib/social'
import Link from 'next/link'
import {
  FiHeart, FiMessageCircle, FiTrash2, FiMoreHorizontal, FiCornerUpLeft,
  FiAlertTriangle, FiFlag, FiRepeat, FiX, FiChevronLeft, FiChevronRight,
  FiEdit2, FiCopy, FiMessageSquare, FiShare2, FiBarChart2,
} from 'react-icons/fi'
import { AiFillHeart } from 'react-icons/ai'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import { RichText } from './RichText'
import { ExternalLinkPreviewCard } from './ExternalLinkPreviewCard'
import { SocialComposer } from './SocialComposer'
import { QuotedPostCard } from './QuotedPostCard'
import { ShareModal } from './ShareModal'
import { ReportModal } from '@/components/ReportModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { calculatePollPercentages } from '@/lib/pollUtils'
import * as Popover from '@radix-ui/react-popover'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { buildCommentThreads, isCommentEdited, type CommentThread } from '@/lib/commentTree'
import { UserHoverCard } from './UserHoverCard'
import { useMentions } from '@/hooks/useMentions'
import { MentionDropdown } from './MentionDropdown'

export function SocialPostFull({ initialPost }: { initialPost: Post }) {
  const locale = useLocale()
  const {
    posts, addComment, like, likeComment, users, voteOnPoll, currentUser,
    deletePost, editComment, follow, unfollow, isFollowing,
  } = useSocial()

  const post = posts.find(p => p.id === initialPost.id) || initialPost
  const [comment, setComment] = useState('')
  const [showQuoteComposer, setShowQuoteComposer] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const [imageSlide, setImageSlide] = useState(0)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [showReportPost, setShowReportPost] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    query: mentionQuery,
    isOpen: isMentionOpen,
    suggestions: mentionSuggestions,
    activeIndex: mentionActiveIndex,
    loading: mentionLoading,
    position: mentionPosition,
    handleInputChange: handleMentionInputChange,
    handleKeyDown: handleMentionKeyDown,
    selectUser: selectMentionUser,
    setIsOpen: setMentionOpen,
  } = useMentions()

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

  const views = post.likes * 12 + post.comments.length * 3

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hidden post alert */}
      {post.status === 'rejected' && currentUser?.id === post.userId && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl flex flex-col gap-1.5 text-sm font-medium border border-red-100 dark:border-red-900/30">
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

      {/* ===== POST CARD ===== */}
      <article className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-start gap-3">
          <Link href={`/${locale}/social/profile/${author.username}` as any} className="shrink-0">
            <img
              src={author.avatar}
              alt={author.name}
              className="h-11 w-11 rounded-full object-cover border border-neutral-100 dark:border-neutral-800"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <UserHoverCard userId={author.id}>
                  <Link
                    href={`/${locale}/social/profile/${author.username}` as any}
                    className="font-bold text-[15px] text-neutral-900 dark:text-white hover:text-brand truncate block"
                  >
                    {author.name}
                  </Link>
                </UserHoverCard>
                <Link
                  href={`/${locale}/social/profile/${author.username}` as any}
                  className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:underline block"
                >
                  @{author.username}
                </Link>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {currentUser && currentUser.id !== post.userId && (
                  <button
                    onClick={() => {
                      if (isFollowing(post.userId)) {
                        unfollow(post.userId)
                      } else {
                        follow(post.userId)
                      }
                    }}
                    className={`text-[13px] font-semibold px-4 py-1.5 rounded-full border transition-colors ${
                      isFollowing(post.userId)
                        ? 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400'
                        : 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900'
                    }`}
                  >
                    {isFollowing(post.userId) ? t(locale, 'following_user') : t(locale, 'follow')}
                  </button>
                )}
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                      <FiMoreHorizontal size={18} />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-1 z-50 animate-in fade-in zoom-in-95 duration-200"
                      align="end"
                      sideOffset={4}
                    >
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/${locale}/social/post/${post.id}`
                          navigator.clipboard.writeText(url)
                          toast.success(t(locale, 'link_copied') || "Link kopyalandı!")
                        }}
                        className="w-full text-left p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2.5"
                      >
                        <FiCopy size={15} className="opacity-70" />
                        {t(locale, 'copy_link') || "URL kopyala"}
                      </button>
                      {post.userId === currentUser?.id && (
                        <button
                          onClick={() => {
                            const hasThreadChildren = posts.some(p => p.parentPostId === post.id && p.userId === post.userId)
                            const message = hasThreadChildren
                              ? (locale === 'az'
                                ? 'Bu arda daxil olan digər paylaşımlar da silinəcək. Əminsiniz?'
                                : 'Other posts in this thread will also be deleted. Are you sure?')
                              : (t(locale, 'confirm_delete_post') || 'Are you sure?')
                            if (confirm(message)) {
                              deletePost(post.id)
                            }
                          }}
                          className="w-full text-left p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2.5"
                        >
                          <FiTrash2 size={15} className="opacity-70" />
                          {t(locale, 'delete_post')}
                        </button>
                      )}
                      {currentUser?.id !== post.userId && (
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              toast.error(locale === 'az' ? 'Daxil olmalısınız.' : 'You must be logged in to report.')
                              return
                            }
                            setShowReportPost(true)
                          }}
                          className="w-full text-left p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2.5"
                        >
                          <FiAlertTriangle size={15} className="opacity-70" />
                          {t(locale, 'report_post') || "Şikayət et"}
                        </button>
                      )}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-5 pb-3">
          <div className="text-[17px] leading-relaxed text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words">
            <RichText content={post.content} locale={locale} />
          </div>
        </div>

        {post.linkPreview && (
          <div className="px-4 sm:px-5 pb-3">
            <ExternalLinkPreviewCard preview={post.linkPreview} />
          </div>
        )}

        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="px-4 sm:px-5 pb-3">
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

        {/* Poll */}
        {post.poll && (
          <div className="px-4 sm:px-5 pb-3">
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
          <div className="px-4 sm:px-5 pb-3">
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
          <div className="px-4 sm:px-5 pb-3">
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

        {/* Date & Views */}
        <div className="px-4 sm:px-5 pb-1 pt-1">
          <div className="flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-neutral-400 flex-wrap">
            <span>{formatPostDateTime(post.createdAt, locale)}</span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="flex items-center gap-1">
              <FiBarChart2 size={13} className="opacity-70" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatCount(views)}</span>
              <span>{t(locale, 'views')}</span>
            </span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-4 sm:mx-5 my-2 border-y border-neutral-100 dark:border-neutral-800 py-2.5 flex items-center gap-5 text-[13px] text-neutral-500 dark:text-neutral-400">
          <span>
            <span className="font-semibold text-neutral-900 dark:text-white">{formatCount(post.likes)}</span>{' '}
            {t(locale, 'like') || 'Like'}
          </span>
          <span>
            <span className="font-semibold text-neutral-900 dark:text-white">{formatCount(post.comments.length)}</span>{' '}
            {t(locale, 'comments') || 'Comments'}
          </span>
        </div>

        {/* Action bar */}
        <div className="px-4 sm:px-5 py-1 flex items-center justify-around">
          {/* Like */}
          <button
            onClick={() => like(post.id)}
            className={`group inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${post.likedByMe ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400 hover:text-red-500'}`}
            aria-pressed={post.likedByMe ? 'true' : 'false'}
            aria-label={post.likedByMe ? t(locale, 'unlike_post') : t(locale, 'like_post')}
            title={post.likedByMe ? t(locale, 'unlike_post') : t(locale, 'like_post')}
          >
            <span className="p-2.5 rounded-full group-hover:bg-red-500/10 transition-colors">
              {post.likedByMe ? <AiFillHeart size={22} /> : <FiHeart size={22} />}
            </span>
          </button>

          {/* Comment */}
          <button
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-sky-500 transition-colors"
            title={t(locale, 'social_write_comment')}
            aria-label={t(locale, 'social_write_comment')}
            onClick={() => inputRef.current?.focus()}
          >
            <span className="p-2.5 rounded-full group-hover:bg-sky-500/10 transition-colors">
              <FiMessageCircle size={22} />
            </span>
          </button>

          {/* Quote */}
          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                toast.error(t(locale, 'social_sign_in_prompt'))
                return
              }
              setShowQuoteComposer(true)
            }}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-brand transition-colors"
            title={t(locale, 'social_quote')}
            aria-label={t(locale, 'social_quote')}
          >
            <span className="p-2.5 rounded-full group-hover:bg-brand/10 transition-colors">
              <FiRepeat size={22} />
            </span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-brand transition-colors"
            title={t(locale, 'share')}
            aria-label={t(locale, 'share')}
          >
            <span className="p-2.5 rounded-full group-hover:bg-brand/10 transition-colors">
              <FiShare2 size={22} />
            </span>
          </button>
        </div>
      </article>

      {/* Share Modal */}
      {portalReady && showShareModal && typeof document !== 'undefined' &&
        createPortal(
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            url={`${typeof window !== 'undefined' ? window.location.origin : 'https://bitig.az'}/${locale}/social/post/${post.id}`}
            excerpt={post.content}
          />,
          document.body,
        )}

      {/* Report Modal */}
      {showReportPost && (
        <ReportModal
          targetId={post.id}
          targetType="post"
          onClose={() => setShowReportPost(false)}
        />
      )}

      {/* Quote Composer Overlay */}
      {portalReady && showQuoteComposer && currentUser && typeof document !== 'undefined' &&
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

      {/* ===== COMMENTS SECTION ===== */}
      <div className="mt-4 space-y-4">
        {/* Reply composer */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-sm">
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
            {currentUser && (
              <Link href={`/${locale}/social/profile/${currentUser.username}` as any} className="shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-10 w-10 rounded-full object-cover border border-neutral-100 dark:border-neutral-800"
                  referrerPolicy="no-referrer"
                />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              {replyingTo && (
                <div className="flex items-center justify-between gap-2 mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <FiCornerUpLeft size={12} />
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
              <div className="relative">
                <div className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand/50 transition-all">
                  <input
                    ref={inputRef}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value)
                      handleMentionInputChange(e)
                    }}
                    onKeyDown={(e) => {
                      handleMentionKeyDown(e, comment, setComment)
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder={t(locale, 'post_your_reply')}
                    className="flex-1 text-[15px] bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="btn btn-primary text-sm px-5 py-2 rounded-full font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shrink-0"
                  >
                    {t(locale, 'social_post_button')}
                  </button>
                </div>
                <MentionDropdown
                  isOpen={isMentionOpen}
                  suggestions={mentionSuggestions}
                  activeIndex={mentionActiveIndex}
                  loading={mentionLoading}
                  top={mentionPosition.top}
                  left={mentionPosition.left}
                  onSelect={(user) => {
                    const newValue = selectMentionUser(user, comment)
                    setComment(newValue)
                    setTimeout(() => inputRef.current?.focus(), 0)
                  }}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Comments list */}
        {post.comments.length > 0 && (
          <div className="space-y-0">
            <div className="flex items-center gap-2 px-1 mb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {t(locale, 'comments')}
              </h3>
              <span className="text-sm font-semibold text-neutral-400 dark:text-neutral-500">
                {post.comments.length}
              </span>
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-neutral-100 dark:divide-neutral-800">
              {commentThreads.map((thread) => (
                <div key={thread.id} className="p-4 sm:p-5">
                  <CommentThreadBlock
                    thread={thread}
                    depth={0}
                    postId={post.id}
                    postOwnerId={post.userId}
                    onReplyClick={handleReplyClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {post.comments.length === 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 sm:p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
              <FiMessageSquare size={24} className="text-neutral-400 dark:text-neutral-500" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-[15px] font-medium">
              {locale === 'az' ? 'Hələ şərh yoxdur' : 'No comments yet'}
            </p>
            <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">
              {locale === 'az' ? 'İlk şərhi siz yazın!' : 'Be the first to comment!'}
            </p>
          </div>
        )}
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
    <div className={depth > 0 ? 'mt-4 ml-2 border-l-2 border-neutral-200 dark:border-neutral-700 pl-4' : ''}>
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
            <img src={u.avatar} alt={u.name} className="h-9 w-9 rounded-full object-cover border border-neutral-100 dark:border-neutral-800" referrerPolicy="no-referrer" />
          </Link>
        </UserHoverCard>
        <div className="flex-1 min-w-0">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl rounded-tl-none px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <UserHoverCard userId={u.id}>
                  <Link href={`/${locale}/social/profile/${u.username}` as any} className="font-semibold text-[13px] hover:underline text-neutral-900 dark:text-white truncate">
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
            </div>
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/50 resize-y min-h-[60px]"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(content)
                    }}
                    className="text-xs px-3 py-1.5 font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
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
                    className="text-xs px-3 py-1.5 font-medium bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    {t(locale, 'save_btn') || 'Yadda saxla'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-neutral-700 dark:text-neutral-300 break-words whitespace-pre-wrap leading-relaxed">
                <RichText content={content} locale={locale} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1.5 ml-1">
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
              {likedByMe ? <AiFillHeart size={13} /> : <FiHeart size={13} />}
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
                  className="w-44 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-1 z-50 animate-in fade-in zoom-in-95 duration-200"
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
                      className="w-full flex items-center gap-2.5 p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-sm text-neutral-700 dark:text-neutral-300 font-medium"
                    >
                      <FiEdit2 size={14} />
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
                      className="w-full flex items-center gap-2.5 p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-sm text-red-600 dark:text-red-400 font-medium"
                    >
                      <FiTrash2 size={14} />
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
                      className="w-full flex items-center gap-2.5 p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-sm text-neutral-600 dark:text-neutral-400 font-medium"
                    >
                      <FiFlag size={14} />
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
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function formatPostDateTime(iso: string, locale: string) {
  const date = new Date(iso)
  const isAz = locale === 'az'

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !isAz,
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }

  const timeStr = date.toLocaleTimeString(isAz ? 'az-AZ' : 'en-US', timeOptions)
  const dateStr = date.toLocaleDateString(isAz ? 'az-AZ' : 'en-US', dateOptions)

  if (isAz) {
    // lowercase month name for az (e.g. "22 apr 2026")
    return `${timeStr} · ${dateStr.toLowerCase()}`
  }
  return `${timeStr} · ${dateStr}`
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}
