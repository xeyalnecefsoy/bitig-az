"use client"
import { useMemo, useState, useEffect } from 'react'
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiList, FiMoon, FiClock } from 'react-icons/fi'
import { useAudio, PLAYBACK_SPEEDS, SLEEP_TIMER_OPTIONS, type PlaybackSpeed, type SleepTimerOption } from '@/context/audio'
import Image from 'next/image'

type Track = {
  id: string
  title: string
  audio_url?: string | null
  r2_key?: string | null
  duration?: number
}

// Helper to get the correct audio URL for a track
function getAudioUrl(track: Track): string {
  if (track.r2_key) {
    // Use R2 stream API for tracks with r2_key
    return `/api/audio/stream/${track.id}`
  }
  // Fallback to legacy audio_url
  return track.audio_url || ''
}

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

export function AudioPlayer({ tracks, title, cover, bookId }: { tracks: Track[]; title: string; cover: string; bookId?: string }) {
  const { 
    play, toggle, seek, setVolume, duration, currentTime, playing, volume, setExpanded, track, ended,
    playbackRate, setPlaybackRate,
    sleepTimer, sleepTimerMode, setSleepTimer, cancelSleepTimer
  } = useAudio()
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [showPlaylist, setShowPlaylist] = useState(true)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showSleepMenu, setShowSleepMenu] = useState(false)

  const currentTrack = tracks[currentTrackIndex]
  const currentTrackUrl = currentTrack ? getAudioUrl(currentTrack) : ''
  const isCurrentTrackLoaded = track?.src === currentTrackUrl

  // Auto-play next track
  useEffect(() => {
    if (ended && isCurrentTrackLoaded) {
      // Don't auto-play next track if sleep timer is set to 'chapter'
      if (sleepTimerMode === 'chapter') {
        return
      }
      if (currentTrackIndex < tracks.length - 1) {
        playTrack(currentTrackIndex + 1)
      }
    }
  }, [ended, isCurrentTrackLoaded, currentTrackIndex, tracks.length, sleepTimerMode])

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

  const playTrack = async (index: number) => {
    const t = tracks[index]
    if (!t) return
    setCurrentTrackIndex(index)
    const audioUrl = getAudioUrl(t)
    await play({ src: audioUrl, title: t.title, bookId, trackId: t.id })
    setExpanded(false)
  }

  const onPrimary = async () => {
    if (isCurrentTrackLoaded) {
      toggle()
    } else {
      await playTrack(currentTrackIndex)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Player Controls */}
      <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 shadow-soft dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
            {cover ? (
              <Image src={cover} alt={title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <FiVolume2 size={20} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">{title}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              {currentTrack?.title || 'Seçilmiş trek yoxdur'}
            </p>
          </div>
          
          {/* Speed & Sleep Timer buttons (desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSpeedMenu(!showSpeedMenu)
                  setShowSleepMenu(false)
                }}
                className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                  playbackRate !== 1 
                    ? 'bg-brand/10 text-brand border-brand/20' 
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                }`}
                title="Səs sürəti"
              >
                {playbackRate}x
              </button>
              
              {showSpeedMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50 min-w-[100px]">
                  {PLAYBACK_SPEEDS.map(speed => (
                    <button
                      key={speed}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPlaybackRate(speed)
                        setShowSpeedMenu(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                        playbackRate === speed ? 'text-brand font-semibold' : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {speed}x {speed === 1 && '(Normal)'}
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
                className={`p-2 rounded-md border transition-colors ${
                  sleepTimerMode 
                    ? 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' 
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                }`}
                title="Yuxu vaxtı"
              >
                <FiMoon size={16} />
              </button>
              
              {showSleepMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50 min-w-[140px]">
                  <div className="px-3 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                    Yuxu vaxtı
                  </div>
                  {sleepTimerMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        cancelSleepTimer()
                        setShowSleepMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                        (sleepTimerMode === 'chapter' && minutes === 0) || 
                        (sleepTimerMode === 'time' && sleepTimer && Math.ceil(sleepTimer / 60) === minutes)
                          ? 'text-purple-600 font-semibold' 
                          : 'text-neutral-700 dark:text-neutral-300'
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

        {/* Sleep Timer countdown indicator */}
        {sleepTimerMode && (
          <div className="mb-3 flex items-center justify-between px-2 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm">
            <div className="flex items-center gap-2">
              <FiMoon size={14} />
              <span>
                {sleepTimerMode === 'chapter' 
                  ? 'Fəsil sonunda dayanacaq' 
                  : `${formatTime(sleepTimer || 0)} sonra dayanacaq`}
              </span>
            </div>
            <button 
              onClick={cancelSleepTimer}
              className="text-xs hover:underline"
            >
              Ləğv et
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            aria-label={playing && isCurrentTrackLoaded ? 'Dayandır' : 'Oynat'}
            onClick={onPrimary}
            disabled={tracks.length === 0}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
          >
            {playing && isCurrentTrackLoaded ? <FiPause className="text-xl" /> : <FiPlay className="translate-x-[1px] text-xl" />}
          </button>
          
          <div className="flex shrink-0 items-center gap-1">
            <button
              aria-label="15 saniyə geri"
              onClick={() => isCurrentTrackLoaded && seek(currentTime - 15)}
              disabled={!isCurrentTrackLoaded}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800 ${!isCurrentTrackLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiSkipBack />
            </button>
            <button
              aria-label="15 saniyə irəli"
              onClick={() => isCurrentTrackLoaded && seek(currentTime + 15)}
              disabled={!isCurrentTrackLoaded}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800 ${!isCurrentTrackLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiSkipForward />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={isCurrentTrackLoaded ? duration : 1}
              value={isCurrentTrackLoaded ? currentTime : 0}
              onChange={e => isCurrentTrackLoaded && seek(Number(e.target.value))}
              disabled={!isCurrentTrackLoaded}
              className={`w-full accent-brand ${!isCurrentTrackLoaded ? 'cursor-not-allowed opacity-50' : ''}`}
            />
            <div className="mt-0.5 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
              <span className="tabular-nums">{formatTime(isCurrentTrackLoaded ? currentTime : 0)}</span>
              <span className="tabular-nums">{formatTime(isCurrentTrackLoaded ? duration : 0)}</span>
            </div>
          </div>

          <div className="ml-1 hidden shrink-0 items-center gap-1.5 lg:flex">
            <FiVolume2 className="text-neutral-500 dark:text-neutral-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="w-20 accent-brand"
              aria-label="Səs"
            />
          </div>
        </div>

        {/* Mobile Speed & Sleep buttons */}
        <div className="flex sm:hidden items-center justify-center gap-3 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowSpeedMenu(!showSpeedMenu)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border ${
              playbackRate !== 1 
                ? 'bg-brand/10 text-brand border-brand/20' 
                : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
            }`}
          >
            <FiClock size={14} />
            {playbackRate}x
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowSleepMenu(!showSleepMenu)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border ${
              sleepTimerMode 
                ? 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' 
                : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
            }`}
          >
            <FiMoon size={14} />
            {sleepTimerMode 
              ? (sleepTimerMode === 'chapter' ? 'Fəsil' : formatTime(sleepTimer || 0))
              : 'Yuxu'}
          </button>
        </div>
      </div>

      {/* Playlist */}
      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer"
          onClick={() => setShowPlaylist(!showPlaylist)}
        >
          <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <FiList /> Siyahı ({tracks.length})
          </h3>
          <span className="text-xs text-neutral-500">{showPlaylist ? 'Gizlət' : 'Göstər'}</span>
        </div>
        
        {showPlaylist && (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[400px] overflow-y-auto">
            {tracks.map((t, i) => {
              const isActive = currentTrackIndex === i
              const isPlayingThis = isActive && playing && isCurrentTrackLoaded
              
              return (
                <button
                  key={t.id}
                  onClick={() => playTrack(i)}
                  className={`w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                    isActive ? 'bg-brand/5 dark:bg-brand/10' : ''
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isActive ? 'bg-brand text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  }`}>
                    {isPlayingThis ? <FiVolume2 /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate ${isActive ? 'text-brand' : 'text-neutral-900 dark:text-white'}`}>
                      {t.title}
                    </p>
                    {t.duration && (
                      <p className="text-xs text-neutral-500">{formatTime(t.duration)}</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="text-brand text-xs font-medium px-2 py-1 rounded-full bg-brand/10">
                      Oynanır
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
