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
    // Optimized smaller images with better compression
    img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=225&fit=crop&q=60&auto=format',
    imgLarge: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop&q=70&auto=format',
    blurDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDBAURAAYSIRMxQWH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABsRAAICAwEAAAAAAAAAAAAAAAECAAMEESEx/9oADAMBEQCEEAL/AK7O12Y0',
  },
  {
    id: 'discover',
    title: t(locale, 'hero_slide2_title'),
    subtitle: t(locale, 'hero_slide2_subtitle'),
    img: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=225&fit=crop&q=60&auto=format',
    imgLarge: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=450&fit=crop&q=70&auto=format',
    blurDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDBAURAAYSIRMxQWH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABsRAAICAwEAAAAAAAAAAAAAAAECAAMEESEx/9oADAMBEQCEEAL/AK7O12Y0',
  },
  {
    id: 'listen',
    title: t(locale, 'hero_slide3_title'),
    subtitle: t(locale, 'hero_slide3_subtitle'),
    img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=225&fit=crop&q=60&auto=format',
    imgLarge: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=450&fit=crop&q=70&auto=format',
    blurDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDBAURAAYSIRMxQWH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABsRAAICAwEAAAAAAAAAAAAAAAECAAMEESEx/9oADAMBEQCEEAL/AK7O12Y0',
  },
]

export function HeroCarousel() {
  const pathname = usePathname()
  const locale = (pathname?.split('/')[1] || 'en') as Locale
  const slides = useMemo(() => getSlides(locale), [locale])
  const [index, setIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const count = slides.length
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count)
  const current = useMemo(() => slides[index], [index, slides])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count])

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-neutral-100 dark:border-neutral-800 shadow-2xl group">
      <div className="relative w-full aspect-video">
        <Image 
          src={isMobile ? current.img : (current.imgLarge || current.img)}
          alt={current.title} 
          fill 
          priority 
          fetchPriority="high"
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          placeholder="blur"
          blurDataURL={current.blurDataUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-12">
          <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 sm:mb-3 drop-shadow-md">
            {current.title}
          </h2>
          <p className="text-white/80 text-sm sm:text-base lg:text-lg max-w-2xl drop-shadow">
            {current.subtitle}
          </p>
        </div>
      </div>
      {/* Navigation Arrows */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          aria-label="Prev" 
          onClick={() => go(-1)} 
          className="grid place-items-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all"
        >
          <FiChevronLeft size={24} className="ml-[-2px]" />
        </button>
        <button 
          aria-label="Next" 
          onClick={() => go(1)} 
          className="grid place-items-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all"
        >
          <FiChevronRight size={24} className="mr-[-2px]" />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute inset-x-0 bottom-6 sm:bottom-8 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-brand' : 'w-2 bg-white/40 hover:bg-white/60'}`} 
          />
        ))}
      </div>
    </div>
  )
}
