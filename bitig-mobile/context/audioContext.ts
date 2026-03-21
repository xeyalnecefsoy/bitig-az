import { createContext } from 'react'
import type { Track } from 'react-native-track-player'
import type { Book, BookTrack } from '@/lib/types'

export type ResolveCover = (cover?: string | null, coverUrl?: string | null) => string

export interface AudioContextType {
  isReady: boolean
  activeTrack: Track | null
  isPlaying: boolean
  setupPlayer: () => Promise<void>
  playTrack: (track: Track) => Promise<void>
  playQueue: (tracks: Track[], startIndex?: number, bookId?: string | null) => Promise<void>
  togglePlayback: () => Promise<void>
  pausePlayback: () => Promise<void>
  seekTo: (position: number) => Promise<void>
  playbackRate: number
  setPlaybackRate: (rate: number) => Promise<void>
  queueBookId: string | null
  activeQueueIndex: number
  /** Current play queue length (chapters/tracks). */
  queueLength: number
  position: number
  duration: number
  playTrackAt: (book: Book, tracks: BookTrack[], resolveCover: ResolveCover, index: number) => Promise<void>
  startOrTogglePlayback: (book: Book, tracks: BookTrack[], resolveCover: ResolveCover) => Promise<void>
  skipToNextInQueue: () => Promise<void>
  skipToPreviousInQueue: () => Promise<void>
  /** Növbəni təmizləyir, oxunu dayandırır — mini pleyer gizlənir. */
  clearPlayback: () => Promise<void>
}

export const AudioContext = createContext<AudioContextType | null>(null)
