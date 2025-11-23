import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n'
import { LocaleProvider } from '@/context/locale'
import { Navbar, MobileNav, MobileHeader } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartProvider } from '@/context/cart'
import { ThemeProvider } from '@/context/theme'
import { SocialProvider } from '@/context/social'
import { GuestPopup } from '@/components/GuestPopup'
import { AudioProvider } from '@/context/audio'
import { FloatingPlayer } from '@/components/FloatingPlayer'
import type { Metadata } from 'next'

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return notFound()
  const lang = locale as Locale
  return (
    <ThemeProvider>
      <AudioProvider>
        <CartProvider> {/* Added CartProvider */}
          <SocialProvider> {/* Added SocialProvider */}
            <LocaleProvider locale={lang}> {/* Retained LocaleProvider */}
              <Navbar />
              <MobileHeader />
              <main className="min-h-screen pb-20 lg:pb-0"> {/* Modified className */}
                {children}
              </main>
              <Footer locale={lang} />
              <FloatingPlayer />
              <MobileNav />
              <GuestPopup />
            </LocaleProvider>
          </SocialProvider>
        </CartProvider>
      </AudioProvider>
    </ThemeProvider>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const siteName = 'Bitig'
  const title = {
    default: 'Bitig — Audiobooks platform',
    template: '%s · Bitig',
  }
  const description = 'Discover and listen to curated audiobooks. Social engagement, playlists, and more.'
  return {
    title,
    description,
    alternates: {
      languages: {
        en: '/en',
        az: '/az',
      },
    },
    openGraph: {
      siteName,
      title: title.default,
      description,
      locale,
      type: 'website',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title.default,
      description,
      images: ['/og.png'],
    },
  }
}
