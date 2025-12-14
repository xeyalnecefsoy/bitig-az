import Link from 'next/link'
import type { Book } from '@/lib/data'
import { BookCard } from '@/components/BookCard'
import { HeroCarousel } from '@/components/HeroCarousel'
import { t, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { AdBanner } from '@/components/ads/AdBanner'
import { FiMessageCircle, FiUsers, FiBookOpen, FiArrowRight } from 'react-icons/fi'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  
  // Fetch books from database
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('rating', { ascending: false })
    .limit(6)
  
  return (
    <div>
      <section className="bg-gradient-to-b from-brand/10 to-transparent">
        <div className="container-max py-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
                {t(locale as Locale, 'home_headline')}
              </h1>
              <div className="flex gap-3">
                <Link href={`/${locale}/audiobooks` as any} className="btn btn-primary py-2 text-sm sm:text-base">{t(locale as Locale, 'cta_browse')}</Link>
                <Link href={`/${locale}#featured` as any} className="btn btn-outline py-2 text-sm sm:text-base">{t(locale as Locale, 'cta_featured')}</Link>
              </div>
            </div>
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* Sponsor Banner */}
      <AdBanner placement="homepage" className="container-max my-8" />

      <section id="featured" className="container-max py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-semibold">{t(locale as Locale, 'featured_picks')}</h2>
          <Link href={`/${locale}/audiobooks` as any} className="text-brand hover:underline">{t(locale as Locale, 'see_all')}</Link>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {books?.map((b: Book) => (
            <BookCard key={b.id} book={b} locale={locale} />
          ))}
        </div>
      </section>

      {/* Social Community Banner */}
      <section className="container-max py-12">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand/20 blur-[100px]" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px]" />
          
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider mb-4">
                <FiUsers size={14} />
                <span>Bitig Social</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {t(locale as Locale, 'social_banner_title')}
              </h2>
              <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
                {t(locale as Locale, 'social_banner_desc')}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <Link 
                  href={`/${locale}/social` as any} 
                  className="btn btn-primary px-8 py-3.5 text-base rounded-full shadow-lg shadow-brand/20 group hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    {t(locale as Locale, 'social_banner_cta')}
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Feature Grid - Right Side */}
            <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-colors duration-300">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
                  <FiMessageCircle size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{t(locale as Locale, 'social_feature_discuss')}</h3>
                  <p className="text-sm text-neutral-400">{t(locale as Locale, 'social_feature_discuss_desc')}</p>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-colors duration-300">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20 text-green-400">
                  <FiBookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{t(locale as Locale, 'social_feature_discover')}</h3>
                  <p className="text-sm text-neutral-400">{t(locale as Locale, 'social_feature_discover_desc')}</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-colors duration-300 sm:col-span-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400">
                  <FiUsers size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{t(locale as Locale, 'social_feature_connect')}</h3>
                  <p className="text-sm text-neutral-400">{t(locale as Locale, 'social_feature_connect_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

