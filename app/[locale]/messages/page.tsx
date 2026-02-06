import { getConversations, getConversationByUserId } from '@/app/actions/messages'
import { MessagesLayout } from '@/components/messages/MessagesLayout'
import { Metadata } from 'next'

import { t, type Locale } from '@/lib/i18n'

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: `${t(locale as Locale, 'dm_title')} | Bitig`,
    description: t(locale as Locale, 'dm_search'),
  }
}

export default async function MessagesPage({ 
  searchParams,
  params
}: { 
  searchParams: Promise<{ id?: string, userId?: string }>,
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const sParams = await searchParams
  let conversations = await getConversations()
  
  // If userId is provided (from profile Message button), find or create the conversation
  let selectedConversationId = sParams.id
  
  if (sParams.userId) {
    const directConversation = await getConversationByUserId(sParams.userId)
    
    if (directConversation?.id) {
      selectedConversationId = directConversation.id
      
      // Replace or add the conversation with full otherUser data
      const existingIndex = conversations.findIndex((c: any) => c.id === directConversation.id)
      if (existingIndex >= 0) {
        // Replace existing with full data
        conversations[existingIndex] = directConversation
      } else {
        // Add new conversation at the beginning
        conversations = [directConversation, ...conversations]
      }
    }
  }

  return (
    <div className="container py-4 h-[calc(100dvh-140px)] max-h-[calc(100dvh-140px)] overflow-hidden">
      <MessagesLayout 
        initialConversations={conversations} 
        initialSelectedId={selectedConversationId}
      />
    </div>
  )
}
