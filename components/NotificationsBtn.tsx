"use client"
import { useState, useEffect, useRef } from 'react'
import { FiBell } from 'react-icons/fi'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Route } from 'next'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'
import { useSocial } from '@/context/social'

type Notification = {
  id: string
  type: 'like' | 'comment' | 'follow' | 'system'
  actor_id: string
  entity_id: string
  read: boolean
  created_at: string
  actor?: {
    username: string
    avatar_url: string
  }
}

export function NotificationsBtn() {
  const { notifications, unreadCount, markNotificationsAsRead } = useSocial()
  const [isOpen, setIsOpen] = useState(false)
  const locale = useLocale()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOpen = () => {
    if (!isOpen) {
      markNotificationsAsRead()
    }
    setIsOpen(!isOpen)
  }

  function getNotificationText(type: string) {
    switch (type) {
      case 'like': return t(locale as Locale, 'notif_liked')
      case 'comment': return t(locale as Locale, 'notif_commented')
      case 'follow': return t(locale as Locale, 'notif_followed')
      case 'system': return t(locale as Locale, 'notif_message')
      default: return t(locale as Locale, 'notif_interacted')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-full dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
        aria-label={t(locale as Locale, 'notifications')}
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-neutral-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-800 py-2 z-50">
          <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold">{t(locale as Locale, 'notifications')}</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500">
                {t(locale as Locale, 'no_notifications')}
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  href={getNotificationLink(n, locale) as Route}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${!n.read ? 'bg-brand/5 dark:bg-brand/10' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <img
                    src={n.actor?.avatar_url}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">
                      <span className="font-medium">{n.actor?.username || t(locale as Locale, 'someone')}</span>
                      {' '}
                      {getNotificationText(n.type)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getNotificationLink(n: Notification, locale: string) {
  switch (n.type) {
    case 'like':
    case 'comment':
      return `/${locale}/social/post/${n.entity_id}`
    case 'follow':
      return `/${locale}/social/profile/${n.actor?.username || n.actor_id}`
    default:
      return `/${locale}/social`
  }
}

