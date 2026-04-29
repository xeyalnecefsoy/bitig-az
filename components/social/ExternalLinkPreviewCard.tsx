"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSafeExternalHref } from '@/lib/safeExternalUrl'
import type { LinkPreview } from '@/lib/social'

export function ExternalLinkPreviewCard({ preview }: { preview: LinkPreview }) {
  const [hydratedPreview, setHydratedPreview] = useState(preview)
  const shouldHydrate = useMemo(() => {
    const looksGenericYoutubeTitle =
      hydratedPreview.siteName?.toLowerCase() === 'youtube' &&
      hydratedPreview.title.trim().toLowerCase() === 'youtube video'
    return looksGenericYoutubeTitle || (!hydratedPreview.description && !hydratedPreview.creatorName)
  }, [hydratedPreview])

  useEffect(() => {
    setHydratedPreview(preview)
  }, [preview])

  useEffect(() => {
    if (!shouldHydrate) return
    let cancelled = false

    async function refreshPreview() {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(preview.url)}`)
        if (!res.ok) return
        const json = await res.json()
        const nextPreview = json?.preview
        if (!cancelled && nextPreview?.url && nextPreview?.title) {
          setHydratedPreview((prev) => ({
            ...prev,
            ...nextPreview,
          }))
        }
      } catch {
        // Keep existing preview as fallback.
      }
    }

    refreshPreview()
    return () => {
      cancelled = true
    }
  }, [preview.url, shouldHydrate])

  const href = getSafeExternalHref(hydratedPreview.url)
  if (!href) return null
  const creatorHref = hydratedPreview.creatorUrl ? getSafeExternalHref(hydratedPreview.creatorUrl) : null

  const formattedPublishedAt = (() => {
    if (!hydratedPreview.publishedAt) return null
    const date = new Date(hydratedPreview.publishedAt)
    if (Number.isNaN(date.getTime())) return hydratedPreview.publishedAt
    return new Intl.DateTimeFormat('az-AZ', { dateStyle: 'medium' }).format(date)
  })()

  const openPreview = () => {
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      role="link"
      tabIndex={0}
      className="mb-3 block max-w-xl overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 transition-colors hover:border-brand/40 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-brand/40"
      onClick={(e) => {
        e.stopPropagation()
        openPreview()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          openPreview()
        }
      }}
    >
      <div className="flex items-stretch">
        <div className="w-28 shrink-0 border-r border-neutral-200 sm:w-32 md:w-36 dark:border-neutral-800">
          {hydratedPreview.imageUrl ? (
            <img
              src={hydratedPreview.imageUrl}
              alt={hydratedPreview.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full min-h-[110px] w-full bg-neutral-200 dark:bg-neutral-800" />
          )}
        </div>
        <div className="min-w-0 flex-1 p-3 sm:p-3.5">
          <div className="min-h-[16px] flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="truncate font-medium uppercase tracking-wide">{hydratedPreview.siteName || 'Link'}</span>
            {hydratedPreview.type && (
              <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[10px] uppercase tracking-wide dark:border-neutral-700">
                {hydratedPreview.type}
              </span>
            )}
          </div>
          <div className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 dark:text-neutral-100 sm:text-[1.03rem] min-h-[40px]">
            {hydratedPreview.title}
          </div>
          <div
            className={[
              'mt-1 line-clamp-2 text-xs leading-4 text-neutral-600 dark:text-neutral-300 sm:text-[13px] min-h-[28px]',
              hydratedPreview.description ? '' : 'invisible',
            ].join(' ')}
            aria-hidden={!hydratedPreview.description}
          >
            {hydratedPreview.description ?? ''}
          </div>

          <div
            className={[
              'mt-1.5 flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs min-h-[20px]',
              hydratedPreview.creatorName || formattedPublishedAt ? '' : 'invisible',
            ].join(' ')}
            aria-hidden={!hydratedPreview.creatorName && !formattedPublishedAt}
          >
            {hydratedPreview.creatorName && (
              creatorHref ? (
                <a
                  href={creatorHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-medium hover:text-brand"
                  onClick={(e) => e.stopPropagation()}
                >
                  {hydratedPreview.creatorName}
                </a>
              ) : (
                <span className="truncate font-medium">{hydratedPreview.creatorName}</span>
              )
            )}
            {hydratedPreview.creatorName && formattedPublishedAt && <span>•</span>}
            {formattedPublishedAt && <span className="truncate">{formattedPublishedAt}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
