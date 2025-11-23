"use client"
import { useState, useEffect, useRef } from 'react'
import { FiBell } from 'react-icons/fi'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useLocale } from '@/context/locale'

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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const locale = useLocale()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          // We should ideally check if it's for us, but RLS handles the fetch
          // However, for real-time we might get all events if we don't filter in channel?
          // Actually RLS doesn't filter realtime subscription events by default unless using "postgres_changes" with filter
          // But simpler to just refetch or append if we can verify user_id
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(username, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data as any)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  async function markAsRead() {
    if (unreadCount === 0) return

    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (ids.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', ids)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  const toggleOpen = () => {
    if (!isOpen) {
      markAsRead()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-full dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-neutral-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-800 py-2 z-50">
          <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  href={getNotificationLink(n, locale)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${!n.read ? 'bg-brand/5 dark:bg-brand/10' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <img
                    src={n.actor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.actor_id}`}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 dark:text-neutral-100">
                      <span className="font-medium">{n.actor?.username || 'Someone'}</span>
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

function getNotificationText(type: string) {
  switch (type) {
    case 'like': return 'liked your post'
    case 'comment': return 'commented on your post'
    case 'follow': return 'started following you'
    case 'system': return 'sent you a message'
    default: return 'interacted with you'
  }
}

function getNotificationLink(n: Notification, locale: string) {
  switch (n.type) {
    case 'like':
    case 'comment':
      return `/${locale}/social/post/${n.entity_id}`
    case 'follow':
      return `/${locale}/social/profile/${n.actor_id}`
    default:
      return `/${locale}/social`
  }
}
