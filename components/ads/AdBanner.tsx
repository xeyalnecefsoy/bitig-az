"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ad {
  id: string
  name: string
  company: string
  banner_url: string
  link_url: string
  placement: string
}

export function AdBanner({ 
  placement, 
  className = '' 
}: { 
  placement: string
  className?: string 
}) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
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
        // Track impression
        await supabase.rpc('increment_impressions', { ad_id: data.id })
      }
    } catch (err) {
      // No ad available, silently fail
    } finally {
      setLoading(false)
    }
  }

  async function trackClick() {
    if (ad) {
      await supabase.rpc('increment_clicks', { ad_id: ad.id })
    }
  }

  if (loading || !ad) return null

  return (
    <div className={`ad-banner ${className}`}>
      <div className="text-xs text-neutral-400 dark:text-neutral-500 mb-2 text-center uppercase tracking-wide">
        Sponsored
      </div>
      <a 
        href={ad.link_url} 
        target="_blank" 
        rel="noopener noreferrer sponsored"
        onClick={trackClick}
        className="block rounded-xl overflow-hidden hover:opacity-95 transition-opacity"
      >
        <div className="relative w-full bg-neutral-100 dark:bg-neutral-800" style={{ paddingBottom: '16.67%' }}>
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-700" />
          )}
          <img
            src={ad.banner_url}
            alt={`${ad.company} - ${ad.name}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </a>
    </div>
  )
}
