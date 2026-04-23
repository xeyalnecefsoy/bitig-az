'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import webpush from 'web-push'

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@bitig.az'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

async function resolveUserIdByUsername(supabase: Awaited<ReturnType<typeof createClient>>, username: string) {
  const normalized = String(username || '').trim()
  if (!normalized) return null

  // 1) Current username
  const { data: byProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .single()
  if (byProfile?.id) return byProfile.id as string

  // 2) Historical usernames
  const { data: byHistory } = await supabase
    .from('username_changes')
    .select('user_id')
    .or(`previous_username.eq.${normalized},new_username.eq.${normalized}`)
    .order('changed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (byHistory as any)?.user_id || null
}

export async function getConversationByUsername(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const otherUserId = await resolveUserIdByUsername(supabase, username)
  if (!otherUserId) return null

  return await getConversationByUserId(otherUserId)
}

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
    .select('conversation_id, status, unread_count')
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
    myParticipations = (dataBasic || []).map(p => ({ ...p, status: 'accepted', unread_count: 0 }))
  } else {
    myParticipations = dataWithStatus || []
  }

  if (!myParticipations || myParticipations.length === 0) {
    return [] // No conversations yet
  }

  const conversationMap = new Map(myParticipations.map(p => [p.conversation_id, p.status]))
  const unreadMap = new Map(myParticipations.map(p => [p.conversation_id, Number(p.unread_count || 0)]))
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

  // Some older conversations may have messages but `conversations.last_message` is null/empty.
  // In that case, fall back to the latest `direct_messages` row for preview.
  const baseConversations = conversations || []
  const needsPreview = baseConversations
    .filter(c => !c.last_message || String(c.last_message).trim() === '')
    .map(c => c.id)

  let previewByConversationId = new Map<string, { content: string | null; message_type?: string | null; created_at?: string | null }>()
  if (needsPreview.length > 0) {
    const { data: previews, error: previewErr } = await supabase
      .from('direct_messages')
      .select('conversation_id, content, message_type, created_at')
      .in('conversation_id', needsPreview)
      .order('created_at', { ascending: false })

    if (previewErr) {
      console.error('[Action: getConversations] Error fetching previews:', previewErr)
    } else if (previews && previews.length > 0) {
      // Because we ordered desc, first row we see per conversation is the latest.
      for (const row of previews as any[]) {
        if (!previewByConversationId.has(row.conversation_id)) {
          previewByConversationId.set(row.conversation_id, row)
        }
      }
    }
  }

  const withPreview = baseConversations.map(c => {
    const preview = previewByConversationId.get(c.id)
    if (!preview) return c
    const last =
      preview.message_type === 'text'
        ? preview.content
        : preview.message_type === 'book_share'
          ? 'Shared a book'
          : preview.message_type === 'post_share'
            ? 'Shared a post'
            : preview.content
    return {
      ...c,
      last_message: last ?? c.last_message,
      // Use last message time to ensure ordering feels right in UI.
      updated_at: preview.created_at ?? c.updated_at,
    }
  })

  // Filter out truly empty conversations or placeholders
  const validConversations = withPreview.filter(c => {
    const lm = c.last_message != null ? String(c.last_message).trim() : ''
    if (!lm) return false
    if (lm.startsWith('Started a conversation')) return false
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
    const rawStatus = conversationMap.get(convo.id)
    const hasRealPreview = convo.last_message != null && String(convo.last_message).trim() !== ''
    // If a conversation has real messages, treat it as accepted for inbox rendering,
    // even if participant status is stale/pending (mobile has historically shown these).
    const normalizedStatus = hasRealPreview ? 'accepted' : (rawStatus || 'accepted')

    return {
      ...convo,
      status: normalizedStatus,
      unread_count: unreadMap.get(convo.id) || 0,
      has_unread: (unreadMap.get(convo.id) || 0) > 0,
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

  // Best-effort push delivery (mobile Expo + web push).
  try {
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id)
      .limit(1)

    const recipientId = participants?.[0]?.user_id
    if (recipientId) {
      const body = lastMessagePreview || 'Yeni mesaj'

      const { data: mobileTokens } = await supabase
        .from('mobile_push_tokens')
        .select('token')
        .eq('user_id', recipientId)
        .eq('active', true)

      if (mobileTokens?.length) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            mobileTokens.map((row: any) => ({
              to: row.token,
              title: 'Bitig',
              body,
              data: { conversationId, type: 'dm' },
              sound: 'default',
            })),
          ),
        })
      }

      const { data: webSubs } = await supabase
        .from('web_push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', recipientId)
        .eq('active', true)

      if (webSubs?.length && configureWebPush()) {
        await Promise.all(
          webSubs.map(async (sub: any) => {
            const subscription = {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            }
            try {
              await webpush.sendNotification(
                subscription as any,
                JSON.stringify({
                  title: 'Bitig',
                  body,
                  url: `/az/messages?id=${conversationId}`,
                }),
              )
            } catch {
              // ignore stale subscription errors for now
            }
          }),
        )
      }
    }
  } catch {
    // push must not block message sending
  }

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

  // Get my participant row for status/unread
  const { data: myParticipant } = await supabase
    .from('conversation_participants')
    .select('status, unread_count')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

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
    otherUser: otherUserData,
    // Ensure inbox list renders it immediately (ConversationList filters by accepted status)
    status: myParticipant?.status || 'accepted',
    unread_count: Number(myParticipant?.unread_count || 0),
    has_unread: Number(myParticipant?.unread_count || 0) > 0,
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

  const { data: myParticipant } = await supabase
    .from('conversation_participants')
    .select('status, unread_count')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  return {
    ...convo,
    otherUser: otherUser || null,
    status: myParticipant?.status || 'accepted',
    unread_count: Number(myParticipant?.unread_count || 0),
    has_unread: Number(myParticipant?.unread_count || 0) > 0,
  }
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  })
  if (error) return { error: error.message }

  revalidatePath('/messages')
  return { success: true }
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
