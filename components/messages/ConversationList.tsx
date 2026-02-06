'use client'

import { formatDistanceToNow } from 'date-fns'
import { az, enUS } from 'date-fns/locale'
import { FiSearch } from 'react-icons/fi'
import { useState } from 'react'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'

// Helper for date-fns locale
const getDateLocale = (locale: string) => {
  return locale === 'az' ? az : enUS
}

// Simple avatar with initials fallback
function UserAvatar({ user, size = 48 }: { user: any, size?: number }) {
  const [imgError, setImgError] = useState(false)
  
  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  if (!user?.avatar_url || imgError) {
    return (
      <div 
        className="flex items-center justify-center rounded-full bg-brand/20 text-brand font-bold shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {getInitials(user?.full_name || user?.username || '?')}
      </div>
    )
  }
  
  return (
    <img
      src={user.avatar_url}
      alt={user.full_name || user.username}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className="rounded-full object-cover bg-neutral-200 shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

export function ConversationList({ conversations, selectedId, onSelect }: { 
  conversations: any[], 
  selectedId: string | null,
  onSelect: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const locale = useLocale()

  const filtered = conversations.filter(c => 
    c.otherUser?.username?.toLowerCase().includes(search.toLowerCase()) || 
    c.otherUser?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{t(locale as Locale, 'dm_title')}</h2>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={t(locale as Locale, 'dm_search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 ring-brand dark:text-white"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            {t(locale as Locale, 'dm_no_conversations')}
          </div>
        ) : (
          filtered.map((convo) => (
            <button
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              className={`w-full text-left p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex gap-3 border-b border-neutral-100 dark:border-neutral-800 ${
                selectedId === convo.id ? 'bg-neutral-100 dark:bg-neutral-800' : ''
              }`}
            >
              <UserAvatar user={convo.otherUser} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col mb-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-neutral-900 dark:text-white truncate pr-2">
                      {convo.otherUser?.full_name || convo.otherUser?.username || 'İstifadəçi'}
                    </span>
                    <span className="text-[10px] text-neutral-500 shrink-0 whitespace-nowrap">
                      {formatDistanceToNow(new Date(convo.updated_at), { 
                        addSuffix: true,
                        locale: getDateLocale(locale)
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  {convo.last_message || t(locale as Locale, 'dm_start_chatting')}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
