import React, { useEffect, useState, useRef } from 'react'
import {
  View, FlatList, StyleSheet, useColorScheme, Pressable,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, Stack } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { formatDistanceToNow } from '@/lib/utils'
import type { DirectMessage } from '@/lib/types'
import { Feather } from '@expo/vector-icons'
import { Typography } from '@/components/ui/Typography'
import { GlassSurface } from '@/components/ui/GlassSurface'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
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

  useEffect(() => {
    if (id) {
      loadMessages()
      loadOtherUser()
      subscribeToMessages()
    }
  }, [id])

  async function loadOtherUser() {
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', id)
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
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
    setLoading(false)
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100)
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as DirectMessage])
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  async function handleSend() {
    if (!newMessage.trim() || !user || sending) return
    setSending(true)

    await supabase.from('direct_messages').insert({
      conversation_id: id,
      sender_id: user.id,
      content: newMessage.trim(),
      message_type: 'text',
    })

    await supabase.from('conversations').update({
      updated_at: new Date().toISOString(),
      last_message: newMessage.trim(),
    }).eq('id', id)

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
      <Stack.Screen options={{ 
        headerShown: true, 
        title: headerTitle,
        headerBackTitle: 'Geri',
      }} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
