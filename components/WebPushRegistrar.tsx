"use client"

import { useEffect } from 'react'
import { saveWebPushSubscription } from '@/app/actions/pushChannels'

function b64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function WebPushRegistrar() {
  useEffect(() => {
    let cancelled = false

    async function run() {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) return

      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.register('/sw.js')
        const existing = await registration.pushManager.getSubscription()
        const subscription =
          existing ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: b64ToUint8Array(vapidPublicKey),
          }))

        if (cancelled || !subscription) return
        const json = subscription.toJSON()
        await saveWebPushSubscription({
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh || '',
          auth: json.keys?.auth || '',
        })
      } catch {
        // noop
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}

