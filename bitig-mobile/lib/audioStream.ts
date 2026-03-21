import type { Book, BookTrack } from '@/lib/types'

/** Same origin as web: `/api/audio/stream/[trackId]` redirects to R2 signed URL or legacy audio. */
export const BITIG_SITE_URL = 'https://bitig.az'

export function streamUrlForTrack(trackId: string): string {
  return `${BITIG_SITE_URL}/api/audio/stream/${trackId}`
}

export function buildPlayerQueueTracks(
  book: Book,
  tracks: BookTrack[],
  resolveCover: (cover?: string | null, coverUrl?: string | null) => string
) {
  return tracks.map((t) => ({
    id: t.id,
    url: streamUrlForTrack(t.id),
    title: t.title,
    album: book.title,
    artist: book.author,
    artwork: resolveCover(book.cover, book.cover_url ?? null),
    duration: t.duration,
    bookId: book.id,
  }))
}
