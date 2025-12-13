import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',      // Admin pages should not be indexed
          '/api/',        // API routes
          '/auth/',       // Auth callbacks
          '/checkout/',   // Checkout pages (user-specific)
          '/cart/',       // Cart pages (user-specific)
          '/profile/',    // Private profile settings
        ],
      },
    ],
    sitemap: 'https://bitig.az/sitemap.xml',
  }
}
