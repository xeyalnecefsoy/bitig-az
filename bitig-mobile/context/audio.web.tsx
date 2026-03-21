import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from 'react-native-track-player'
import { AudioContext, type ResolveCover } from '@/context/audioContext'
import { buildPlayerQueueTracks } from '@/lib/audioStream'
import type { Book, BookTrack } from '@/lib/types'

export { useAudio } from '@/context/useAudio'

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [activeTrack, setActiveTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRateState] = useState(1)
  const [queueBookId, setQueueBookId] = useState<string | null>(null)
  const [activeQueueIndex, setActiveQueueIndex] = useState(0)
  const [queueLength, setQueueLength] = useState(0)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)

  const elRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<Track[]>([])
  const indexRef = useRef(0)
  const playbackRateRef = useRef(1)

  const loadIndexRef = useRef<(index: number) => Promise<void>>(async () => {})

  useEffect(() => {
    playbackRateRef.current = playbackRate
  }, [playbackRate])

  const loadIndex = useCallback(async (index: number) => {
    const queue = queueRef.current
    const track = queue[index]
    const el = elRef.current
    if (!track || !el) return

    indexRef.current = index
    setActiveQueueIndex(index)
    setActiveTrack(track)

    el.src = track.url
    el.playbackRate = playbackRateRef.current

    await new Promise<void>((resolve, reject) => {
      const onCanPlay = () => {
        cleanup()
        resolve()
      }
      const onErr = () => {
        cleanup()
        reject(new Error('audio load failed'))
      }
      const cleanup = () => {
        el.removeEventListener('canplay', onCanPlay)
        el.removeEventListener('error', onErr)
      }
      el.addEventListener('canplay', onCanPlay, { once: true })
      el.addEventListener('error', onErr, { once: true })
      el.load()
    })

    const meta = track as { duration?: number }
    const metaD = typeof meta.duration === 'number' && meta.duration > 0 ? meta.duration : 0
    if (metaD > 0) {
      setDuration(metaD)
    } else {
      const d = el.duration
      if (Number.isFinite(d) && d > 0) setDuration(d)
    }
  }, [])

  loadIndexRef.current = loadIndex

  useEffect(() => {
    const el = new Audio()
    el.preload = 'auto'
    elRef.current = el

    const onTimeUpdate = () => setPosition(el.currentTime)
    const onLoadedMeta = () => {
      const d = el.duration
      if (Number.isFinite(d) && d > 0) setDuration(d)
    }
    const onPlaying = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      const q = queueRef.current
      const i = indexRef.current
      if (i < q.length - 1) {
        void loadIndexRef.current(i + 1).then(() => {
          el.play().catch(() => {})
        })
      } else {
        setIsPlaying(false)
      }
    }

    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('loadedmetadata', onLoadedMeta)
    el.addEventListener('durationchange', onLoadedMeta)
    el.addEventListener('playing', onPlaying)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)

    setIsReady(true)

    return () => {
      el.pause()
      el.src = ''
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('loadedmetadata', onLoadedMeta)
      el.removeEventListener('durationchange', onLoadedMeta)
      el.removeEventListener('playing', onPlaying)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      elRef.current = null
    }
  }, [])

  async function setupPlayer() {
    /* no-op on web; element mounts in useEffect */
  }

  async function playTrack(track: Track) {
    queueRef.current = [track]
    indexRef.current = 0
    setQueueLength(1)
    setQueueBookId(null)
    await loadIndex(0)
    await elRef.current?.play()
  }

  async function playQueue(tracks: Track[], startIndex = 0, bookId: string | null = null) {
    queueRef.current = tracks
    setQueueLength(tracks.length)
    setQueueBookId(bookId)
    await loadIndex(startIndex)
    await elRef.current?.play()
  }

  async function togglePlayback() {
    const el = elRef.current
    if (!el) return
    if (el.paused) {
      await el.play().catch((e) => console.warn('play failed', e))
    } else {
      el.pause()
    }
  }

  async function pausePlayback() {
    elRef.current?.pause()
  }

  async function seekTo(pos: number) {
    const el = elRef.current
    if (!el) return
    el.currentTime = Math.max(0, pos)
  }

  async function setPlaybackRate(rate: number) {
    playbackRateRef.current = rate
    setPlaybackRateState(rate)
    if (elRef.current) elRef.current.playbackRate = rate
  }

  async function skipToNextInQueue() {
    const q = queueRef.current
    const i = indexRef.current
    if (i >= q.length - 1) return
    await loadIndex(i + 1)
    await elRef.current?.play()
  }

  async function skipToPreviousInQueue() {
    const i = indexRef.current
    if (i <= 0) return
    await loadIndex(i - 1)
    await elRef.current?.play()
  }

  const playTrackAt = useCallback(
    async (book: Book, tracks: BookTrack[], resolveCover: ResolveCover, index: number) => {
      const queue = buildPlayerQueueTracks(book, tracks, resolveCover)
      if (queueBookId === book.id && queueRef.current.length === tracks.length) {
        await loadIndex(index)
        await elRef.current?.play()
        return
      }
      queueRef.current = queue
      setQueueLength(queue.length)
      setQueueBookId(book.id)
      await loadIndex(index)
      await elRef.current?.play()
    },
    [queueBookId, loadIndex]
  )

  const startOrTogglePlayback = useCallback(
    async (book: Book, tracks: BookTrack[], resolveCover: ResolveCover) => {
      const el = elRef.current
      if (queueBookId === book.id && queueRef.current.length > 0) {
        if (el && !el.paused) {
          el.pause()
        } else {
          await el?.play().catch((e) => console.warn('play failed', e))
        }
        return
      }
      await playTrackAt(book, tracks, resolveCover, 0)
    },
    [queueBookId, playTrackAt]
  )

  async function clearPlayback() {
    const el = elRef.current
    if (el) {
      el.pause()
      el.src = ''
      el.load()
    }
    queueRef.current = []
    indexRef.current = 0
    setQueueLength(0)
    setQueueBookId(null)
    setActiveQueueIndex(0)
    setActiveTrack(null)
    setPosition(0)
    setDuration(0)
    setIsPlaying(false)
  }

  return (
    <AudioContext.Provider
      value={{
        isReady,
        activeTrack,
        isPlaying,
        setupPlayer,
        playTrack,
        playQueue,
        togglePlayback,
        pausePlayback,
        seekTo,
        playbackRate,
        setPlaybackRate,
        queueBookId,
        activeQueueIndex,
        queueLength,
        position,
        duration,
        playTrackAt,
        startOrTogglePlayback,
        skipToNextInQueue,
        skipToPreviousInQueue,
        clearPlayback,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}
