import type { Track } from 'react-native-track-player'
import type { BookTrack } from '@/lib/types'

/**
 * Native player often reports duration 0 for streamed/redirected audio until metadata loads.
 * Use queued track / DB duration so the slider and timestamps match the chapter list.
 */
export function resolvePlaybackDuration(
  playerDuration: number,
  activeTrack: Track | null,
  bookTracks: BookTrack[] | undefined,
  activeIndex: number
): number {
  if (Number.isFinite(playerDuration) && playerDuration > 0) {
    return playerDuration
  }
  const fromQueued =
    activeTrack && typeof activeTrack.duration === 'number' && activeTrack.duration > 0
      ? activeTrack.duration
      : 0
  if (fromQueued > 0) return fromQueued
  const t = bookTracks?.[activeIndex]
  if (t && typeof t.duration === 'number' && t.duration > 0) {
    return t.duration
  }
  return 0
}

/** Full-screen player: no bookTracks in scope — only native progress + Track metadata. */
export function resolvePlaybackDurationSimple(playerDuration: number, activeTrack: Track | null): number {
  if (Number.isFinite(playerDuration) && playerDuration > 0) return playerDuration
  if (activeTrack && typeof activeTrack.duration === 'number' && activeTrack.duration > 0) {
    return activeTrack.duration
  }
  return 0
}
