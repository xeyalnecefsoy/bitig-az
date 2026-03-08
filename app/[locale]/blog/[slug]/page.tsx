import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, locales, type Locale } from '@/lib/i18n'
import { getSeoGuideBySlug, seoGuides } from '@/lib/seoGuides'

const BASE_URL = 'https://bitig.az'

const articleCopy = {
  az: {
    backToBlog: 'Bloga qayıt',
    published: 'Yayımlanıb',
    updated: 'Yenilənib',
    readTime: 'dəq oxu',
    faqTitle: 'Tez-tez verilən suallar',
    ctaTitle: 'Növbəti addımı atın',
    ctaDescription: 'İndi səsli kitabları kəşf edin və ya şəxsi kitabxananızı idarə etmək üçün daxil olun.',
    audiobooksCta: 'Səsli kitabları kəşf et',
    loginCta: 'Daxil ol',
  },
  en: {
    backToBlog: 'Back to blog',
    published: 'Published',
    updated: 'Updated',
    readTime: 'min read',
    faqTitle: 'Frequently asked questions',
    ctaTitle: 'Take the next step',
    ctaDescription: 'Explore audiobooks now, or sign in to manage your personal library and listening flow.',
    audiobooksCta: 'Explore audiobooks',
    loginCta: 'Sign in',
  },
} satisfies Record<Locale, Record<string, string>>

type PageProps = {
  params: Promise<{ locale: string; slug: string }>
}

function formatDate(locale: Locale, value: string): string {
  return new Date(value).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateStaticParams() {
  return locales.flatMap((locale) => seoGuides.map((guide) => ({ locale, slug: guide.slug })))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const guide = getSeoGuideBySlug(slug)
  if (!guide) {
    return {}
  }

  const title = guide.title[locale]
  const description = guide.description[locale]
  const canonical = `${BASE_URL}/${locale}/blog/${guide.slug}`

  return {
    title,
    description,
    keywords: guide.keywords[locale],
    alternates: {
      canonical,
      languages: {
        az: `${BASE_URL}/az/blog/${guide.slug}`,
        en: `${BASE_URL}/en/blog/${guide.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Bitig',
      locale: locale === 'az' ? 'az_AZ' : 'en_US',
      type: 'article',
      publishedTime: new Date(guide.publishedAt).toISOString(),
      modifiedTime: new Date(guide.updatedAt).toISOString(),
      images: [{ url: `${BASE_URL}/og.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/og.png`],
    },
  }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const guide = getSeoGuideBySlug(slug)
  if (!guide) {
    notFound()
  }

  const copy = articleCopy[locale]
  const articleUrl = `${BASE_URL}/${locale}/blog/${guide.slug}`

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title[locale],
    description: guide.description[locale],
    inLanguage: locale,
    mainEntityOfPage: articleUrl,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Bitig',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bitig',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((item) => ({
      '@type': 'Question',
      name: item.question[locale],
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer[locale],
      },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'az' ? 'Ana səhifə' : 'Home',
        item: `${BASE_URL}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${BASE_URL}/${locale}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title[locale],
        item: articleUrl,
      },
    ],
  }

  return (
    <section className="container-max py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Link href={`/${locale}/blog`} className="inline-flex items-center text-sm text-brand hover:underline mb-6">
        {copy.backToBlog}
      </Link>

      <article className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{guide.title[locale]}</h1>
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">{guide.excerpt[locale]}</p>

        <div className="flex flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-8">
          <span>
            {copy.published}: {formatDate(locale, guide.publishedAt)}
          </span>
          <span>
            {copy.updated}: {formatDate(locale, guide.updatedAt)}
          </span>
          <span>
            {guide.readingMinutes} {copy.readTime}
          </span>
        </div>

        <div className="space-y-8">
          {guide.sections.map((section) => (
            <section key={section.heading[locale]}>
              <h2 className="text-2xl font-semibold mb-3">{section.heading[locale]}</h2>
              <div className="space-y-3 text-neutral-700 dark:text-neutral-200">
                {section.paragraphs[locale].map((paragraph, index) => (
                  <p key={`${section.heading[locale]}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <h2 className="text-2xl font-semibold mb-4">{copy.faqTitle}</h2>
          <div className="space-y-4">
            {guide.faq.map((item) => (
              <div key={item.question[locale]} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <h3 className="font-semibold mb-2">{item.question[locale]}</h3>
                <p className="text-neutral-600 dark:text-neutral-300">{item.answer[locale]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-brand/20 bg-brand/5 p-6">
          <h2 className="text-xl font-semibold mb-2">{copy.ctaTitle}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">{copy.ctaDescription}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}/audiobooks`} className="btn btn-primary">
              {copy.audiobooksCta}
            </Link>
            <Link href={`/${locale}/login`} className="btn btn-outline">
              {copy.loginCta}
            </Link>
          </div>
        </section>
      </article>
    </section>
  )
}
