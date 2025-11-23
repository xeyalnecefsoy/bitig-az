"use client"
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const slides = [
  {
    id: 'curated',
    title: 'Curated stories, immersive narration',
    img: 'https://picsum.photos/seed/bitig-1/1600/900',
  },
  {
    id: 'discover',
    title: 'Discover your next favorite audiobook',
    img: 'https://picsum.photos/seed/bitig-2/1600/900',
  },
  {
    id: 'listen',
    title: 'Listen anywhere, anytime',
    img: 'https://picsum.photos/seed/bitig-3/1600/900',
  },
]

export function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const count = slides.length
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count)
  const current = useMemo(() => slides[index], [index])

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-100">
      <div className="relative h-56 sm:h-64 md:h-72 lg:h-80">
        <Image src={current.img} alt={current.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/0" />
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 lg:bottom-6 lg:left-6">
          <span className="badge mb-2">Bitig</span>
          <h2 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold drop-shadow">
            {current.title}
          </h2>
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
