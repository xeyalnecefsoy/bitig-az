"use client"

import Link from 'next/link'
import type { QuotedPostEmbed } from '@/lib/social'
import type { User } from '@/lib/social'

function timeAgoQuoted(iso: string, locale: string = 'az') {
  const date = new Date(iso)
  const diff = (Date.now() - date.getTime()) / 1000

  if (diff < 60) {
    return locale === 'az' ? 'indicə' : 'now'
  }
  if (diff < 3600) {
    const mins = Math.floor(diff / 60)
    return locale === 'az' ? `${mins} dəq` : `${mins}m`
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return locale === 'az' ? `${hours} saat` : `${hours}h`
  }
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function QuotedPostCard({
  quoted,
  quotedAuthor,
  locale,
  compact = false,
}: {
  quoted: QuotedPostEmbed
  quotedAuthor: Pick<User, 'name' | 'username' | 'avatar'> | null
  locale: string
  compact?: boolean
}) {
  const name = quotedAuthor?.name || 'User'
  const username = quotedAuthor?.username || 'unknown'
  const avatar = quotedAuthor?.avatar || `/api/avatar?name=${encodeURIComponent(username)}`
  const when = quoted.createdAt ? timeAgoQuoted(quoted.createdAt, locale) : ''

  return (
    <Link
      href={`/${locale}/social/post/${quoted.id}` as any}
      className={`block rounded-2xl border border-neutral-200/90 dark:border-neutral-700/90 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/60 transition-colors ${
        compact ? 'p-2.5' : 'p-3'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`flex gap-3 min-w-0 ${compact ? 'gap-2' : 'gap-3'}`}>
        <img
          src={avatar}
          alt=""
          className={`rounded-full object-cover shrink-0 ring-1 ring-black/5 dark:ring-white/10 ${
            compact ? 'h-7 w-7' : 'h-10 w-10'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div
            className={`font-semibold text-neutral-900 dark:text-white truncate leading-tight ${
              compact ? 'text-xs' : 'text-[15px]'
            }`}
          >
            {name}
          </div>
          <div
            className={`text-neutral-500 dark:text-neutral-400 truncate mt-0.5 ${compact ? 'text-[11px]' : 'text-xs'}`}
          >
            @{username}
            {when ? (
              <>
                <span className="mx-1 text-neutral-400 dark:text-neutral-500" aria-hidden>
                  ·
                </span>
                <span>{when}</span>
              </>
            ) : null}
          </div>
          <p
            className={`text-neutral-800 dark:text-neutral-200 mt-2 line-clamp-6 whitespace-pre-wrap break-words leading-snug ${
              compact ? 'text-xs' : 'text-[15px]'
            }`}
          >
            {quoted.content.trim() || ' '}
          </p>
          {quoted.imageUrls && quoted.imageUrls[0] && (
            <div
              className={`mt-3 w-full overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-600/80 bg-black/5 dark:bg-black/30 ${
                compact ? 'h-20' : 'aspect-video max-h-[min(280px,50vh)]'
              }`}
            >
              <img
                src={quoted.imageUrls[0]}
                alt=""
                className="h-full w-full object-cover object-center"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
