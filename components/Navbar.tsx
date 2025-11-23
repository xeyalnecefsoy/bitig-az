'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/cart'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import { FiGlobe, FiMoon, FiSun, FiShoppingCart, FiHome, FiHeadphones, FiUser, FiMessageCircle } from 'react-icons/fi'
import { useTheme } from '@/context/theme'
import { NotificationsBtn } from './NotificationsBtn'

export function Navbar() {
  const { count } = useCart()
  const locale = useLocale()
  const homeHref: string = `/${locale}`
  const audiobooksHref: string = `/${locale}/audiobooks`
  const socialHref: string = `/${locale}/social`
  const cartHref: string = `/${locale}/cart`
  const { theme, toggle } = useTheme()
  return (
    <header className="hidden lg:block sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-neutral-100 dark:supports-[backdrop-filter]:bg-neutral-950/70 dark:bg-neutral-950/90 dark:border-neutral-800">
      <div className="container-max h-16 flex items-center justify-between">
        <Link href={homeHref as any} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-brand" />
          <span className="font-semibold text-lg">Bitig</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-sm text-neutral-800 dark:text-neutral-100">
          <Link href={audiobooksHref as any} className="hover:text-brand">{t(locale, 'nav_audiobooks')}</Link>
          <Link href={socialHref as any} className="hover:text-brand">{t(locale, 'nav_social')}</Link>
          <Link href={`/${locale}/profile` as any} className="hover:text-brand">{t(locale, 'nav_profile')}</Link>
          <Link href={cartHref as any} className="hover:text-brand inline-flex items-center gap-1">
            <FiShoppingCart /> {t(locale, 'nav_cart')} <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-brand">{count}</span>
          </Link>
          <NotificationsBtn />
          <LangDropdown current={locale} />
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-200 px-2 py-1 text-xs hover:border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-600 dark:text-neutral-100"
          >
            {theme === 'dark' ? <FiMoon /> : <FiSun />} {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </nav>
      </div>
    </header>
  )
}

export function MobileNav() {
  const { count } = useCart()
  const locale = useLocale()
  const pathname = usePathname()
  const home = `/${locale}`
  const audiobooks = `/${locale}/audiobooks`
  const social = `/${locale}/social`
  const profile = `/${locale}/profile`
  const cart = `/${locale}/cart`
  const isActive = (href: string) => href === home ? pathname === home : pathname.startsWith(href)
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="container-max">
        <ul className="grid grid-cols-5 h-16 text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-200">
          <li className="flex items-center justify-center">
            <Link href={home as any} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-md ${isActive(home) ? 'text-brand' : ''}`} aria-current={isActive(home) ? 'page' : undefined}>
              <FiHome className="text-[22px]" />
              <span>{t(locale, 'nav_home')}</span>
            </Link>
          </li>
          <li className="flex items-center justify-center">
            <Link href={audiobooks as any} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-md ${isActive(audiobooks) ? 'text-brand' : ''}`} aria-current={isActive(audiobooks) ? 'page' : undefined}>
              <FiHeadphones className="text-[22px]" />
              <span>{t(locale, 'nav_audiobooks')}</span>
            </Link>
          </li>
          <li className="flex items-center justify-center">
            <Link href={social as any} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-md ${isActive(social) ? 'text-brand' : ''}`} aria-current={isActive(social) ? 'page' : undefined}>
              <FiMessageCircle className="text-[22px]" />
              <span>{t(locale, 'nav_social')}</span>
            </Link>
          </li>
          <li className="flex items-center justify-center">
            <Link href={profile as any} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-md ${isActive(profile) ? 'text-brand' : ''}`} aria-current={isActive(profile) ? 'page' : undefined}>
              <FiUser className="text-[22px]" />
              <span>{t(locale, 'nav_profile')}</span>
            </Link>
          </li>
          <li className="flex items-center justify-center">
            <Link href={cart as any} className={`relative flex flex-col items-center gap-1 py-2 px-3 rounded-md ${isActive(cart) ? 'text-brand' : ''}`} aria-current={isActive(cart) ? 'page' : undefined}>
              <FiShoppingCart className="text-[22px]" />
              <span>{t(locale, 'nav_cart')}</span>
              {count > 0 && (
                <span className="absolute -top-1.5 left-1/2 translate-x-2 rounded-full bg-brand text-white text-[10px] px-1">
                  {count}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

function LangDropdown({ current }: { current: 'en' | 'az' }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement | null>(null)
  const toggleOpen = () => setOpen(o => !o)
  const options: Array<{ code: 'en' | 'az'; label: string }> = [
    { code: 'en', label: 'English' },
    { code: 'az', label: 'Azərbaycan dili' },
  ]
  const currentLabel = options.find(o => o.code === current)?.label ?? current.toUpperCase()
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        className="inline-flex items-center gap-2 rounded-md border border-neutral-200 px-2 py-1 text-xs hover:border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:hover:border-neutral-600 dark:text-neutral-100"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <FiGlobe /> {currentLabel}
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 mt-2 w-44 rounded-md border border-neutral-200 bg-white shadow-soft dark:border-neutral-700 dark:bg-neutral-900">
          {options.map(opt => {
            const active = opt.code === current
            // Replace the first segment of the path with the new locale
            const segments = pathname.split('/')
            segments[1] = opt.code
            const href = segments.join('/') || `/${opt.code}`
            
            return (
              <li key={opt.code} role="option" aria-selected={active}>
                <button
                  onClick={() => {
                    setOpen(false)
                    window.history.pushState({}, '', href)
                    window.location.reload()
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 ${active ? 'text-brand' : 'text-neutral-700 dark:text-neutral-100'}`}
                >
                  <span className="inline-flex items-center gap-2">{opt.label}</span>
                  {active && <span className="h-2 w-2 rounded-full bg-brand" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function MobileHeader() {
  const locale = useLocale()
  const { theme, toggle } = useTheme()
  
  return (
    <header className="lg:hidden sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="container-max h-14 flex items-center justify-between">
        <Link href={`/${locale}` as any} className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-brand" />
          <span className="font-semibold text-base">Bitig</span>
        </Link>
        <div className="flex items-center gap-3">
          <NotificationsBtn />
          <LangDropdown current={locale} />
          <button
            onClick={toggle}
            className="p-2 text-neutral-700 dark:text-neutral-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}
