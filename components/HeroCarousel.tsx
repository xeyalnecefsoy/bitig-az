"use client"
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'

const getSlides = (locale: Locale) => [
  {
    id: 'curated',
    title: t(locale, 'hero_slide1_title'),
    subtitle: t(locale, 'hero_slide1_subtitle'),
    img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&h=900&fit=crop&q=80', // Books on shelf
  },
  {
    id: 'discover',
    title: t(locale, 'hero_slide2_title'),
    subtitle: t(locale, 'hero_slide2_subtitle'),
    img: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=1600&h=900&fit=crop&q=80', // Headphones and books
  },
  {
    id: 'listen',
    title: t(locale, 'hero_slide3_title'),
    subtitle: t(locale, 'hero_slide3_subtitle'),
    img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&h=900&fit=crop&q=80', // Library/reading
  },
]

export function HeroCarousel() {
  const pathname = usePathname()
  const locale = (pathname?.split('/')[1] || 'en') as Locale
  const slides = useMemo(() => getSlides(locale), [locale])
  const [index, setIndex] = useState(0)
  const count = slides.length
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count)
  const current = useMemo(() => slides[index], [index, slides])

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-100">
      <div className="relative w-full aspect-video">
        <Image 
          src={current.img} 
          alt={current.title} 
          fill 
          priority 
          fetchPriority="high"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/0" />
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 lg:bottom-6 lg:left-6">
          <h2 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold drop-shadow mb-1">
            {current.title}
          </h2>
          <p className="text-white/90 text-sm sm:text-base drop-shadow">{current.subtitle}</p>
        </div>
      </div>
      <button aria-label="Prev" onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/90 text-neutral-800 hover:bg-white">
        <FiChevronLeft size={20} />
      </button>
      <button aria-label="Next" onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/90 text-neutral-800 hover:bg-white">
        <FiChevronRight size={20} />
      </button>
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {slides.map((s, i) => (
          <span key={s.id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-brand' : 'w-2 bg-white/70'}`} />
        ))}
      </div>
    </div>
  )
}
