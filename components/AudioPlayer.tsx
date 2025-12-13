"use client"
import { useMemo, useState, useEffect } from 'react'
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiList } from 'react-icons/fi'
import { useAudio } from '@/context/audio'
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

export function AudioPlayer({ tracks, title, cover }: { tracks: Track[]; title: string; cover: string }) {
  const { play, toggle, seek, setVolume, duration, currentTime, playing, volume, setExpanded, track, ended } = useAudio()
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [showPlaylist, setShowPlaylist] = useState(true)

  const currentTrack = tracks[currentTrackIndex]
  const currentTrackUrl = currentTrack ? getAudioUrl(currentTrack) : ''
  const isCurrentTrackLoaded = track?.src === currentTrackUrl

  // Auto-play next track
  useEffect(() => {
    if (ended && isCurrentTrackLoaded) {
      if (currentTrackIndex < tracks.length - 1) {
        playTrack(currentTrackIndex + 1)
      }
    }
  }, [ended, isCurrentTrackLoaded, currentTrackIndex, tracks.length])

  const fmt = useMemo(() => (n: number) => {
    if (!isFinite(n)) return '0:00'
    const h = Math.floor(n / 3600)
    const m = Math.floor((n % 3600) / 60)
    const s = Math.floor(n % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const playTrack = async (index: number) => {
    const t = tracks[index]
    if (!t) return
    setCurrentTrackIndex(index)
    const audioUrl = getAudioUrl(t)
    await play({ src: audioUrl, title: t.title })
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
            <Image src={cover} alt={title} fill className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">{title}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              {currentTrack?.title || 'No track selected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label={playing && isCurrentTrackLoaded ? 'Pause' : 'Play'}
            onClick={onPrimary}
            disabled={tracks.length === 0}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
          >
            {playing && isCurrentTrackLoaded ? <FiPause className="text-xl" /> : <FiPlay className="translate-x-[1px] text-xl" />}
          </button>
          
          <div className="flex shrink-0 items-center gap-1">
            <button
              aria-label="Back 15 seconds"
              onClick={() => isCurrentTrackLoaded && seek(currentTime - 15)}
              disabled={!isCurrentTrackLoaded}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800 ${!isCurrentTrackLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiSkipBack />
            </button>
            <button
              aria-label="Forward 15 seconds"
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
              <span className="tabular-nums">{fmt(isCurrentTrackLoaded ? currentTime : 0)}</span>
              <span className="tabular-nums">{fmt(isCurrentTrackLoaded ? duration : 0)}</span>
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
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      {/* Playlist */}
      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer"
          onClick={() => setShowPlaylist(!showPlaylist)}
        >
          <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <FiList /> Playlist ({tracks.length})
          </h3>
          <span className="text-xs text-neutral-500">{showPlaylist ? 'Hide' : 'Show'}</span>
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
                      <p className="text-xs text-neutral-500">{fmt(t.duration)}</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="text-brand text-xs font-medium px-2 py-1 rounded-full bg-brand/10">
                      Playing
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
