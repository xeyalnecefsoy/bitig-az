
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bitig — Azerbaijani Audiobooks Platform',
    short_name: 'Bitig',
    description: 'Listen to the best Azerbaijani audiobooks. Discover new reads, connect with book lovers, and enjoy premium narration.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a', // Brand color
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
