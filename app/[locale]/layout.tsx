import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n'
import { LocaleProvider } from '@/context/locale'
import { Navbar, MobileNav, MobileHeader } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { GuestPopup } from '@/components/GuestPopup'
import { FloatingPlayer } from '@/components/FloatingPlayer'
import type { Metadata } from 'next'

// Localized metadata content
const localeMetadata = {
  az: {
    title: 'Bitig — Yerli İntellektual Sosial Şəbəkə',
    titleTemplate: '%s | Bitig',
    description: 'Bitig — Azərbaycanın ilk yerli intellektual sosial şəbəkəsi. Səsli kitabları kəşf edin, fikirlərinizi bölüşün və kitab həvəskarları ilə əlaqə qurun.',
    keywords: [
      'Bitig', 'bitig', 'bitig.az', 'bitiq', 'bitik',
      'səsli kitab', 'səsli kitablar', 'audiokitab', 'audiokitablar',
      'Azərbaycan səsli kitab', 'kitab dinlə', 'pulsuz səsli kitab',
      'Azərbaycan dilində kitablar', 'online kitab', 'kitabxana',
      'sosial şəbəkə', 'intellektual şəbəkə',
    ],
  },
  en: {
    title: 'Bitig — Local Intellectual Social Network',
    titleTemplate: '%s | Bitig',
    description: 'Bitig — The first local intellectual social network of Azerbaijan. Discover audiobooks, share your thoughts, and connect with book lovers.',
    keywords: [
      'Bitig', 'bitig', 'bitig.az',
      'audiobook', 'audiobooks', 'Azerbaijan audiobooks',
      'Azerbaijani audiobooks', 'listen to books', 'free audiobooks',
      'social network', 'intellectual network',
    ],
  },
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) return notFound()
  const lang = locale as Locale
  return (
    <LocaleProvider locale={lang}>
      <Navbar />
      <MobileHeader />
      <main className="min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
      <Footer locale={lang} />
      <FloatingPlayer />
      <MobileNav />
      <GuestPopup />
    </LocaleProvider>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  
  const meta = localeMetadata[locale as keyof typeof localeMetadata] || localeMetadata.az
  const siteName = 'Bitig'
  const baseUrl = 'https://bitig.az'
  
  return {
    title: {
      default: meta.title,
      template: meta.titleTemplate,
    },
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        az: `${baseUrl}/az`,
        en: `${baseUrl}/en`,
      },
    },
    openGraph: {
      siteName,
      title: meta.title,
      description: meta.description,
      locale: locale === 'az' ? 'az_AZ' : 'en_US',
      type: 'website',
      url: `${baseUrl}/${locale}`,
      images: [
        { 
          url: `${baseUrl}/og.png`, 
          width: 1200, 
          height: 630, 
          alt: meta.title 
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${baseUrl}/og.png`],
      creator: '@bitigaz',
      site: '@bitigaz',
    },
  }
}

