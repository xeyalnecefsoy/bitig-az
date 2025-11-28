"use client"
import { FiChevronUp, FiChevronDown, FiPause, FiPlay, FiSkipBack, FiSkipForward, FiX } from 'react-icons/fi'
import { useAudio } from '@/context/audio'
import { usePathname } from 'next/navigation'

export function FloatingPlayer() {
  const { track, playing, currentTime, duration, toggle, seek, setExpanded, expanded, pause, close } = useAudio()
  const pathname = usePathname()
  if (!track) return null
  // Hide on book detail pages; show elsewhere
  if (pathname && pathname.includes('/book/')) return null

  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0

  const fmt = (n: number) => {
    if (!isFinite(n)) return '0:00'
    const h = Math.floor(n / 3600)
    const m = Math.floor((n % 3600) / 60)
    const s = Math.floor(n % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-neutral-200 bg-white p-3 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{track.title ?? 'Now playing'}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label="Collapse"
              onClick={() => setExpanded(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <FiChevronDown className="text-sm" />
            </button>
            <button
              aria-label="Close"
              onClick={close}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <FiX className="text-sm" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            aria-label="Back 15 seconds"
            onClick={() => seek(currentTime - 15)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <FiSkipBack className="text-sm" />
          </button>
          <button
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={toggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
          >
            {playing ? <FiPause className="text-lg" /> : <FiPlay className="translate-x-[1px] text-lg" />}
          </button>
          <button
            aria-label="Forward 15 seconds"
            onClick={() => seek(currentTime + 15)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <FiSkipForward className="text-sm" />
          </button>
        </div>
        
        <div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={e => seek(Number(e.target.value))}
            className="w-full accent-brand"
            aria-label="Seek"
          />
          <div className="mt-0.5 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded(true)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(true) } }}
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg outline-none dark:border-neutral-800 dark:bg-neutral-900"
      aria-label="Open player"
    >
      <div className="relative flex items-center gap-3 p-3 pr-10">
        <button
          aria-label="Close"
          onClick={(e) => { e.stopPropagation(); close() }}
          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
        >
          <FiX className="text-sm" />
        </button>
        <button
          aria-label="Expand player"
          onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
          className="absolute right-2 bottom-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
        >
          <FiChevronUp className="text-sm" />
        </button>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white flex-shrink-0">
          {playing ? <FiPause className="text-base" /> : <FiPlay className="translate-x-[1px] text-base" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{track.title ?? 'Now playing'}</div>
          <div className="mt-1.5 h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div className="h-1 rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
