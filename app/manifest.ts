
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bitig — Azərbaycan Səsli Kitab Platforması',
    short_name: 'Bitig',
    description: 'Azərbaycanın ən yaxşı səsli kitab platforması. Səsli kitabları kəşf edin, dinləyin və kitab həvəskarları ilə əlaqə qurun.',
    start_url: '/az',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1', // Brand color (indigo)
    lang: 'az',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

