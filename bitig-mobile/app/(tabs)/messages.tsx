import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { formatDistanceToNow } from '@/lib/utils'
import type { Conversation } from '@/lib/types'
import { resolveAvatarUrl } from '@/lib/avatar'
import { Feather } from '@expo/vector-icons'
import { Typography } from '@/components/ui/Typography'
import { AppHeader } from '@/components/AppHeader'
import { useLocale } from '@/context/locale'

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'inbox' | 'requests'>('inbox')
  const [search, setSearch] = useState('')
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [newChatQuery, setNewChatQuery] = useState('')
  const [newChatLoading, setNewChatLoading] = useState(false)
  const [newChatResults, setNewChatResults] = useState<any[]>([])
  const { user } = useAuth()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()
  const { t } = useLocale()

  useEffect(() => {
    if (user?.id) loadConversations()
    else setLoading(false)
  }, [user?.id])

  async function loadConversations() {
    if (!user?.id) return

    setLoading(true)
    try {
      // Get conversation IDs (and status if column exists)
      let participations: any[] = []
      try {
        const { data, error } = await supabase
          .from('conversation_participants')
          .select('conversation_id, status')
          .eq('user_id', user.id)

        if (error) throw error
        participations = data || []
      } catch {
        const { data, error } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id)

        if (error) throw error
        participations = (data || []).map(p => ({ ...p, status: 'accepted' }))
      }

      if (!participations || participations.length === 0) {
        setConversations([])
        return
      }

      const convIds = participations.map(p => p.conversation_id)
      const statusByConvoId = new Map(participations.map(p => [p.conversation_id, p.status]))

      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false })

      if (!convos) {
        setConversations([])
        return
      }

      const results: Conversation[] = await Promise.all(
        convos.map(async (convo) => {
          const { data: otherPart } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convo.id)
            .neq('user_id', user.id)
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

          const status = statusByConvoId.get(convo.id) || 'accepted'
          return { ...convo, otherUser, status }
        })
      )

      const PLACEHOLDER_PREFIX = 'Started a conversation'
      setConversations(
        results.filter((c) => {
          const lm = c.last_message ?? ''
          const trimmed = lm.trim()
          if (!trimmed) return false
          if (trimmed.startsWith(PLACEHOLDER_PREFIX)) return false
          return true
        }),
      )
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadConversations()
    setRefreshing(false)
  }, [user])

  const filteredConversations = useMemo(() => {
    const base = conversations.filter((c) => {
      if (tab === 'requests') return c.status !== 'accepted'
      return c.status === 'accepted'
    })
    const q = search.trim().toLowerCase()
    if (!q) return base

    return base.filter((c) => {
      const username = c.otherUser?.username || ''
      const fullName = c.otherUser?.full_name || ''
      return username.toLowerCase().includes(q) || fullName.toLowerCase().includes(q)
    })
  }, [conversations, tab, search])

  async function startConversation(targetUserId: string) {
    if (!user?.id) return
    const { data, error } = await supabase.rpc('start_direct_conversation', {
      other_user_id: targetUserId,
    })

    if (error) return

    const conversationId = typeof data === 'string' ? data : data?.id || data?.conversationId || data
    if (!conversationId) return

    setIsNewChatOpen(false)
    setTab('inbox')
    await loadConversations()
    router.push(`/chat/${conversationId}` as any)
  }

  async function searchUsersInModal(q: string) {
    if (!user?.id) return
    const sanitized = q.replace(/[%_(),.'"\\]/g, '').trim()
    if (sanitized.length < 2) {
      setNewChatResults([])
      return
    }
    setNewChatLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`)
        .neq('id', user.id)
        .limit(10)

      if (!error && data) setNewChatResults(data)
      else setNewChatResults([])
    } finally {
      setNewChatLoading(false)
    }
  }

  useEffect(() => {
    if (!isNewChatOpen) return
    searchUsersInModal(newChatQuery)
  }, [newChatQuery, isNewChatOpen])

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Feather name="send" size={44} color={colors.textTertiary} style={{ marginBottom: Spacing.lg }} />
        <Typography weight="bold" style={[styles.emptyTitle, { color: colors.text }]}>{t('dm_title')}</Typography>
        <Typography style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {t('dm_login_prompt')}
        </Typography>
        <Pressable onPress={() => router.push('/login' as any)} style={styles.fakeLoginBtn}>
          <Typography weight="semibold" style={{ color: '#06140A' }}>{t('sign_in')}</Typography>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Typography weight="bold" style={[styles.title, { color: colors.text }]}>
            {t('dm_title')}
          </Typography>

          <Pressable
            onPress={() => {
              setIsNewChatOpen(true)
              setNewChatQuery('')
              setNewChatResults([])
            }}
            style={({ pressed }) => [styles.plusBtn, { opacity: pressed ? 0.9 : 1, backgroundColor: Colors.brand }]}
          >
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setTab('inbox')}
            style={({ pressed }) => [
              styles.tabBtn,
              tab === 'inbox' && { backgroundColor: colors.surfaceHover, borderColor: 'transparent' },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Typography weight="semibold" style={[styles.tabLabel, { color: tab === 'inbox' ? '#60a5fa' : colors.textSecondary }]}>
              {t('dm_inbox')}
            </Typography>
          </Pressable>

          <Pressable
            onPress={() => setTab('requests')}
            style={({ pressed }) => [
              styles.tabBtn,
              tab === 'requests' && { backgroundColor: colors.surfaceHover, borderColor: 'transparent' },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Typography weight="semibold" style={[styles.tabLabel, { color: tab === 'requests' ? '#60a5fa' : colors.textSecondary }]}>
              {t('dm_requests')}
            </Typography>
          </Pressable>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: colors.surface }]}>
          <Feather name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('dm_search')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {loading ? (
          <View style={styles.centeredLoading}>
            <ActivityIndicator size="large" color={Colors.brand} />
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
            renderItem={({ item }) => {
              const avatarUrl = resolveAvatarUrl(
                item.otherUser?.avatar_url,
                item.otherUser?.username || item.otherUser?.id,
              )

              return (
                <Pressable
                  style={[styles.convoRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push(`/chat/${item.id}` as any)}
                >
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
                  <View style={styles.convoInfo}>
                    <Typography
                      weight="semibold"
                      style={[styles.convoName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.otherUser?.full_name || item.otherUser?.username || t('admin_user')}
                    </Typography>
                    <Typography
                      style={[styles.convoMessage, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.last_message}
                    </Typography>
                  </View>
                  <Typography style={[styles.convoTime, { color: colors.textTertiary }]}>
                    {formatDistanceToNow(item.updated_at)}
                  </Typography>
                </Pressable>
              )
            }}
            ListEmptyComponent={
              <View style={[styles.centered, { paddingTop: 80 }]}>
                <Feather name="send" size={44} color={colors.textTertiary} style={{ marginBottom: Spacing.md }} />
                <Typography style={[{ color: colors.textSecondary, fontSize: FontSize.md }]}>
                  {t('dm_empty_section')}
                </Typography>
              </View>
            }
          />
        )}
      </View>

      {/* New chat modal */}
      <Modal transparent visible={isNewChatOpen} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsNewChatOpen(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Typography weight="bold" style={[styles.modalTitle, { color: colors.text }]}>
                {t('dm_new_chat')}
              </Typography>
              <Pressable onPress={() => setIsNewChatOpen(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
                <Feather name="search" size={18} color={colors.textTertiary} />
                <TextInput
                  value={newChatQuery}
                  onChangeText={setNewChatQuery}
                  placeholder={t('dm_search_users')}
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.searchInput, { color: colors.text }]}
                  autoFocus
                />
              </View>

              <View style={{ marginTop: Spacing.md }}>
                {newChatLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator size="small" color={Colors.brand} />
                  </View>
                ) : newChatResults.length > 0 ? (
                  <FlatList
                    data={newChatResults}
                    keyExtractor={(u) => u.id}
                    style={{ maxHeight: 260 }}
                    contentContainerStyle={{ paddingBottom: Spacing.lg }}
                    renderItem={({ item: u }) => {
                      const avatar = resolveAvatarUrl(u.avatar_url, u.username || u.id)
                      return (
                        <Pressable
                          onPress={() => startConversation(u.id)}
                          style={({ pressed }) => [
                            styles.userRow,
                            { backgroundColor: pressed ? colors.surfaceHover : 'transparent' },
                          ]}
                        >
                          <Image source={{ uri: avatar }} style={styles.userAvatar} contentFit="cover" />
                          <View style={{ flex: 1 }}>
                            <Typography weight="semibold" style={{ color: colors.text }} numberOfLines={1}>
                              {u.full_name || u.username || 'İstifadəçi'}
                            </Typography>
                            <Typography style={{ color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                              @{u.username}
                            </Typography>
                          </View>
                        </Pressable>
                      )
                    }}
                  />
                ) : (
                  <Typography style={{ color: colors.textTertiary, textAlign: 'center', marginTop: Spacing.lg }}>
                    2 simvoldan sonra axtar
                  </Typography>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fakeLoginBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.brand,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: 12,
  },
  card: {
    flex: 1,
    marginTop: 12,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(23,23,23,0.85)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  title: { fontSize: 26 },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabLabel: { fontSize: 13 },
  searchWrap: {
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, paddingVertical: 0 },
  centeredLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['2xl'] },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 0.5,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  convoInfo: { flex: 1 },
  convoName: { fontSize: FontSize.md },
  convoMessage: { fontSize: FontSize.sm, marginTop: 2 },
  convoTime: { fontSize: FontSize.xs, maxWidth: 90, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '86%', borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  modalHeader: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  modalTitle: { fontSize: 18 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  modalBody: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: Spacing.sm,
  },
  userAvatar: { width: 42, height: 42, borderRadius: 21 },
  emptyTitle: { fontSize: FontSize.xl, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing['3xl'] },
})
