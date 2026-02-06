'use client'

import { useState, useMemo } from 'react'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'

import { useRouter } from 'next/navigation'

export function MessagesLayout({ 
  initialConversations,
  initialSelectedId 
}: { 
  initialConversations: any[],
  initialSelectedId?: string 
}) {
  const router = useRouter()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialSelectedId || null)
  const locale = useLocale()
  
  // Use state for conversations to ensure persistence during optimistic updates
  const [conversations, setConversations] = useState(initialConversations)

  // Update conversations if initialConversations changes (e.g. new data from server reval)
  // BUT don't overwrite if we have more conversations in state (e.g. from optimistic adds)
  useMemo(() => {
    if (initialConversations.length > conversations.length) {
      setConversations(initialConversations)
    }
  }, [initialConversations])
  
  // Find selected conversation from the list
  const selectedConversation = useMemo(() => {
    const id = selectedConversationId
    return conversations.find(c => c.id === id) || null
  }, [conversations, selectedConversationId])

  // Explicitly use state for current selection
  const effectiveSelectedId = selectedConversationId

  const handleSelect = (id: string) => {
    setSelectedConversationId(id)
    router.replace(`/${locale}/messages?id=${id}`)
  }

  const handleBack = () => {
    setSelectedConversationId(null)
    router.replace(`/${locale}/messages`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full max-h-full overflow-hidden">
      <div className={`${effectiveSelectedId ? 'hidden md:flex' : 'flex'} flex-col h-full max-h-full border rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800`}>
        <ConversationList 
          conversations={conversations} 
          selectedId={effectiveSelectedId}
          onSelect={handleSelect} 
        />
      </div>
      <div className={`${!effectiveSelectedId ? 'hidden md:flex' : 'flex'} flex-col md:col-span-2 h-full max-h-full border rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800`}>
        {effectiveSelectedId && selectedConversation ? (
          <ChatWindow 
            conversationId={effectiveSelectedId} 
            conversation={selectedConversation}
            onBack={handleBack}
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
