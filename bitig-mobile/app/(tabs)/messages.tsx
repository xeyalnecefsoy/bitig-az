import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, useColorScheme, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { formatDistanceToNow } from '@/lib/utils'
import type { Conversation } from '@/lib/types'

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  useEffect(() => {
    if (user) loadConversations()
    else setLoading(false)
  }, [user])

  async function loadConversations() {
    // Get conversation IDs the user is part of
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user!.id)

    if (!participations || participations.length === 0) {
      setLoading(false)
      return
    }

    const convIds = participations.map(p => p.conversation_id)

    // Get conversations
    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false })

    if (!convos) { setLoading(false); return }

    // Get other participants
    const results: Conversation[] = await Promise.all(
      convos.map(async (convo) => {
        const { data: otherPart } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', convo.id)
          .neq('user_id', user!.id)
          .single()

        let otherUser = null
        if (otherPart?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', otherPart.user_id)
            .single()
          otherUser = profile
        }

        return { ...convo, otherUser, status: 'accepted' }
      })
    )

    setConversations(results.filter(c => c.last_message))
    setLoading(false)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadConversations()
    setRefreshing(false)
  }, [user])

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>✉️</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Mesajlar</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Mesajlarınızı görmək üçün daxil olun
        </Text>
        <Pressable
          style={[styles.loginBtn, { backgroundColor: Colors.brand }]}
          onPress={() => router.push('/login' as any)}
        >
          <Text style={styles.loginBtnText}>Daxil Ol</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />
          }
          renderItem={({ item }) => {
            const avatarUrl = item.otherUser?.avatar_url || 
              `https://bitig.az/api/avatar?name=${encodeURIComponent(item.otherUser?.username || 'unknown')}`

            return (
              <Pressable
                style={[styles.convoRow, { borderBottomColor: colors.borderLight }]}
                onPress={() => router.push(`/chat/${item.id}` as any)}
              >
                <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
                <View style={styles.convoInfo}>
                  <Text style={[styles.convoName, { color: colors.text }]} numberOfLines={1}>
                    {item.otherUser?.full_name || item.otherUser?.username || 'İstifadəçi'}
                  </Text>
                  <Text style={[styles.convoMessage, { color: colors.textTertiary }]} numberOfLines={1}>
                    {item.last_message}
                  </Text>
                </View>
                <Text style={[styles.convoTime, { color: colors.textTertiary }]}>
                  {formatDistanceToNow(item.updated_at)}
                </Text>
              </Pressable>
            )
          }}
          ListEmptyComponent={
            <View style={[styles.centered, { paddingTop: 100 }]}>
              <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>✉️</Text>
              <Text style={[{ color: colors.textSecondary, fontSize: FontSize.md }]}>
                Hələ mesajınız yoxdur
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 0.5,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  convoInfo: { flex: 1 },
  convoName: { fontSize: FontSize.md, fontWeight: '600' },
  convoMessage: { fontSize: FontSize.sm, marginTop: 2 },
  convoTime: { fontSize: FontSize.xs },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing['3xl'] },
  loginBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['4xl'],
    borderRadius: BorderRadius.lg,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
})
