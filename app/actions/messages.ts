'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Step 1: Get conversation IDs I'm part of
  const { data: myParticipations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (partError) {
    console.error('Error fetching my participations:', JSON.stringify(partError, null, 2))
    return []
  }

  if (!myParticipations || myParticipations.length === 0) {
    return [] // No conversations yet
  }

  const conversationIds = myParticipations.map(p => p.conversation_id)

  // Step 2: Get conversations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false })

  if (convError) {
    console.error('Error fetching conversations:', JSON.stringify(convError, null, 2))
    return []
  }

  // Step 3: Get other participants for each conversation
  const result = await Promise.all(
    (conversations || []).map(async (convo) => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles:user_id(id, username, full_name, avatar_url)')
        .eq('conversation_id', convo.id)
        .neq('user_id', user.id)
        .limit(1)
        .single()

      return {
        ...convo,
        otherUser: participants?.profiles || null
      }
    })
  )

  return result
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data
}

export async function sendMessage(conversationId: string, content: string | null, type: 'text' | 'book_share' | 'post_share' = 'text', entityId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Insert message
  const { error: msgError } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: type,
      entity_id: entityId
    })

  if (msgError) return { error: msgError.message }

  // Update conversation updated_at and last_message
  const lastMessagePreview = type === 'text' ? content : (type === 'book_share' ? 'Shared a book' : 'Shared a post')
  
  await supabase
    .from('conversations')
    .update({ 
      updated_at: new Date().toISOString(),
      last_message: lastMessagePreview
    })
    .eq('id', conversationId)

  revalidatePath('/messages')
  return { success: true }
}

export async function startConversation(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Call the secure database function
  const { data: conversationId, error } = await supabase
    .rpc('start_direct_conversation', { other_user_id: targetUserId })

  if (error) {
    console.error('Error starting conversation:', error)
    return { error: error.message }
  }

  revalidatePath('/messages')
  return { id: conversationId }
}

// Get or create a conversation with a specific user
export async function getConversationByUserId(otherUserId: string) {
  console.log('getConversationByUserId: starting with otherUserId:', otherUserId)
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('getConversationByUserId: No user authenticated')
    return null
  }

  console.log('getConversationByUserId: authenticated user:', user.id)

  // First, try to find existing conversation using the RPC
  const { data: conversationId, error } = await supabase
    .rpc('start_direct_conversation', { other_user_id: otherUserId })

  console.log('getConversationByUserId: RPC result - conversationId:', conversationId, 'error:', error)

  if (error) {
    console.error('Error getting/creating conversation:', JSON.stringify(error, null, 2))
    return null
  }

  if (!conversationId) {
    console.log('getConversationByUserId: RPC returned no conversationId')
    return null
  }

  // Get conversation details
  const { data: convo, error: convoError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  console.log('getConversationByUserId: convo fetch result:', convo, 'error:', convoError)

  if (!convo) return null

  // Get other user details
  const { data: otherUserData } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .eq('id', otherUserId)
    .single()

  console.log('getConversationByUserId: returning conversation with otherUser:', otherUserData?.username)

  return {
    ...convo,
    id: conversationId,
    otherUser: otherUserData
  }
}
