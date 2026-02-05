'use client'

import { useState, useMemo } from 'react'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'

export function MessagesLayout({ 
  initialConversations,
  initialSelectedId 
}: { 
  initialConversations: any[],
  initialSelectedId?: string 
}) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialSelectedId || null)
  const locale = useLocale()
  
  // Use initialConversations directly (they come fresh from server on each navigation)
  const conversations = initialConversations
  
  // Find selected conversation from the list
  const selectedConversation = useMemo(() => {
    const id = selectedConversationId || initialSelectedId
    return conversations.find(c => c.id === id) || null
  }, [conversations, selectedConversationId, initialSelectedId])

  // Auto-select if we have initialSelectedId but no current selection
  const effectiveSelectedId = selectedConversationId || initialSelectedId || null

  console.log('MessagesLayout render:', { 
    conversationsCount: conversations.length, 
    effectiveSelectedId,
    selectedConversation: selectedConversation ? {
      id: selectedConversation.id,
      otherUser: selectedConversation.otherUser?.username
    } : null
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full max-h-full overflow-hidden">
      <div className={`${effectiveSelectedId ? 'hidden md:flex' : 'flex'} flex-col h-full max-h-full border rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800`}>
        <ConversationList 
          conversations={conversations} 
          selectedId={effectiveSelectedId}
          onSelect={setSelectedConversationId} 
        />
      </div>
      <div className={`${!effectiveSelectedId ? 'hidden md:flex' : 'flex'} flex-col md:col-span-2 h-full max-h-full border rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800`}>
        {effectiveSelectedId && selectedConversation ? (
          <ChatWindow 
            conversationId={effectiveSelectedId} 
            conversation={selectedConversation}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-500">
            {t(locale as Locale, 'dm_select_conversation')}
          </div>
        )}
      </div>
    </div>
  )
}
