import React, { useCallback, useEffect, useState } from 'react'
import TrackPlayer, {
  AndroidAudioContentType,
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  IOSCategory,
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player'
import type { Track } from 'react-native-track-player'
import { AudioContext, type ResolveCover } from '@/context/audioContext'
import { buildPlayerQueueTracks } from '@/lib/audioStream'
import type { Book, BookTrack } from '@/lib/types'

export { useAudio } from '@/context/useAudio'

function NativeProgressSync({
  onProgress,
}: {
  onProgress: (p: { position: number; duration: number }) => void
}) {
  const { position, duration } = useProgress()
  useEffect(() => {
    onProgress({ position, duration })
  }, [position, duration, onProgress])
  return null
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [activeTrack, setActiveTrack] = useState<Track | null>(null)
  const [playbackRate, setPlaybackRateState] = useState(1)
  const [queueBookId, setQueueBookId] = useState<string | null>(null)
  const [activeQueueIndex, setActiveQueueIndex] = useState(0)
  const [queueLength, setQueueLength] = useState(0)
  const [progress, setProgress] = useState({ position: 0, duration: 0 })

  const onProgress = useCallback((p: { position: number; duration: number }) => {
    setProgress(p)
  }, [])

  const playbackState = usePlaybackState()
  const isPlaying = playbackState.state === State.Playing

  const syncActiveFromPlayer = useCallback(async () => {
    try {
      const idx = await TrackPlayer.getActiveTrackIndex()
      const track = await TrackPlayer.getActiveTrack()
      const queue = await TrackPlayer.getQueue()
      setQueueLength(queue.length)
      setActiveTrack(track ?? null)
      if (typeof idx === 'number' && idx >= 0) setActiveQueueIndex(idx)
    } catch {
      setQueueLength(0)
      /* empty queue */
    }
  }, [])

  useEffect(() => {
    void setupPlayer()
  }, [])

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged) {
      await syncActiveFromPlayer()
    }
  })

  async function setupPlayer() {
    if (isReady) return

    try {
      await TrackPlayer.setupPlayer({
        iosCategory: IOSCategory.Playback,
        autoHandleInterruptions: true,
        androidAudioContentType: AndroidAudioContentType.Music,
      })
      const notificationCaps = [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
        Capability.JumpForward,
        Capability.JumpBackward,
      ]
      await TrackPlayer.updateOptions({
        capabilities: notificationCaps,
        notificationCapabilities: notificationCaps,
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        forwardJumpInterval: 15,
        backwardJumpInterval: 15,
        progressUpdateEventInterval: 1,
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.PausePlayback,
          alwaysPauseOnInterruption: false,
        },
      })
      await TrackPlayer.setRepeatMode(RepeatMode.Queue)
      const r = await TrackPlayer.getRate()
      setPlaybackRateState(r)
      setIsReady(true)
    } catch (e) {
      console.log('Error setting up player', e)
      setIsReady(true)
    }
  }

  async function playTrack(track: Track) {
    if (!isReady) await setupPlayer()
    setQueueBookId(null)
    await TrackPlayer.reset()
    await TrackPlayer.add(track)
    await TrackPlayer.play()
    await syncActiveFromPlayer()
  }

  async function playQueue(tracks: Track[], startIndex = 0, bookId: string | null = null) {
    if (!isReady) await setupPlayer()
    setQueueBookId(bookId)
    setActiveQueueIndex(startIndex)
    await TrackPlayer.reset()
    await TrackPlayer.add(tracks)
    if (startIndex > 0) {
      await TrackPlayer.skip(startIndex)
    }
    await TrackPlayer.play()
    await syncActiveFromPlayer()
  }

  async function togglePlayback() {
    if (isPlaying) {
      await TrackPlayer.pause()
    } else {
      await TrackPlayer.play()
    }
  }

  async function pausePlayback() {
    await TrackPlayer.pause()
  }

  async function seekTo(position: number) {
    await TrackPlayer.seekTo(Math.max(0, position))
  }

  async function setPlaybackRate(rate: number) {
    await TrackPlayer.setRate(rate)
    setPlaybackRateState(rate)
  }

  async function skipToNextInQueue() {
    await TrackPlayer.skipToNext()
    await syncActiveFromPlayer()
  }

  async function skipToPreviousInQueue() {
    await TrackPlayer.skipToPrevious()
    await syncActiveFromPlayer()
  }

  const clearPlayback = useCallback(async () => {
    if (!isReady) {
      setQueueBookId(null)
      setActiveTrack(null)
      setQueueLength(0)
      setActiveQueueIndex(0)
      setProgress({ position: 0, duration: 0 })
      return
    }
    try {
      await TrackPlayer.reset()
      setQueueBookId(null)
      await syncActiveFromPlayer()
    } catch {
      setQueueBookId(null)
      setActiveTrack(null)
      setQueueLength(0)
      setActiveQueueIndex(0)
      setProgress({ position: 0, duration: 0 })
    }
  }, [isReady, syncActiveFromPlayer])

  const playTrackAt = useCallback(
    async (book: Book, tracks: BookTrack[], resolveCover: ResolveCover, index: number) => {
      const queue = buildPlayerQueueTracks(book, tracks, resolveCover)
      if (queueBookId === book.id) {
        const q = await TrackPlayer.getQueue()
        if (q.length === tracks.length) {
          await TrackPlayer.skip(index)
          await TrackPlayer.play()
          await syncActiveFromPlayer()
          return
        }
      }
      await playQueue(queue, index, book.id)
    },
    [queueBookId, syncActiveFromPlayer]
  )

  const startOrTogglePlayback = useCallback(
    async (book: Book, tracks: BookTrack[], resolveCover: ResolveCover) => {
      const pb = await TrackPlayer.getPlaybackState()
      const q = await TrackPlayer.getQueue()
      if (queueBookId === book.id && pb.state !== State.None && q.length > 0) {
        if (pb.state === State.Playing) {
          await TrackPlayer.pause()
        } else {
          await TrackPlayer.play()
        }
        return
      }
      await playTrackAt(book, tracks, resolveCover, 0)
    },
    [queueBookId, playTrackAt]
  )

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
        position: progress.position,
        duration: progress.duration,
        playTrackAt,
        startOrTogglePlayback,
        skipToNextInQueue,
        skipToPreviousInQueue,
        clearPlayback,
      }}
    >
      <NativeProgressSync onProgress={onProgress} />
      {children}
    </AudioContext.Provider>
  )
}
