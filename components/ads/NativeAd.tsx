"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiExternalLink } from 'react-icons/fi'

interface Ad {
  id: string
  name: string
  company: string
  banner_url: string
  link_url: string
}

export function NativeAd({ placement }: { placement: string }) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadAd()
  }, [placement])

  async function loadAd() {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('placement', placement)
        .eq('active', true)
        .order('position', { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        setAd(data)
        await supabase.rpc('increment_impressions', { ad_id: data.id })
      }
    } catch (err) {
      // No ad available
    }
  }

  async function trackClick() {
    if (ad) {
      await supabase.rpc('increment_clicks', { ad_id: ad.id })
    }
  }

  if (!ad) return null

  return (
    <div className="card bg-gradient-to-br from-brand/5 to-emerald-50 dark:from-brand/10 dark:to-neutral-900 border-2 border-brand/20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-brand uppercase tracking-wide">Sponsored</span>
          <FiExternalLink className="text-neutral-400" size={14} />
        </div>
        <a
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={trackClick}
          className="block group"
        >
          <div className="relative aspect-video overflow-hidden rounded-lg mb-3 bg-neutral-100 dark:bg-neutral-800">
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-700" />
            )}
            <img
              src={ad.banner_url}
              alt={ad.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h3 className="font-semibold text-sm mb-1 text-neutral-900 dark:text-white group-hover:text-brand transition-colors line-clamp-1">
            {ad.name}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">{ad.company}</p>
        </a>
      </div>
    </div>
  )
}
