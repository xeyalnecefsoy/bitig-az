import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { CartProvider } from '@/context/cart'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bitig — Audiobooks Reimagined',
  description: 'A modern, friendly storefront for audiobooks',
  metadataBase: new URL('https://bitig.example')
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
          <CartProvider>
            {children}
          </CartProvider>
      </body>
    </html>
  )
}
