import { SocialProvider } from '@/context/social'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bitig Social — Kitab Həvəskarları Üçün Sosial Şəbəkə',
  description: 'Kitab həvəskarları ilə əlaqə qurun, fikirlərinizi bölüşün, müzakirə edin. Azərbaycan kitab icması üçün sosial platforma.',
  openGraph: {
    title: 'Bitig Social — Kitab Həvəskarları Üçün Sosial Şəbəkə',
    description: 'Kitab həvəskarları ilə əlaqə qurun, fikirlərinizi bölüşün, müzakirə edin.',
    images: [{ url: 'https://bitig.az/og.png', width: 1200, height: 630, alt: 'Bitig Social' }],
  },
}

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SocialProvider>{children}</SocialProvider>
}

