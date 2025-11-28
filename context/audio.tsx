"use client"
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type AudioTrack = {
  src: string
  title?: string
}

type AudioState = {
  track: AudioTrack | null
  playing: boolean
  ended: boolean
  currentTime: number
  duration: number
  volume: number
  expanded: boolean
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

  // Create audio element once
  useEffect(() => {
    const el = document.createElement('audio')
    el.preload = 'metadata'
    el.volume = volume
    const onLoaded = () => setDuration(el.duration || 0)
    const onTime = () => setCurrentTime(el.currentTime)
    const onEnd = () => {
      setPlaying(false)
      setEnded(true)
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

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const play = useCallback(async (t: AudioTrack) => {
    const el = audioRef.current
    if (!el) return
    if (!track || track.src !== t.src) {
      el.src = t.src
      setTrack({ src: t.src, title: t.title })
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
  }, [])

  const value = useMemo<AudioState>(() => ({
    track,
    playing,
    ended,
    currentTime,
    duration,
    volume,
    expanded,
    play,
    toggle,
    pause,
    seek,
    setVolume,
    setExpanded,
    close,
  }), [track, playing, ended, currentTime, duration, volume, expanded, play, toggle, pause, seek, close])

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
