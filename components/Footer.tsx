import Link from 'next/link'
import Image from 'next/image'
import { t, type Locale } from '@/lib/i18n'

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="border-t border-neutral-100 dark:border-neutral-800 mt-16">
      <div className="container-max py-10 pb-28 sm:pb-10 text-sm text-neutral-600 dark:text-neutral-300 grid gap-8 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Bitig Logo" width={20} height={20} />
          <span className="font-medium">Bitig</span>
        </div>
        <div className="grid gap-3 sm:text-right">
          {/* Removed Related Header */}
          <nav className="flex sm:justify-end gap-4 text-sm">
            <Link href={`/${locale}/audiobooks` as any} className="hover:text-brand">{t(locale, 'nav_audiobooks')}</Link>
            <Link href={`/${locale}/social` as any} className="hover:text-brand">{t(locale, 'nav_social')}</Link>
            <Link href={`/${locale}/profile` as any} className="hover:text-brand">{t(locale, 'nav_profile')}</Link>
          </nav>
          <div className="flex sm:justify-end gap-4 text-xs">
            <Link href={`/${locale}/contact` as any} className="hover:text-brand">{t(locale, 'footer_contact')}</Link>
            <Link href={`/${locale}/privacy` as any} className="hover:text-brand">{t(locale, 'footer_privacy')}</Link>
            <Link href={`/${locale}/terms` as any} className="hover:text-brand">{t(locale, 'footer_terms')}</Link>
            <Link href={`/${locale}/refund` as any} className="hover:text-brand">{t(locale, 'footer_refund')}</Link>
          </div>
        </div>
        <div className="sm:col-span-2 text-xs text-neutral-500 dark:text-neutral-400">© {new Date().getFullYear()} Bitig</div>
      </div>
    </footer>
  )
}
