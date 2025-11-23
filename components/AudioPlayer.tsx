"use client"
import { useMemo } from 'react'
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2 } from 'react-icons/fi'
import { useAudio } from '@/context/audio'

export function AudioPlayer({ src, title }: { src: string; title?: string }) {
  const { play, toggle, seek, setVolume, duration, currentTime, playing, volume, setExpanded } = useAudio()

  const fmt = useMemo(() => (n: number) => {
    if (!isFinite(n)) return '0:00'
    const m = Math.floor(n / 60)
    const s = Math.floor(n % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const onPrimary = async () => {
    await play({ src, title })
    setExpanded(false)
  }

  return (
    <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <button
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={playing ? toggle : onPrimary}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white"
        >
          {playing ? <FiPause className="text-xl" /> : <FiPlay className="translate-x-[1px] text-xl" />}
        </button>
        <div className="flex items-center gap-1">
          <button
            aria-label="Back 15 seconds"
            onClick={() => seek(currentTime - 15)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <FiSkipBack />
          </button>
          <button
            aria-label="Forward 15 seconds"
            onClick={() => seek(currentTime + 15)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <FiSkipForward />
          </button>
        </div>
        <div className="ml-2 min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={e => seek(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <div className="mt-0.5 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="ml-2 hidden items-center gap-2 sm:flex">
          <FiVolume2 className="text-neutral-500 dark:text-neutral-400" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-24 accent-brand"
            aria-label="Volume"
          />
        </div>
      </div>
      {title && <div className="mt-3 truncate text-sm text-neutral-700 dark:text-neutral-200">{title}</div>}
    </div>
  )
}
