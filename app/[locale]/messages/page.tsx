import { getConversations, getConversationByUserId } from '@/app/actions/messages'
import { MessagesLayout } from '@/components/messages/MessagesLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages | Bitig',
  description: 'Your conversations',
}

export default async function MessagesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ id?: string, userId?: string }> 
}) {
  const params = await searchParams
  let conversations = await getConversations()
  
  // If userId is provided (from profile Message button), find or create the conversation
  let selectedConversationId = params.id
  
  if (params.userId) {
    const directConversation = await getConversationByUserId(params.userId)
    
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
