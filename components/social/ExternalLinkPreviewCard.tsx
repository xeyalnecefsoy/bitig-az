"use client"

import { getSafeExternalHref } from '@/lib/safeExternalUrl'
import type { LinkPreview } from '@/lib/social'

export function ExternalLinkPreviewCard({ preview }: { preview: LinkPreview }) {
  const href = getSafeExternalHref(preview.url)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-3 block max-w-xl overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 transition-colors hover:border-brand/40 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-brand/40"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-stretch">
        {preview.imageUrl ? (
          <img
            src={preview.imageUrl}
            alt={preview.title}
            className="h-24 w-32 shrink-0 border-r border-neutral-200 object-cover dark:border-neutral-800"
            loading="lazy"
          />
        ) : (
          <div className="h-24 w-32 shrink-0 border-r border-neutral-200 bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-800" />
        )}
        <div className="min-w-0 flex-1 p-3">
          <div className="truncate text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {preview.siteName || 'Link'}
          </div>
          <div className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {preview.title}
          </div>
          {preview.description && (
            <div className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-300">
              {preview.description}
            </div>
          )}
        </div>
      </div>
    </a>
  )
}
