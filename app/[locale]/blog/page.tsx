import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n'
import { seoGuides } from '@/lib/seoGuides'

const BASE_URL = 'https://bitig.az'

const blogMeta = {
  az: {
    title: 'Bitig Blog - Səsli kitab bələdçiləri',
    description:
      'Səsli kitablar, Bitig platforması və dinləmə vərdişləri haqqında azərbaycanca və ingiliscə faydalı bələdçilər.',
    keywords: [
      'bitig blog',
      'səsli kitab bələdçi',
      'azərbaycanca audiokitab',
      'bitig nədir',
      'səsləndirmə',
    ],
  },
  en: {
    title: 'Bitig Blog - Audiobook guides',
    description:
      'Read practical guides about audiobooks, Bitig, and listening habits in Azerbaijani and English.',
    keywords: [
      'bitig blog',
      'audiobook guide',
      'azerbaijani audiobooks',
      'what is bitig',
      'audiobook narration',
    ],
  },
} satisfies Record<Locale, { title: string; description: string; keywords: string[] }>

const blogCopy = {
  az: {
    heading: 'Bitig Blog',
    subheading:
      'Səsli kitablar və dinləmə mədəniyyəti haqqında praktik bələdçilər. Oxuyun, sonra Bitig-də dinləməyə başlayın.',
    readingTime: 'dəq oxu',
    ctaTitle: 'Dinləməyə keçin',
    ctaDescription: 'Bələdçidən sonra dərhal kitab kəşf etmək və hesabınıza daxil olmaq üçün keçidlər:',
    audiobooksCta: 'Səsli kitabları kəşf et',
    loginCta: 'Daxil ol',
  },
  en: {
    heading: 'Bitig Blog',
    subheading:
      'Practical guides on audiobooks and listening culture. Read first, then jump into Bitig.',
    readingTime: 'min read',
    ctaTitle: 'Start listening now',
    ctaDescription: 'After reading a guide, use these links to discover books or sign in:',
    audiobooksCta: 'Explore audiobooks',
    loginCta: 'Sign in',
  },
} satisfies Record<Locale, Record<string, string>>

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) {
    return {}
  }

  const meta = blogMeta[locale]

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog`,
      languages: {
        az: `${BASE_URL}/az/blog`,
        en: `${BASE_URL}/en/blog`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE_URL}/${locale}/blog`,
      siteName: 'Bitig',
      locale: locale === 'az' ? 'az_AZ' : 'en_US',
      type: 'website',
      images: [{ url: `${BASE_URL}/og.png`, width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${BASE_URL}/og.png`],
    },
  }
}

export default async function BlogHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) {
    notFound()
  }

  const copy = blogCopy[locale]

  return (
    <section className="container-max py-10">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">{copy.heading}</h1>
        <p className="text-neutral-600 dark:text-neutral-300">{copy.subheading}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {seoGuides.map((guide) => (
          <article
            key={guide.slug}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5"
          >
            <h2 className="text-xl font-semibold mb-2">
              <Link href={`/${locale}/blog/${guide.slug}`} className="hover:text-brand transition-colors">
                {guide.title[locale]}
              </Link>
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">{guide.excerpt[locale]}</p>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              {guide.readingMinutes} {copy.readingTime}
            </div>
            <div className="flex flex-wrap gap-2">
              {guide.keywords[locale].slice(0, 4).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs text-neutral-700 dark:text-neutral-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-brand/20 bg-brand/5 p-6">
        <h3 className="text-lg font-semibold mb-2">{copy.ctaTitle}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">{copy.ctaDescription}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/audiobooks`} className="btn btn-primary">
            {copy.audiobooksCta}
          </Link>
          <Link href={`/${locale}/login`} className="btn btn-outline">
            {copy.loginCta}
          </Link>
        </div>
      </div>
    </section>
  )
}
