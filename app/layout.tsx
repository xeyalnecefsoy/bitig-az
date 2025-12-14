import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/cart'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Bitig — Azerbaijani Audiobooks Platform',
    template: '%s | Bitig',
  },
  description: 'Listen to the best Azerbaijani audiobooks. Discover new reads, connect with book lovers, and enjoy premium narration. Səsli kitablar, audiokitablar və daha çoxu.',
  keywords: [
    'Bitig', 'bitik', 'bitiq', 
    'səsli kitab', 'audiokitab', 'audiobook', 
    'sesli kitap', 
    'Azerbaijan audiobooks', 'Azərbaycan', 'kitab dinlə',
    'Azərbaycan dilində kitablar', 'online kitab',
    'kitabxana'
  ],
  authors: [{ name: 'Bitig Team' }],
  creator: 'Bitig Team',
  publisher: 'Bitig',
  metadataBase: new URL('https://bitig.az'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'az': '/az',
    },
  },
  openGraph: {
    title: 'Bitig — Azerbaijani Audiobooks Platform',
    description: 'Listen to the best Azerbaijani audiobooks. Discover new reads, connect with book lovers, and enjoy premium narration.',
    url: 'https://bitig.az',
    siteName: 'Bitig',
    images: [
      {
        url: '/logo.png', // Using the square logo for now as requested default
        width: 512,
        height: 512,
        alt: 'Bitig Logo',
      },
    ],
    locale: 'az_AZ',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Bitig — Azerbaijani Audiobooks Platform',
    description: 'Listen to the best Azerbaijani audiobooks. Discover new reads, connect with book lovers, and enjoy premium narration.',
    images: ['/logo.png'], // Square logo fits 'summary' card best
    creator: '@bitigaz', // Assuming handle, can be generic if unknown
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Books & Reference',
  applicationName: 'Bitig',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bitig',
    url: 'https://bitig.az',
    description: 'Listen to the best Azerbaijani audiobooks.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://bitig.az/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <CartProvider>
            {children}
          </CartProvider>
      </body>
    </html>
  )
}
