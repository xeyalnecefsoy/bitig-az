"use client"
import { createClient } from '@/lib/supabase/client'
import { redirect, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { FiHome, FiBook, FiUsers, FiPieChart, FiMenu, FiX, FiMessageCircle, FiLogOut, FiDollarSign } from 'react-icons/fi'
import { ThemeProvider } from '@/context/theme'
import { t, type Locale } from '@/lib/i18n'
import { useState, useEffect } from 'react'
import { useAudio } from '@/context/audio'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { close: closeAudio } = useAudio()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [locale, setLocale] = useState<Locale>('en')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loc = pathname.split('/')[1] as Locale
    setLocale(loc || 'en')
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/${locale}/login`)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'coadmin')) {
      router.push(`/${locale}`)
      return
    }

    setIsAuthorized(true)
  }

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
    </div>
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white transition-colors"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <span className="font-bold text-lg text-neutral-900 dark:text-white">{t(locale, 'admin_title')}</span>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex pt-14 lg:pt-0">
          {/* Sidebar */}
          <aside className={`
            fixed lg:static top-14 lg:top-0 bottom-0 left-0 z-50
            w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800
            flex-shrink-0 flex flex-col
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Desktop Header */}
            <div className="hidden lg:flex h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800">
              <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">{t(locale, 'admin_title')}</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <NavLink 
                href={`/${locale}/admin`} 
                icon={<FiPieChart />} 
                label={t(locale, 'admin_dashboard')}
                onClick={() => setSidebarOpen(false)}
              />
              <NavLink 
                href={`/${locale}/admin/books`} 
                icon={<FiBook />} 
                label={t(locale, 'admin_audiobooks')}
                onClick={() => setSidebarOpen(false)}
              />
              <NavLink 
                href={`/${locale}/admin/users`} 
                icon={<FiUsers />} 
                label={t(locale, 'admin_users')}
                onClick={() => setSidebarOpen(false)}
              />
              <NavLink 
                href={`/${locale}/admin/sponsors`} 
                icon={<FiDollarSign />} 
                label="Sponsors"
                onClick={() => setSidebarOpen(false)}
              />
              <NavLink 
                href={`/${locale}/admin/social`} 
                icon={<FiMessageCircle />} 
                label={t(locale, 'admin_social')}
                onClick={() => setSidebarOpen(false)}
              />
              <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
                 <button
                   onClick={async () => {
                     closeAudio() // Stop audio playback
                     await supabase.auth.signOut()
                     router.push(`/${locale}`)
                     router.refresh()
                   }}
                   className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full"
                 >
                   <span className="text-lg"><FiLogOut /></span>
                   Logout
                 </button>
                 <NavLink 
                   href={`/${locale}`} 
                   icon={<FiHome />} 
                   label={t(locale, 'admin_back_to_site')}
                   onClick={() => setSidebarOpen(false)}
                 />
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

function NavLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  const pathname = usePathname()
  // Only highlight if it's an exact match
  const isActive = pathname === href
  
  return (
    <Link 
      href={href as any}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive 
          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold' 
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  )
}
