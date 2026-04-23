import { getConversations, getConversationByUsername } from '@/app/actions/messages'
import { MessagesLayout } from '@/components/messages/MessagesLayout'

export default async function MessagesByUsernamePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>
}) {
  const { username } = await params

  let conversations = await getConversations()
  const directConversation = await getConversationByUsername(username)

  let selectedConversationId: string | undefined = undefined
  if (directConversation?.id) {
    selectedConversationId = directConversation.id
    const existingIndex = conversations.findIndex((c: any) => c.id === directConversation.id)
    if (existingIndex >= 0) {
      conversations[existingIndex] = directConversation
    } else {
      conversations = [directConversation, ...conversations]
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-4 h-[calc(100dvh-140px)] max-h-[calc(100dvh-140px)] overflow-hidden">
      <MessagesLayout initialConversations={conversations} initialSelectedId={selectedConversationId} />
    </div>
  )
}

