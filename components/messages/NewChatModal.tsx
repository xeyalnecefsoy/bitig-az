'use client'

import { useState } from 'react'
import { FiX, FiSearch, FiUser } from 'react-icons/fi'
import { searchUsers, startConversation } from '@/app/actions/messages'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'

export function NewChatModal({ 
  isOpen, 
  onClose,
  onConversationStarted
}: { 
  isOpen: boolean, 
  onClose: () => void,
  onConversationStarted: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const locale = useLocale()

  if (!isOpen) return null

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    
    if (val.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      // Debounce could be added here, but for now direct call
      const users = await searchUsers(val)
      setResults(users || [])
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (userId: string) => {
    if (starting) return
    setStarting(true)
    try {
      const res = await startConversation(userId)
      if (res.id) {
        onConversationStarted(res.id)
        onClose()
      }
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="font-bold text-lg dark:text-white">{t(locale as Locale, 'dm_new_chat')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder={t(locale as Locale, 'dm_search_users')}
              value={query}
              onChange={handleSearch}
              className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 ring-brand dark:text-white"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="p-4 text-center text-neutral-500">{t(locale as Locale, 'loading')}</div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleStart(user.id)}
                  disabled={starting}
                  className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors text-left"
                >
                  <img 
                    src={user.avatar_url || `/api/avatar?name=${encodeURIComponent(user.username || user.full_name || user.id)}`} 
                    alt={user.username} 
                    className="w-10 h-10 rounded-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="font-semibold dark:text-white">{user.full_name || user.username}</div>
                    <div className="text-xs text-neutral-500">@{user.username}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-neutral-500">{t(locale as Locale, 'no_results')}</div>
          ) : (
            <div className="p-4 text-center text-neutral-400 text-sm">
              {t(locale as Locale, 'dm_search_help')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
