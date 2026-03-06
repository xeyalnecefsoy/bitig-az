"use client"
import { useState } from 'react'
import { useSocial } from '@/context/social'
import { FiHeart, FiMessageCircle, FiTrash2, FiX, FiChevronLeft, FiChevronRight, FiMoreHorizontal, FiEdit2, FiCopy, FiMessageSquare, FiAlertTriangle, FiFlag } from 'react-icons/fi'
import { AiFillHeart } from 'react-icons/ai'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/context/locale'
import { ReportModal } from '@/components/ReportModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { t } from '@/lib/i18n'
import { UserHoverCard } from './UserHoverCard'
import { RichText } from './RichText'

import * as Popover from '@radix-ui/react-popover'
import { SocialComposer } from './SocialComposer'
import { calculatePollPercentages } from '@/lib/pollUtils'
import toast from 'react-hot-toast'

export function SocialPostCard({ postId, disableHover = false, isThread = false }: { postId: string, disableHover?: boolean, isThread?: boolean }) {
  const { posts, addComment, like, users, currentUser, deletePost, editPost, voteOnPoll } = useSocial()
  const post = posts.find(p => p.id === postId)
  const [comment, setComment] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedImage, setExpandedImage] = useState<{ index: number, urls: string[] } | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post?.content || '')
  const [showReplyComposer, setShowReplyComposer] = useState(false)
  const locale = useLocale()
  
  if (!post) return null

  const author = users.find(u => u.id === post.userId) || {
    id: post.userId,
    name: 'Unknown',
    username: 'unknown',
    avatar: `/api/avatar?name=${post.userId}`,
    bio: ''
  }

  const isOwnPost = currentUser?.id === author.id
  const shouldDisableHover = disableHover || isOwnPost

  const router = useRouter()

  return (
    <article className={`card p-4 sm:p-5 min-w-0 w-full overflow-hidden ${isThread ? 'border-t-0 rounded-t-none mt-0' : ''}`}>
      {post.status === 'rejected' && isOwnPost && (
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
      <header className="flex items-start gap-3 relative">
        {/* Thread connecting line - only if this post is Part of a thread but not the very first one */}
        {isThread && (
          <div className="absolute -top-10 left-[1.125rem] bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-800 -z-10" aria-hidden="true" />
        )}
        <UserHoverCard userId={author.id} disabled={shouldDisableHover} className="flex items-start gap-3 flex-1 min-w-0 relative">
          <Link href={`/${locale}/social/profile/${author.username}` as any} className="shrink-0">
            <img src={author.avatar} alt={author.name} className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/${locale}/social/profile/${author.username}` as any} className="font-medium leading-tight hover:text-brand line-clamp-1">
                {author.name}
              </Link>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {timeAgo(post.createdAt, locale)}
              {post.updatedAt && <span className="ml-1 italic opacity-70">({t(locale, 'edited') || 'redaktə edilib'})</span>}
            </div>
          </div>
        </UserHoverCard>
        <div className="relative flex items-center gap-1">
          {isOwnPost && (
             <button
               onClick={() => setShowDeleteConfirm(true)}
               disabled={isDeleting}
               className="p-1 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
               title={t(locale, 'delete_post')}
               aria-label={t(locale, 'delete_post')}
             >
               <FiTrash2 />
             </button>
          )}
          <Popover.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <Popover.Trigger asChild>
              <button
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                title={t(locale, 'more_options') || "Daha çox"}
                aria-label="Options"
              >
                <FiMoreHorizontal />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content 
                className="w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 p-1 z-50 animate-in fade-in zoom-in-95 duration-200" 
                align="end" 
                sideOffset={5}
              >
                {isOwnPost && (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false)
                      setIsEditing(true)
                      setEditContent(post.content)
                    }}
                    className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2"
                  >
                    <FiEdit2 size={14} className="opacity-70" /> {t(locale, 'edit_post') || "Postu düzəlt"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMoreOpen(false)
                    const url = `${window.location.origin}/${locale}/social/post/${post.id}`
                    navigator.clipboard.writeText(url)
                    toast.success(t(locale, 'link_copied') || "Link kopyalandı!")
                  }}
                  className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2"
                >
                  <FiCopy size={14} className="opacity-70" /> {t(locale, 'copy_link') || "URL kopyala"}
                </button>
                {isOwnPost && !isThread && (
                  <button 
                    onClick={() => {
                      setIsMoreOpen(false)
                      setShowReplyComposer(true)
                    }}
                    className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-2"
                  >
                    <FiMessageSquare size={14} className="opacity-70" /> {t(locale, 'add_to_thread')}
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMoreOpen(false)
                    if (!currentUser) {
                      toast.error('You must be logged in to report.')
                      return
                    }
                    setShowReport(true)
                  }}
                  className="w-full text-left p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors text-sm text-red-600 dark:text-red-400 font-medium border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1 flex items-center gap-2"
                >
                  <FiAlertTriangle size={14} className="opacity-70" /> {t(locale, 'report_post') || "Şikayət et"}
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </header>
      
      {/* Delete Post Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t(locale, 'delete_post')}
        message={t(locale, 'confirm_delete_post_desc')}
        confirmLabel={t(locale, 'confirm_btn')}
        cancelLabel={t(locale, 'cancel_btn')}
        variant="danger"
        isLoading={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true)
          await deletePost(post.id)
          setShowDeleteConfirm(false)
          setIsDeleting(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      
      {showReport && (
        <ReportModal
          targetId={post.id}
          targetType="post"
          onClose={() => setShowReport(false)}
        />
      )}
      {isEditing ? (
        <div className="mt-3 mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/50 resize-y min-h-[100px]"
            placeholder="Postunuzu daxil edin..."
          />
          <div className="flex justify-end gap-2 mt-2">
            <button 
              onClick={() => {
                setIsEditing(false)
                setEditContent(post.content) // Revert back
              }}
              className="text-xs px-3 py-1.5 font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              {t(locale, 'cancel_btn') || "Ləğv et"}
            </button>
            <button 
              onClick={async () => {
                if (editContent.trim() || (post.imageUrls && post.imageUrls.length > 0) || post.mentionedBook) {
                  await editPost(post.id, editContent)
                  setIsEditing(false)
                }
              }}
              className="text-xs px-3 py-1.5 font-medium bg-brand text-white rounded-md hover:bg-brand/90 transition-colors"
            >
              {t(locale, 'save_btn') || "Yadda saxla"}
            </button>
          </div>
        </div>
      ) : (
        <div 
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/${locale}/social/post/${post.id}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              router.push(`/${locale}/social/post/${post.id}`)
            }
          }}
          className="mt-3 block text-sm sm:text-base whitespace-pre-wrap break-words text-neutral-800 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-white mb-3 cursor-pointer"
        >
          <RichText content={post.content} locale={locale} truncateLimit={500} />
        </div>
      )}

      {/* Poll Rendering */}
      {post.poll && (
        <div className="mt-3 mb-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2.5">
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
                      className="w-full text-left px-4 py-2.5 rounded-lg border border-brand/30 hover:border-brand hover:bg-brand/5 dark:border-brand/40 dark:hover:border-brand text-sm font-medium transition-colors text-neutral-800 dark:text-neutral-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border border-neutral-400 dark:border-neutral-500 flex items-center justify-center shrink-0"></div>
                        <span className="truncate">{opt.text}</span>
                      </div>
                    </button>
                  ) : (
                    <div className="relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent">
                      <div 
                        className={`absolute top-0 bottom-0 left-0 ${isWinning ? 'bg-brand/20 dark:bg-brand/30' : 'bg-neutral-200 dark:bg-neutral-700'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <div className="relative px-4 py-2.5 flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center gap-2 truncate pr-4">
                          <span className={`truncate ${isWinning ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                            {opt.text}
                          </span>
                          {opt.hasVoted && (
                            <svg className="w-4 h-4 text-brand shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>{post.poll.totalVotes} səs</span>
            <span>•</span>
            <span>{post.poll.hasExpired ? 'Səsvermə bitib' : `Bitir: ${timeAgo(post.poll.expiresAt, locale)}`}</span>
          </div>
        </div>
      )}

      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="relative mb-3 w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
          <div 
            className="flex transition-transform duration-300 ease-in-out" 
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {post.imageUrls.map((url, index) => (
              <div 
                key={index}
                className="w-full min-w-full shrink-0 relative aspect-video sm:aspect-[21/9] max-h-[300px] cursor-zoom-in overflow-hidden bg-neutral-100 dark:bg-neutral-900"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedImage({ index, urls: post.imageUrls! })
                }}
              >
                <img 
                  src={url} 
                  alt={`Post image ${index + 1}`} 
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          
          {post.imageUrls.length > 1 && (
            <>
              {currentSlide > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => prev - 1) }}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
              )}
              {currentSlide < post.imageUrls.length - 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => prev + 1) }}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              )}
              <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                {currentSlide + 1} / {post.imageUrls.length}
              </div>
            </>
          )}
        </div>
      )}
      
      {post.mentionedBook && (
        <Link 
          href={`/${locale}/audiobooks/${post.mentionedBook.id}` as any}
          className="block bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700 hover:border-brand/30 dark:hover:border-brand/30 transition-colors group mb-3 max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 p-3">
            {post.mentionedBook.coverUrl ? (
              <img src={post.mentionedBook.coverUrl} className="h-14 w-10 object-cover rounded shadow-sm group-hover:scale-105 transition-transform shrink-0" alt={post.mentionedBook.title} />
            ) : (
              <div className="h-14 w-10 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center shrink-0">
                <span className="text-lg">📚</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-brand font-medium mb-0.5 uppercase tracking-wide flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-brand"></span>
                {t(locale, 'mentioned_book')}
              </div>
              <h4 className="font-medium text-sm text-neutral-900 dark:text-white truncate group-hover:text-brand transition-colors">{post.mentionedBook.title}</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{post.mentionedBook.author}</p>
            </div>
          </div>
        </Link>
      )}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <button
          onClick={() => like(post.id)}
          className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-brand"
          aria-pressed={post.likedByMe ? 'true' : 'false'}
          aria-label={post.likedByMe ? t(locale, 'unlike_post') : t(locale, 'like_post')}
        >
          {post.likedByMe ? <AiFillHeart className="text-brand" /> : <FiHeart />} {post.likes}
        </button>
        <Link href={`/${locale}/social/post/${post.id}` as any} className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-brand">
          <FiMessageCircle /> {post.comments.length}
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {post.comments.slice(0, 3).map(c => (
          <CommentItem key={c.id} id={c.id} postId={post.id} userId={c.userId} content={c.content} createdAt={c.createdAt} postOwnerId={post.userId} />
        ))}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; addComment(post.id, comment.trim()); setComment('') }}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t(locale, 'social_write_comment')}
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white text-neutral-900 placeholder-neutral-400 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder-neutral-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <button className="btn btn-primary text-sm px-3">{t(locale, 'social_post_button')}</button>
      </form>

      {/* Reply Modal */}
      {showReplyComposer && isOwnPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold text-neutral-900 dark:text-white">
                {t(locale, 'add_to_thread') || "Zəncirə əlavə et"}
              </span>
              <button 
                onClick={() => setShowReplyComposer(false)}
                className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Context Post (Parent) */}
              <div className="flex gap-3 mb-2 relative">
                <div className="absolute top-10 left-5 bottom-[-16px] w-0.5 bg-neutral-200 dark:bg-neutral-800 z-0" aria-hidden="true" />
                <img src={author.avatar} alt={author.name} className="h-10 w-10 rounded-full object-cover shrink-0 relative z-10" />
                <div className="flex-1 min-w-0 pb-4">
                  <div className="font-medium text-neutral-900 dark:text-white">{author.name}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-3">
                    {post.content}
                  </div>
                </div>
              </div>

              {/* Composer */}
              <div className="flex gap-3 relative z-10 mt-1">
                <img src={currentUser?.avatar} alt={currentUser?.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <SocialComposer 
                    replyToPostId={post.id} 
                    onPostCreated={() => setShowReplyComposer(false)} 
                    isInlineReply={true} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image Modal / Lightbox */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8 cursor-zoom-out animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation()
            setExpandedImage(null)
          }}
        >
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[101]"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedImage(null)
            }}
          >
            <FiX size={24} />
          </button>
          
          {/* Navigation Controls */}
          {expandedImage.urls.length > 1 && (
            <>
              {expandedImage.index > 0 && (
                <button
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[101]"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedImage(prev => prev ? { ...prev, index: prev.index - 1 } : null)
                  }}
                >
                  <FiChevronLeft size={32} />
                </button>
              )}
              {expandedImage.index < expandedImage.urls.length - 1 && (
                <button
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[101]"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedImage(prev => prev ? { ...prev, index: prev.index + 1 } : null)
                  }}
                >
                  <FiChevronRight size={32} />
                </button>
              )}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-md">
                {expandedImage.index + 1} / {expandedImage.urls.length}
              </div>
            </>
          )}

          {/* Download Button */}
          <button 
            className="absolute top-4 right-16 sm:top-6 sm:right-20 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[101]"
            title={t(locale, 'download_image') || 'Yüklə'}
            onClick={async (e) => {
              e.stopPropagation()
              try {
                const url = expandedImage.urls[expandedImage.index]
                const response = await fetch(url)
                const blob = await response.blob()
                const blobUrl = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = blobUrl
                // Extract filename from URL or fallback
                const filename = url.split('/').pop()?.split('?')[0] || `bitig-image-${Date.now()}.jpg`
                link.download = filename
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(blobUrl)
              } catch (error) {
                console.error('Download failed:', error)
                toast.error(t(locale, 'error_downloading') || 'Yükləmə zamanı xəta baş verdi.')
              }
            }}
          >
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>

          <img 
            src={expandedImage.urls[expandedImage.index]} 
            alt="Expanded view" 
            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  )
}

function CommentItem({ id, postId, userId, content, createdAt, updatedAt, postOwnerId }: { id: string; postId: string; userId: string; content: string; createdAt: string; updatedAt?: string | null; postOwnerId?: string }) {
  const { users, currentUser, deleteComment, editComment } = useSocial()
  const locale = useLocale()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  
  const u = users.find(u => u.id === userId) || {
    id: userId,
    name: 'Unknown',
    username: 'unknown',
    avatar: `/api/avatar?name=${userId}`,
    bio: ''
  }
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
      <div className="flex items-start gap-3">
        <UserHoverCard userId={u.id} className="relative">
          <Link href={`/${locale}/social/profile/${u.username || u.id}` as any}>
            <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          </Link>
        </UserHoverCard>
        <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <UserHoverCard userId={u.id}>
              <Link href={`/${locale}/social/profile/${u.username || u.id}` as any} className="font-medium hover:underline hover:text-brand transition-colors">
                {u.name}
              </Link>
            </UserHoverCard>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
              {timeAgo(createdAt, locale)}
              {updatedAt && <span className="ml-1 italic opacity-70">({t(locale, 'edited') || 'redaktə edilib'})</span>}
            </span>
            <div className="flex items-center ml-auto gap-1">
              <Popover.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                <Popover.Trigger asChild>
                  <button
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 transition-colors"
                    title={t(locale, 'more_options') || "Daha çox"}
                    aria-label="Options"
                  >
                    <FiMoreHorizontal size={12} />
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
                        onClick={() => {
                          setIsMoreOpen(false)
                          setIsEditing(true)
                          setEditContent(content)
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-xs text-neutral-700 dark:text-neutral-300 font-medium"
                      >
                        <FiEdit2 size={12} />
                        {t(locale, 'edit_comment') || "Şərhi düzəlt"}
                      </button>
                    )}
                    {(currentUser?.id === userId || currentUser?.id === postOwnerId) && (
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
                    <button
                      onClick={() => {
                        setIsMoreOpen(false)
                        if (!currentUser) {
                          toast.error('You must be logged in to report.')
                          return
                        }
                        setShowReport(true)
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-xs text-neutral-600 dark:text-neutral-400 font-medium"
                    >
                      <FiFlag size={12} />
                      {t(locale, 'report_comment') || "Şikayət et"}
                    </button>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
          {isEditing ? (
            <div className="mt-2 text-left">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/50 resize-y min-h-[60px]"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(content)
                  }}
                  className="text-xs px-2 py-1 font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  {t(locale, 'cancel_btn') || "Ləğv et"}
                </button>
                <button 
                  onClick={async () => {
                    if (editContent.trim() && editContent !== content) {
                      await editComment(id, postId, editContent)
                    }
                    setIsEditing(false)
                  }}
                  className="text-xs px-2 py-1 font-medium bg-brand text-white rounded-md hover:bg-brand/90 transition-colors"
                >
                  {t(locale, 'save_btn') || "Yadda saxla"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-0.5 text-left">
              <RichText content={content} locale={locale} truncateLimit={300} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}


function timeAgo(iso: string, locale: string = 'az') {
  const date = new Date(iso)
  const diff = (Date.now() - date.getTime()) / 1000

  // Less than 1 minute
  if (diff < 60) {
    return locale === 'az' ? 'indicə' : 'just now'
  }
  
  // Less than 1 hour
  if (diff < 3600) {
    const mins = Math.floor(diff/60)
    return locale === 'az' ? `${mins} dəq` : `${mins}m`
  }
  
  // Less than 24 hours
  if (diff < 86400) {
    const hours = Math.floor(diff/3600)
    return locale === 'az' ? `${hours} saat` : `${hours}h`
  }
  
  // Older than 24 hours - Show full date
  // e.g. 28/02/2026
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}
