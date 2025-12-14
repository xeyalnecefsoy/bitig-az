import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://bitig.az'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Static pages for both locales
  const locales = ['en', 'az']
  const staticPages = [
    '',           // Home page
    '/audiobooks',
    '/social',
    '/cart',
    '/login',
    '/contact',
    '/terms',
    '/privacy',
    '/refund',
  ]

  // Generate static page entries for all locales
  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' : 'weekly' as const,
      priority: page === '' ? 1.0 : 0.8,
    }))
  )

  // Fetch all books from Supabase for dynamic pages
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, updated_at')

  const bookEntries: MetadataRoute.Sitemap = []
  
  if (!booksError && books) {
    for (const book of books) {
      for (const locale of locales) {
        bookEntries.push({
          url: `${BASE_URL}/${locale}/audiobooks/${book.id}`,
          lastModified: book.updated_at ? new Date(book.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  }

  // Fetch all public posts from Supabase for social pages
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(100) // Limit to most recent 100 posts for sitemap

  const postEntries: MetadataRoute.Sitemap = []

  if (!postsError && posts) {
    for (const post of posts) {
      for (const locale of locales) {
        postEntries.push({
          url: `${BASE_URL}/${locale}/social/post/${post.id}`,
          lastModified: post.created_at ? new Date(post.created_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    }
  }

  // Combine all entries
  return [...staticEntries, ...bookEntries, ...postEntries]
}
