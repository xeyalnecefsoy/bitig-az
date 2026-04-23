import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View, FlatList, StyleSheet, useColorScheme, Pressable,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { DirectMessage } from '@/lib/types'
import { Feather } from '@expo/vector-icons'
import { Typography } from '@/components/ui/Typography'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { UserAvatar } from '@/components/ui/UserAvatar'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const { user } = useAuth()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const [conversationId, setConversationId] = useState<string | null>(null)

  const isUuid = useMemo(() => {
    const v = String(id || '')
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  }, [id])

  useEffect(() => {
    let mounted = true
    async function init() {
      if (!id || !user?.id) return
      setLoading(true)

      // If the route param is not a UUID, treat it as a username and resolve to a conversation id.
      if (isUuid) {
        if (!mounted) return
        setConversationId(String(id))
        return
      }

      const username = String(id)
      const otherUserId = await resolveUserIdByUsername(username)
      if (!otherUserId) {
        if (mounted) setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('start_direct_conversation', { other_user_id: otherUserId })
      if (error) {
        if (mounted) setLoading(false)
        return
      }
      const cid = typeof data === 'string' ? data : (data as any)?.id || (data as any)?.conversationId || data
      if (!cid) {
        if (mounted) setLoading(false)
        return
      }
      if (!mounted) return
      setConversationId(String(cid))
    }

    init()
    return () => {
      mounted = false
    }
  }, [id, isUuid, user?.id])

  useEffect(() => {
    if (!conversationId) return
    loadMessages()
    loadOtherUser()
    const cleanup = subscribeToMessages()
    markConversationRead()
    return () => {
      if (cleanup) cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  async function markConversationRead() {
    if (!conversationId) return
    await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId })
  }

  async function loadOtherUser() {
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', user!.id)
      .single()

    if (participant?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', participant.user_id)
        .single()
      setOtherUser(profile)
    }
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
    setLoading(false)
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100)
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as DirectMessage])
        if ((payload.new as any)?.sender_id !== user?.id) {
          markConversationRead()
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function handleSend() {
    if (!newMessage.trim() || !user || sending || !conversationId) return
    setSending(true)

    await supabase.from('direct_messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(),
      message_type: 'text',
    })

    await supabase.from('conversations').update({
      updated_at: new Date().toISOString(),
      last_message: newMessage.trim(),
    }).eq('id', conversationId)

    setNewMessage('')
    setSending(false)
  }

  const renderMessage = ({ item }: { item: DirectMessage }) => {
    const isMe = item.sender_id === user?.id
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <View style={[
          styles.bubble,
          { backgroundColor: isMe ? Colors.brand : colors.surface }
        ]}>
          <Typography style={[styles.messageText, { color: isMe ? '#06140A' : colors.text }]}>
            {item.content}
          </Typography>
          <Typography style={[styles.messageTime, { color: isMe ? 'rgba(6,20,10,0.7)' : colors.textTertiary }]}>
            {new Date(item.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </View>
      </View>
    )
  }

  const headerTitle = otherUser?.full_name || otherUser?.username || 'Söhbət'

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages'))}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, styles.backBtn]}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <UserAvatar
            avatarUrl={otherUser?.avatar_url}
            usernameOrId={otherUser?.username || otherUser?.id}
            size={34}
            backgroundColor={colors.surfaceHover}
          />
          <View style={styles.headerTitleWrap}>
            <Typography weight="bold" style={{ color: colors.text }} numberOfLines={1}>
              {headerTitle}
            </Typography>
            {otherUser?.username ? (
              <Typography style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                @{otherUser.username}
              </Typography>
            ) : null}
          </View>
        </View>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.brand} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input */}
        <GlassSurface style={[styles.inputContainer, { borderTopColor: colors.border }]} intensity={18}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder="Mesaj yazın..."
            placeholderTextColor={colors.textTertiary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendButton, { backgroundColor: Colors.brand, opacity: newMessage.trim() ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Feather name="send" size={16} color="#06140A" />
          </Pressable>
        </GlassSurface>
      </KeyboardAvoidingView>
    </>
  )
}

async function resolveUserIdByUsername(username: string) {
  const normalized = String(username || '').trim()
  if (!normalized) return null

  const { data: byProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .single()
  if (byProfile?.id) return byProfile.id as string

  const { data: byHistory } = await supabase
    .from('username_changes')
    .select('user_id')
    .or(`previous_username.eq.${normalized},new_username.eq.${normalized}`)
    .order('changed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (byHistory as any)?.user_id || null
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    marginBottom: Spacing.sm,
    maxWidth: '80%',
  },
  myMessage: { alignSelf: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start' },
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  messageText: { fontSize: FontSize.md, lineHeight: 20 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    borderTopWidth: 0.5,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    maxHeight: 100,
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
