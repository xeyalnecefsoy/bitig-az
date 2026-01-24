"use client"
import { useState } from 'react'
import { useSocial } from '@/context/social'
import { FiHeart, FiMessageCircle, FiTrash2 } from 'react-icons/fi'
import { AiFillHeart } from 'react-icons/ai'
import Link from 'next/link'
import { useLocale } from '@/context/locale'
import { FiMoreHorizontal } from 'react-icons/fi'
import { ReportModal } from '@/components/ReportModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { t } from '@/lib/i18n'
import { UserHoverCard } from './UserHoverCard'
import { RichText } from './RichText'
import { DEFAULT_AVATAR } from '@/lib/social'

export function SocialPostCard({ postId, disableHover = false }: { postId: string, disableHover?: boolean }) {
  const { posts, addComment, like, users, currentUser, deletePost } = useSocial()
  const post = posts.find(p => p.id === postId)
  const [comment, setComment] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const locale = useLocale()
  
  if (!post) return null

  const author = users.find(u => u.id === post.userId) || {
    id: post.userId,
    name: 'Unknown',
    username: 'unknown',
    avatar: DEFAULT_AVATAR,
    bio: ''
  }

  const isOwnPost = currentUser?.id === author.id
  const shouldDisableHover = disableHover || isOwnPost

  return (
    <article className="card p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <UserHoverCard userId={author.id} disabled={shouldDisableHover} className="flex items-start gap-3 flex-1 min-w-0 relative">
          <Link href={`/${locale}/social/profile/${author.username}` as any} className="shrink-0">
            <img src={author.avatar} alt={author.name} className="h-10 w-10 rounded-full object-cover" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/${locale}/social/profile/${author.username}` as any} className="font-medium leading-tight hover:text-brand line-clamp-1">
                {author.name}
              </Link>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo(post.createdAt)}</div>
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
          <button
            onClick={() => {
              if (!currentUser) {
                alert('You must be logged in to report.')
                return
              }
              setShowReport(true)
            }}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            title="Report Post"
            aria-label="Report Post"
          >
            <FiMoreHorizontal />
          </button>
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
      <Link href={`/${locale}/social/post/${post.id}` as any} className="mt-3 block text-sm sm:text-base whitespace-pre-wrap break-words hover:text-neutral-900 dark:hover:text-neutral-50 mb-3">
        <RichText content={post.content} locale={locale} />
      </Link>
      
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
          <CommentItem key={c.id} id={c.id} postId={post.id} userId={c.userId} content={c.content} createdAt={c.createdAt} />
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

function CommentItem({ id, postId, userId, content, createdAt }: { id: string; postId: string; userId: string; content: string; createdAt: string }) {
  const { users, currentUser, deleteComment } = useSocial()
  const locale = useLocale()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const u = users.find(u => u.id === userId) || {
    id: userId,
    name: 'Unknown',
    avatar: DEFAULT_AVATAR,
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
          await deleteComment(id, postId)
          setShowDeleteConfirm(false)
          setIsDeleting(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <div className="flex items-start gap-3">
        <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover" />
        <div className="bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100">
          <div className="flex items-center gap-2">
            <span className="font-medium">{u.name}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{timeAgo(createdAt)}</span>
            {currentUser?.id === userId && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="text-neutral-400 hover:text-red-500 ml-auto p-0.5 disabled:opacity-50"
                title={t(locale, 'delete_comment')}
                aria-label={t(locale, 'delete_comment')}
              >
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
          <div className="mt-0.5">
            <RichText content={content} locale={locale} />
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
