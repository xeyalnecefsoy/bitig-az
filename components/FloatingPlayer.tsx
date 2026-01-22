"use client"
import { FiChevronUp, FiChevronDown, FiPause, FiPlay, FiSkipBack, FiSkipForward, FiX, FiMoon, FiClock } from 'react-icons/fi'
import { useAudio, PLAYBACK_SPEEDS, SLEEP_TIMER_OPTIONS, type PlaybackSpeed, type SleepTimerOption } from '@/context/audio'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

// Format time helper
function formatTime(n: number): string {
  if (!isFinite(n)) return '0:00'
  const h = Math.floor(n / 3600)
  const m = Math.floor((n % 3600) / 60)
  const s = Math.floor(n % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Sleep timer label
function getSleepTimerLabel(minutes: SleepTimerOption): string {
  if (minutes === 0) return 'Fəsil sonu'
  if (minutes === 60) return '1 saat'
  return `${minutes} dəq`
}

export function FloatingPlayer() {
  const { 
    track, playing, currentTime, duration, toggle, seek, setExpanded, expanded, close,
    playbackRate, setPlaybackRate,
    sleepTimer, sleepTimerMode, setSleepTimer, cancelSleepTimer
  } = useAudio()
  const pathname = usePathname()
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showSleepMenu, setShowSleepMenu] = useState(false)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setShowSpeedMenu(false)
      setShowSleepMenu(false)
    }
    if (showSpeedMenu || showSleepMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showSpeedMenu, showSleepMenu])
  
  if (!track) return null
  // Hide on book detail pages; show elsewhere
  if (pathname && pathname.includes('/book/')) return null

  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0

  if (expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-neutral-200 bg-white p-3 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{track.title ?? 'İndi oxunur'}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label="Kiçilt"
              onClick={() => setExpanded(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <FiChevronDown className="text-sm" />
            </button>
            <button
              aria-label="Bağla"
              onClick={close}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <FiX className="text-sm" />
            </button>
          </div>
        </div>

        {/* Sleep Timer indicator */}
        {sleepTimerMode && (
          <div className="mb-2 flex items-center justify-between px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs">
            <div className="flex items-center gap-1.5">
              <FiMoon size={12} />
              <span>
                {sleepTimerMode === 'chapter' 
                  ? 'Fəsil sonunda' 
                  : formatTime(sleepTimer || 0)}
              </span>
            </div>
            <button onClick={cancelSleepTimer} className="hover:underline">×</button>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            aria-label="15 saniyə geri"
            onClick={() => seek(currentTime - 15)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <FiSkipBack className="text-sm" />
          </button>
          <button
            aria-label={playing ? 'Dayandır' : 'Oynat'}
            onClick={toggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
          >
            {playing ? <FiPause className="text-lg" /> : <FiPlay className="translate-x-[1px] text-lg" />}
          </button>
          <button
            aria-label="15 saniyə irəli"
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
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed & Sleep Timer controls */}
        <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {/* Playback Speed */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowSpeedMenu(!showSpeedMenu)
                setShowSleepMenu(false)
              }}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${
                playbackRate !== 1 
                  ? 'bg-brand/10 text-brand border-brand/20' 
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
              }`}
            >
              <FiClock size={12} />
              {playbackRate}x
            </button>
            
            {showSpeedMenu && (
              <div className="absolute left-0 bottom-full mb-1 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50 min-w-[90px]">
                {PLAYBACK_SPEEDS.map(speed => (
                  <button
                    key={speed}
                    onClick={(e) => {
                      e.stopPropagation()
                      setPlaybackRate(speed)
                      setShowSpeedMenu(false)
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                      playbackRate === speed ? 'text-brand font-semibold' : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowSleepMenu(!showSleepMenu)
                setShowSpeedMenu(false)
              }}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${
                sleepTimerMode 
                  ? 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' 
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
              }`}
            >
              <FiMoon size={12} />
              Yuxu
            </button>
            
            {showSleepMenu && (
              <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50 min-w-[120px]">
                {sleepTimerMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      cancelSleepTimer()
                      setShowSleepMenu(false)
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    ✕ Ləğv et
                  </button>
                )}
                {SLEEP_TIMER_OPTIONS.map(minutes => (
                  <button
                    key={minutes}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSleepTimer(minutes)
                      setShowSleepMenu(false)
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                      (sleepTimerMode === 'chapter' && minutes === 0) ? 'text-purple-600 font-semibold' : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {getSleepTimerLabel(minutes)}
                  </button>
                ))}
              </div>
            )}
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
      aria-label="Pleyeri aç"
    >
      <div className="relative flex items-center gap-3 p-3 pr-10">
        <button
          aria-label="Bağla"
          onClick={(e) => { e.stopPropagation(); close() }}
          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
        >
          <FiX className="text-sm" />
        </button>
        <button
          aria-label="Pleyeri genişlət"
          onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
          className="absolute right-2 bottom-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
        >
          <FiChevronUp className="text-sm" />
        </button>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white flex-shrink-0">
          {playing ? <FiPause className="text-base" /> : <FiPlay className="translate-x-[1px] text-base" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{track.title ?? 'İndi oxunur'}</div>
            {/* Speed indicator */}
            {playbackRate !== 1 && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-brand/10 text-brand">
                {playbackRate}x
              </span>
            )}
            {/* Sleep timer indicator */}
            {sleepTimerMode && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <FiMoon className="inline" size={10} />
              </span>
            )}
          </div>
          <div className="mt-1.5 h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div className="h-1 rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
