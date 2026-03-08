'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getConversations() {
  console.log('[Action: getConversations] Starting...')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Step 1: Get conversation IDs I'm part of
  // Try fetching with status first (new schema)
  let myParticipations: any[] = []
  
  const { data: dataWithStatus, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, status')
    .eq('user_id', user.id)

  if (partError) {
    // If error implies column missing, try fetching without status (old schema fallback)
    console.warn('Error fetching status, falling back to basic fetch:', partError.message)
    const { data: dataBasic, error: basicError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)
    
    if (basicError) {
       console.error('Error fetching participations:', basicError)
       return []
    }
    // Default to 'accepted' if status is missing
    myParticipations = (dataBasic || []).map(p => ({ ...p, status: 'accepted' }))
  } else {
    myParticipations = dataWithStatus || []
  }

  if (!myParticipations || myParticipations.length === 0) {
    return [] // No conversations yet
  }

  const conversationMap = new Map(myParticipations.map(p => [p.conversation_id, p.status]))
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

  // Filter out conversations with no messages or placeholder text
  // The user reported "Started a conversation..." appearing, which suggests it might be saved in DB
  const validConversations = (conversations || []).filter(c => {
     if (!c.last_message) return false
     if (c.last_message.trim() === '') return false
     if (c.last_message.startsWith('Started a conversation')) return false // Filter out auto-generated start messages
     return true
  })

  // Step 3: Get other participants for these VALID conversations
  const validIds = validConversations.map(c => c.id)
  
  if (validIds.length === 0) return []

  const { data: otherParticipants, error: otherPartError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', validIds)
    .neq('user_id', user.id)

  if (otherPartError) {
    console.error('Error fetching other participants:', otherPartError)
  }

  // Map conversationId -> otherUserId
  const otherUserMap = new Map()
  const otherUserIds = new Set<string>()
  
  if (otherParticipants) {
    otherParticipants.forEach(p => {
      // For groups, this logic might need adjustment, but for DMs (limit 1 other) it's fine
      // If we already have one, skip (or handle groups later)
      if (!otherUserMap.has(p.conversation_id)) {
        otherUserMap.set(p.conversation_id, p.user_id)
        otherUserIds.add(p.user_id)
      }
    })
  }

  // Step 4: Fetch profiles for other users
  let profiles: any[] = []
  if (otherUserIds.size > 0) {
    // console.log('[Action: getConversations] Fetching profiles for IDs:', Array.from(otherUserIds))
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', Array.from(otherUserIds))
    
    if (profilesError) {
      console.error('[Action: getConversations] Error fetching profiles:', profilesError)
    } else {
      // console.log('[Action: getConversations] Profiles found:', profilesData?.length)
      profiles = profilesData || []
    }
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]))

  // Step 5: Combine everything
  const result = validConversations.map(convo => {
    const otherUserId = otherUserMap.get(convo.id)
    const otherUserProfile = otherUserId ? profileMap.get(otherUserId) : null

    return {
      ...convo,
      status: conversationMap.get(convo.id) || 'accepted',
      otherUser: otherUserProfile || null
    }
  })

  return result
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 🔒 Auth check
  if (!user) return []

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
  let otherUserData = null
  if (otherUserId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', otherUserId)
      .single()
    otherUserData = data
  }

  console.log('getConversationByUserId: returning conversation with otherUser:', otherUserData?.username)

  return {
    ...convo,
    id: conversationId,
    otherUser: otherUserData
  }
}

export async function searchUsers(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // 🔒 Sanitize query to prevent PostgREST filter injection
  const sanitized = query.replace(/[%_(),.'"\\]/g, '').trim()
  if (!sanitized || sanitized.length < 2) return []

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .or(`username.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`)
    .neq('id', user.id)
    .limit(10)

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  return users
}

export async function getConversationById(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get conversation
  const { data: convo, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error || !convo) return null

  // Get other participant
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('user_id, profiles:user_id(id, username, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id)
    .single()
  
  
  // If we can't find the other participant via join (due to some issues), try manual fetch
  let otherUser: any = participant?.profiles
  
  if (Array.isArray(otherUser)) otherUser = otherUser[0]
  
  if (!otherUser) {
     // Fallback manual fetch
     const { data: rawParticipant } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .single()
     
     if (rawParticipant?.user_id) {
        const { data: profile } = await supabase
           .from('profiles')
           .select('id, username, full_name, avatar_url')
           .eq('id', rawParticipant.user_id)
           .single()
        otherUser = profile
     }
  }

  return {
    ...convo,
    otherUser: otherUser || null,
    status: 'accepted' // Default for specific fetch
  }
}

export async function deleteConversation(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // 🔒 Verify user is a participant of this conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) return { error: 'Forbidden' }

  // Delete the conversation
  // This will cascade delete messages and participants due to FK constraints
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    console.error('Error deleting conversation:', error)
    return { error: error.message }
  }

  revalidatePath('/messages')
  return { success: true }
}
