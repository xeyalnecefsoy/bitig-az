import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/auth'
import { CartProvider } from '@/context/cart'
import { LocaleProvider } from '@/context/locale'
import { ThemeProvider } from '@/context/theme'
import { AudioProvider } from '@/context/audio'
import { SocialProvider } from '@/context/social'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: {
    default: 'Bitig — Yerli İntellektual Sosial Şəbəkə',
    template: '%s | Bitig',
  },
  description: 'Bitig — Azərbaycanın ilk yerli intellektual sosial şəbəkəsi. Səsli kitabları kəşf edin, fikirlərinizi bölüşün və kitab həvəskarları ilə əlaqə qurun.',
  keywords: [
    // Primary brand keywords
    'Bitig', 'bitig', 'bitig.az', 'bitiq', 'bitik',
    // Azerbaijani keywords (primary)
    'səsli kitab', 'səsli kitablar', 'audiokitab', 'audiokitablar',
    'Azərbaycan səsli kitab', 'Azərbaycan audiokitab',
    'kitab dinlə', 'kitab dinləmək', 'pulsuz səsli kitab',
    'Azərbaycan dilində kitablar', 'online kitab', 'elektron kitab',
    'kitabxana', 'ən yaxşı kitablar', 'yeni kitablar',
    // Turkish variants (for users searching in Turkish)
    'sesli kitap', 'sesli kitaplar', 'Azerbaycan sesli kitap',
    // English variants (secondary)
    'audiobook', 'audiobooks', 'Azerbaijan audiobooks',
    'Azerbaijani audiobooks', 'listen to books',
  ],
  authors: [{ name: 'Bitig' }],
  creator: 'Bitig',
  publisher: 'Bitig',
  metadataBase: new URL('https://bitig.az'),
  alternates: {
    canonical: '/az',
    languages: {
      'az': '/az',
      'en': '/en',
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Bitig — Yerli İntellektual Sosial Şəbəkə',
    description: 'Bitig — Azərbaycanın ilk yerli intellektual sosial şəbəkəsi. Səsli kitabları kəşf edin, fikirlərinizi bölüşün və kitab həvəskarları ilə əlaqə qurun.',
    url: 'https://bitig.az',
    siteName: 'Bitig',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Bitig — Azərbaycan Səsli Kitab Platforması',
      },
    ],
    locale: 'az_AZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bitig — Yerli İntellektual Sosial Şəbəkə',
    description: 'Azərbaycanın ilk yerli intellektual sosial şəbəkəsi. Səsli kitabları kəşf edin və fikirlərinizi bölüşün.',
    images: ['/og.png'],
    creator: '@bitigaz',
    site: '@bitigaz',
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
  other: {
    'google-site-verification': '', // Add your verification code here
  },
}

export const viewport: Viewport = {
  themeColor: '#4AD860',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bitig',
    alternateName: ['Bitig.az', 'Bitiq', 'Bitik'],
    url: 'https://bitig.az',
    description: 'Azərbaycanın ən yaxşı səsli kitab platforması. Səsli kitabları kəşf edin, dinləyin və kitab həvəskarları ilə əlaqə qurun.',
    inLanguage: ['az', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://bitig.az/az/audiobooks?search={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bitig',
      url: 'https://bitig.az',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bitig.az/logo.png'
      }
    }
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bitig',
    alternateName: 'Bitig.az',
    url: 'https://bitig.az',
    logo: 'https://bitig.az/logo.png',
    description: 'Azərbaycanın ən yaxşı səsli kitab platforması',
    foundingDate: '2024',
    sameAs: [
      'https://twitter.com/bitigaz',
      'https://instagram.com/bitigaz',
      'https://facebook.com/bitigaz'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['az', 'en']
    }
  }

  return (
    <html lang="az" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <AudioProvider>
              <CartProvider>
                <SocialProvider>
                  <LocaleProvider locale="az">
                    {children}
                  </LocaleProvider>
                </SocialProvider>
              </CartProvider>
            </AudioProvider>
          </ThemeProvider>
        </AuthProvider>
        <script
          id="json-ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          id="json-ld-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <SpeedInsights />
      </body>
    </html>
  )
}

