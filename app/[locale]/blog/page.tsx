import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n'
import { seoGuides } from '@/lib/seoGuides'

const BASE_URL = 'https://bitig.az'

const blogMeta = {
  az: {
    title: 'Bitig Blog - Məqalələr',
    description:
      'Səsli kitablar, Bitig platforması və dinləmə vərdişləri haqqında faydalı məqalə və yazılar.',
    keywords: [
      'bitig blog',
      'səsli kitab məqalə',
      'azərbaycanca audiokitab',
      'bitig nədir',
      'səsləndirmə',
    ],
  },
  en: {
    title: 'Bitig Blog - Articles',
    description:
      'Read articles about audiobooks, Bitig, and listening habits in Azerbaijani and English.',
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
      'Səsli kitablar və mütaliə mədəniyyəti haqqında faydalı yazılar. Oxuyun, daha sonra dinləməyə keçin.',
    readingTime: 'dəq oxu',
    ctaTitle: 'Dinləməyə keçin',
    ctaDescription: 'Oxumağı bitirdinizsə, dərhal kitab kəşf etmək üçün hesaba daxil olun:',
    audiobooksCta: 'Səsli kitabları kəşf et',
    loginCta: 'Daxil ol',
  },
  en: {
    heading: 'Bitig Blog',
    subheading:
      'Interesting articles on audiobooks and listening culture. Read first, then jump right into Bitig.',
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {seoGuides.map((guide) => (
          <Link
            href={`/${locale}/blog/${guide.slug}` as any}
            key={guide.slug}
            className="group flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative w-full aspect-[16/10] bg-neutral-100 dark:bg-neutral-800 overflow-hidden border-b border-neutral-100 dark:border-neutral-800">
              <Image
                src={guide.image}
                alt={guide.title[locale]}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mb-3 font-medium">
                <span>{guide.readingMinutes} {copy.readingTime}</span>
              </div>
              <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-brand transition-colors leading-tight">
                {guide.title[locale]}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-5 line-clamp-3 leading-relaxed flex-1">
                {guide.excerpt[locale]}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                {guide.keywords[locale].slice(0, 3).map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-brand/5 border border-brand/10 px-2.5 py-1 text-xs text-brand font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </Link>
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
