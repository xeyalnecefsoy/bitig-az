'use client'

import { useState, useMemo, useEffect } from 'react'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { markConversationRead } from '@/app/actions/messages'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/auth'

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
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  
  // Use state for conversations to ensure persistence during optimistic updates
  const [conversations, setConversations] = useState(initialConversations)

  // Update conversations if initialConversations changes (e.g. new data from server reval)
  // BUT don't overwrite if we have more conversations in state (e.g. from optimistic adds)
  // Update conversations if initialConversations changes
  useEffect(() => {
    if (!initialConversations || initialConversations.length === 0) return

    const currentIds = new Set(conversations.map(c => c.id))
    const initialIds = initialConversations.map(c => c.id)

    // If selected conversation (from query) is missing, we must sync.
    const querySelectedId = initialSelectedId || null
    const selectedMissing = querySelectedId ? !currentIds.has(querySelectedId) : false

    // Otherwise, sync if there are any new ids that we don't have.
    const hasNewIds = initialIds.some(id => !currentIds.has(id))

    if (selectedMissing || hasNewIds) {
      setConversations(initialConversations)
    }
  }, [initialConversations, initialSelectedId])

  // Keep selection in sync with query params navigation.
  useEffect(() => {
    setSelectedConversationId(initialSelectedId || null)
  }, [initialSelectedId])
  
  // Find selected conversation from the list
  const selectedConversation = useMemo(() => {
    const id = selectedConversationId
    return conversations.find(c => c.id === id) || null
  }, [conversations, selectedConversationId])

  // Explicitly use state for current selection
  const effectiveSelectedId = selectedConversationId

  const handleSelect = (id: string) => {
    setSelectedConversationId(id)
    // router.replace(`/${locale}/messages?id=${id}`) // Temporarily disabled to prevent re-render loop
  }

  const handleBack = () => {
    setSelectedConversationId(null)
    // router.replace(`/${locale}/messages`) // Temporarily disabled to prevent re-render loop
  }

  useEffect(() => {
    if (!effectiveSelectedId) return
    markConversationRead(effectiveSelectedId).then(() => {
      setConversations(prev =>
        prev.map(c => c.id === effectiveSelectedId ? { ...c, unread_count: 0, has_unread: false } : c)
      )
    })
  }, [effectiveSelectedId])

  // Realtime: update conversation list when new DM arrives (preview + ordering) and keep unread badges live.
  useEffect(() => {
    const uid = user?.id
    if (!uid) return

    const channel = supabase
      .channel(`web-dm-inbox-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const msg = payload.new as any
          const convoId = msg?.conversation_id
          if (!convoId) return

          const preview = msg?.content != null ? String(msg.content) : ''
          const updatedAt = msg?.created_at || new Date().toISOString()

          setConversations(prev => {
            const idx = prev.findIndex(c => c.id === convoId)
            if (idx < 0) return prev

            const next = [...prev]
            const existing = next[idx]
            next[idx] = {
              ...existing,
              last_message: preview || existing.last_message,
              updated_at: updatedAt,
            }
            // Move to top
            const [moved] = next.splice(idx, 1)
            return [moved, ...next]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user?.id])

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
