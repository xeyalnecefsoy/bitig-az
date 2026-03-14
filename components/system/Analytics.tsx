"use client"

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type GtagFn = (...args: [command: string, ...params: unknown[]]) => void

declare global {
  interface Window {
    gtag?: GtagFn
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-1D0V1F9YP'

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasInitializedRouteTracking = useRef(false)
  const search = searchParams.toString()

  useEffect(() => {
    if (!hasInitializedRouteTracking.current) {
      hasInitializedRouteTracking.current = true
      return
    }

    if (!GA_MEASUREMENT_ID || !window.gtag) {
      return
    }

    const pagePath = search ? pathname + "?" + search : pathname

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
      send_to: GA_MEASUREMENT_ID,
    })
  }, [pathname, search])

  return null
}
