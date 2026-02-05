'use client'

import { useEffect, useState, useRef } from 'react'
import { getMessages, sendMessage } from '@/app/actions/messages'
import { FiSend, FiArrowLeft } from 'react-icons/fi'
import { useSocial } from '@/context/social'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'
import Link from 'next/link'

// Simple avatar with initials fallback
function UserAvatar({ user, size = 40 }: { user: any, size?: number }) {
  const [imgError, setImgError] = useState(false)
  
  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  if (!user?.avatar_url || imgError) {
    return (
      <div 
        className="flex items-center justify-center rounded-full bg-brand/20 text-brand font-bold"
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
      className="rounded-full object-cover bg-neutral-200"
      style={{ width: size, height: size }}
    />
  )
}

export function ChatWindow({ conversationId, conversation, onBack }: { 
  conversationId: string, 
  conversation: any,
  onBack: () => void
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const { currentUser } = useSocial()
  const scrollRef = useRef<HTMLDivElement>(null)
  const locale = useLocale()

  const otherUser = conversation?.otherUser

  useEffect(() => {
    loadMessages()
    // Reduced polling interval to 15 seconds
    const interval = setInterval(loadMessages, 15000)
    return () => clearInterval(interval)
  }, [conversationId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function loadMessages() {
    const msgs = await getMessages(conversationId)
    setMessages(msgs || [])
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!inputText.trim() || sending) return

    const tempId = Date.now().toString()
    const optimisticMsg = {
      id: tempId,
      content: inputText,
      sender_id: currentUser?.id,
      created_at: new Date().toISOString(),
      message_type: 'text'
    }

    setMessages(prev => [...prev, optimisticMsg])
    setInputText('')
    setSending(true)

    await sendMessage(conversationId, optimisticMsg.content)
    await loadMessages()
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-neutral-600 dark:text-neutral-400">
          <FiArrowLeft size={20} />
        </button>
        <Link 
          href={`/${locale}/social/profile/${otherUser?.username || otherUser?.id}`} 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <UserAvatar user={otherUser} size={44} />
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">
              {otherUser?.full_name || otherUser?.username || 'İstifadəçi'}
            </h3>
            {otherUser?.username && (
              <span className="text-xs text-neutral-500">
                @{otherUser.username}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-black/20">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-neutral-400">
            {t(locale as Locale, 'dm_start_chatting')}
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-brand text-white rounded-br-sm' 
                    : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-sm border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {msg.message_type === 'text' && <p className="break-words">{msg.content}</p>}
                {msg.message_type === 'book_share' && (
                   <div className="flex flex-col">
                      <span className="text-xs opacity-70 mb-1">{t(locale as Locale, 'dm_shared_book')}</span>
                      <Link href={`/${locale}/book/${msg.entity_id}`} className="font-bold underline">
                        {t(locale as Locale, 'view_all')}
                      </Link>
                   </div>
                )}
                <span className={`text-[10px] mt-1 block opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex gap-3 bg-white dark:bg-neutral-900 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t(locale as Locale, 'dm_type_message')}
          className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-3 outline-none focus:ring-2 ring-brand dark:text-white text-sm"
        />
        <button 
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-11 h-11 flex items-center justify-center bg-brand text-white rounded-full disabled:opacity-50 hover:bg-brand/90 transition-colors shrink-0"
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  )
}
