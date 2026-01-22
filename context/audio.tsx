"use client"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type AudioTrack = {
  src: string
  title?: string
  bookId?: string
  trackId?: string
}

// Playback speed options
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
export type PlaybackSpeed = typeof PLAYBACK_SPEEDS[number]

// Sleep timer options (in minutes, 0 = chapter end)
export const SLEEP_TIMER_OPTIONS = [5, 15, 30, 45, 60, 0] as const
export type SleepTimerOption = typeof SLEEP_TIMER_OPTIONS[number]

type AudioState = {
  track: AudioTrack | null
  playing: boolean
  ended: boolean
  currentTime: number
  duration: number
  volume: number
  expanded: boolean
  // New: Playback Speed
  playbackRate: PlaybackSpeed
  setPlaybackRate: (rate: PlaybackSpeed) => void
  // New: Sleep Timer
  sleepTimer: number | null // remaining seconds, null = off
  sleepTimerMode: 'time' | 'chapter' | null
  setSleepTimer: (minutes: SleepTimerOption) => void
  cancelSleepTimer: () => void
  // Existing
  play: (t: AudioTrack) => Promise<void>
  toggle: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (v: number) => void
  setExpanded: (v: boolean) => void
  close: () => void
}

const AudioCtx = createContext<AudioState | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [expanded, setExpanded] = useState(false)
  const [ended, setEnded] = useState(false)
  
  // New: Playback Speed state
  const [playbackRate, setPlaybackRateState] = useState<PlaybackSpeed>(1)
  
  // New: Sleep Timer state
  const [sleepTimer, setSleepTimerState] = useState<number | null>(null)
  const [sleepTimerMode, setSleepTimerMode] = useState<'time' | 'chapter' | null>(null)
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Create audio element once
  useEffect(() => {
    const el = document.createElement('audio')
    el.preload = 'metadata'
    el.volume = volume
    el.playbackRate = playbackRate
    
    const onLoaded = () => setDuration(el.duration || 0)
    const onTime = () => setCurrentTime(el.currentTime)
    const onEnd = () => {
      setPlaying(false)
      setEnded(true)
      // If sleep timer is set to 'chapter', stop here
      if (sleepTimerMode === 'chapter') {
        cancelSleepTimer()
      }
    }
    const onPlay = () => setEnded(false)
    
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('ended', onEnd)
    el.addEventListener('play', onPlay)
    
    audioRef.current = el
    return () => {
      el.pause()
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('ended', onEnd)
      el.removeEventListener('play', onPlay)
    }
  }, [])

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Update playback rate when changed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0 && playing) {
      sleepTimerRef.current = setInterval(() => {
        setSleepTimerState(prev => {
          if (prev === null || prev <= 1) {
            // Timer reached zero - pause audio
            if (audioRef.current) {
              audioRef.current.pause()
              setPlaying(false)
            }
            clearInterval(sleepTimerRef.current!)
            setSleepTimerMode(null)
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      return () => {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current)
      }
    }
  }, [sleepTimer, playing])

  const setPlaybackRate = useCallback((rate: PlaybackSpeed) => {
    setPlaybackRateState(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitig_playback_rate', String(rate))
    }
  }, [])

  const setSleepTimer = useCallback((minutes: SleepTimerOption) => {
    if (minutes === 0) {
      // Chapter end mode
      setSleepTimerMode('chapter')
      setSleepTimerState(null) // No countdown, will stop at track end
    } else {
      setSleepTimerMode('time')
      setSleepTimerState(minutes * 60) // Convert to seconds
    }
  }, [])

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current)
    }
    setSleepTimerState(null)
    setSleepTimerMode(null)
  }, [])

  // Load saved playback rate on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bitig_playback_rate')
      if (saved) {
        const rate = parseFloat(saved) as PlaybackSpeed
        if (PLAYBACK_SPEEDS.includes(rate)) {
          setPlaybackRateState(rate)
        }
      }
    }
  }, [])

  const play = useCallback(async (t: AudioTrack) => {
    const el = audioRef.current
    if (!el) return
    if (!track || track.src !== t.src) {
      el.src = t.src
      setTrack({ src: t.src, title: t.title, bookId: t.bookId, trackId: t.trackId })
      setEnded(false)
      // Reset time when new track loads
      try { await el.play(); setPlaying(true) } catch {}
    } else {
      try { await el.play(); setPlaying(true) } catch {}
    }
  }, [track])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else { el.play().then(() => setPlaying(true)).catch(() => {}) }
  }, [playing])

  const pause = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    setPlaying(false)
  }, [])

  const seek = useCallback((time: number) => {
    const el = audioRef.current
    if (!el) return
    const safe = Math.min(Math.max(0, time), duration || 0)
    el.currentTime = safe
    setCurrentTime(safe)
    if (safe < duration) setEnded(false)
  }, [duration])

  const close = useCallback(() => {
    const el = audioRef.current
    if (el) {
      try { el.pause() } catch {}
      el.src = ''
    }
    setPlaying(false)
    setEnded(false)
    setTrack(null)
    setCurrentTime(0)
    setDuration(0)
    setExpanded(false)
    cancelSleepTimer()
  }, [cancelSleepTimer])

  const value = useMemo<AudioState>(() => ({
    track,
    playing,
    ended,
    currentTime,
    duration,
    volume,
    expanded,
    playbackRate,
    setPlaybackRate,
    sleepTimer,
    sleepTimerMode,
    setSleepTimer,
    cancelSleepTimer,
    play,
    toggle,
    pause,
    seek,
    setVolume,
    setExpanded,
    close,
  }), [track, playing, ended, currentTime, duration, volume, expanded, playbackRate, setPlaybackRate, sleepTimer, sleepTimerMode, setSleepTimer, cancelSleepTimer, play, toggle, pause, seek, close])

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
