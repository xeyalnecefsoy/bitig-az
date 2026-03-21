import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable, useColorScheme, TextInput, ActivityIndicator, FlatList, Modal } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { Image } from 'expo-image'
import { useSocial } from '@/context/social'
import { SocialComposer } from '@/components/social/SocialComposer'
import type { Post, User } from '@/lib/types'
import { resolveAvatarUrl } from '@/lib/avatar'

type Group = {
  id: string
  name: string
  slug: string
  description?: string | null
  icon_url?: string | null
  cover_url?: string | null
  is_official: boolean
  members_count: number
  posts_count: number
  created_at: string
}

type GroupMember = {
  id: string
  role?: string
  username: string
  full_name?: string | null
  avatar_url?: string | null
}

type GroupPostItem = {
  id: string
  userId: string
  content: string
  imageUrls?: string[] | null
  createdAt: string
  likesCount: number
  likedByMe: boolean
  commentsCount: number
  groupId?: string | null
}

function safeTimeAgo(date: string) {
  const now = Date.now()
  const created = new Date(date).getTime()
  const diffSec = Math.max(0, Math.floor((now - created) / 1000))
  if (diffSec < 60) return 'indicə'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dəq əvvəl`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat əvvəl`
  return new Date(date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })
}

function mergeUniquePosts(prev: GroupPostItem[], next: GroupPostItem[]) {
  const byId = new Map<string, GroupPostItem>()
  prev.forEach(p => byId.set(p.id, p))
  next.forEach(p => byId.set(p.id, p))
  return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export default function GroupDetailScreen() {
  const router = useRouter()
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const { currentUser, posts: providerPosts, like, loadFeedPosts } = useSocial()

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersModalOpen, setMembersModalOpen] = useState(false)
  const [members, setMembers] = useState<GroupMember[]>([])

  const [groupPosts, setGroupPosts] = useState<GroupPostItem[]>([])
  const [postsLoading, setPostsLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!slug) return
      setLoading(true)
      try {
        const { data: groupData, error: gErr } = await supabase.from('groups').select('*').eq('slug', slug).single()
        if (gErr) throw gErr

        if (!mounted) return
        const g = groupData as Group
        setGroup(g)

        // Member count
        const { count } = await supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', g.id)
        setMemberCount(count || 0)

        // Membership
        if (currentUser) {
          const { data: memberRow } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', g.id)
            .eq('user_id', currentUser.id)
            .single()
          setIsMember(!!memberRow)
        } else {
          setIsMember(false)
        }
      } catch (e) {
        console.error('Error loading group:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [slug, currentUser])

  const fetchMembers = async () => {
    if (!group) return
    setMembersLoading(true)
    try {
      const { data } = await supabase
        .from('group_members')
        .select(`
          id, role,
          joined_at,
          profiles:user_id (id, username, full_name, avatar_url)
        `)
        .eq('group_id', group.id)
        .order('joined_at', { ascending: false })

      const mapped: GroupMember[] = (data || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        username: m.profiles?.username,
        full_name: m.profiles?.full_name,
        avatar_url: m.profiles?.avatar_url,
      }))
      setMembers(mapped)
    } catch (e) {
      console.error('Error loading group members:', e)
    } finally {
      setMembersLoading(false)
    }
  }

  const fetchGroupPosts = async (groupId: string) => {
    setPostsLoading(true)
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          id, user_id, content, image_urls, created_at, group_id,
          likes (user_id),
          comments (id)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(15)

      const mapped: GroupPostItem[] = (data || []).map((p: any) => {
        const likesArr = p.likes || []
        const commentsArr = p.comments || []
        const likedByMe = currentUser ? likesArr.some((l: any) => l.user_id === currentUser.id) : false
        return {
          id: p.id,
          userId: p.user_id,
          content: p.content,
          imageUrls: p.image_urls,
          createdAt: p.created_at,
          likesCount: likesArr.length,
          likedByMe,
          commentsCount: commentsArr.length,
          groupId: p.group_id,
        }
      })

      setGroupPosts(mapped)
    } catch (e) {
      console.error('Error loading group posts:', e)
    } finally {
      setPostsLoading(false)
    }
  }

  useEffect(() => {
    if (!group) return
    fetchGroupPosts(group.id)
  }, [group?.id])

  // Keep group feed in sync with newly created posts in SocialProvider.
  useEffect(() => {
    if (!group) return
    const newFromProvider = providerPosts
      .filter(p => p.groupId === group.id)
      .map(p => ({
        id: p.id,
        userId: p.userId,
        content: p.content,
        imageUrls: p.imageUrls,
        createdAt: p.createdAt,
        likesCount: p.likes,
        likedByMe: !!p.likedByMe,
        commentsCount: p.comments?.length || 0,
        groupId: p.groupId || null,
      }))

    if (newFromProvider.length === 0) return
    setGroupPosts(prev => mergeUniquePosts(prev, newFromProvider))
  }, [providerPosts, group?.id])

  const handleJoinLeave = async () => {
    if (!group) return
    if (!currentUser) {
      router.push('/login' as any)
      return
    }

    try {
      if (isMember) {
        await supabase.from('group_members').delete().eq('group_id', group.id).eq('user_id', currentUser.id)
        setIsMember(false)
        setMemberCount(c => Math.max(0, c - 1))
      } else {
        await supabase.from('group_members').insert({ group_id: group.id, user_id: currentUser.id })
        setIsMember(true)
        setMemberCount(c => c + 1)
      }
      // Refresh posts in case permissions affect them later
      await loadFeedPosts()
    } catch (e) {
      console.error('Join/Leave failed:', e)
    }
  }

  const handleLike = async (post: GroupPostItem) => {
    if (!currentUser) {
      router.push('/login' as any)
      return
    }

    // Optimistic local update
    setGroupPosts(prev =>
      prev.map(p => (p.id === post.id ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 } : p)),
    )
    await like(post.id)
  }

  const handleOpenPost = (postId: string) => {
    router.push(`/social/post/${postId}` as any)
  }

  const headerCover = group?.cover_url ? (
    <Image source={{ uri: group.cover_url }} style={styles.coverImage} contentFit="cover" />
  ) : (
    <View style={[styles.coverImage, { backgroundColor: 'rgba(74,216,96,0.10)' }]} />
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.text} />
        </Pressable>
        <Typography weight="bold" style={{ color: colors.text, fontSize: 18 }}>
          İcma
        </Typography>
      </View>

      {loading || !group ? (
        <View style={styles.loadingPad}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={groupPosts}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <>
              <View style={styles.coverWrap}>{headerCover}</View>

              <View style={styles.headerInfo}>
                <View style={styles.iconBubble}>
                  {group.icon_url ? (
                    <Image source={{ uri: group.icon_url }} style={styles.groupIcon} contentFit="cover" />
                  ) : (
                    <Typography weight="bold" style={{ color: Colors.brand, fontSize: 22 }}>
                      {group.name?.charAt(0)?.toUpperCase()}
                    </Typography>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Typography weight="bold" style={{ color: colors.text, fontSize: 22 }} numberOfLines={1}>
                    {group.name}
                  </Typography>
                  {!!group.description && (
                    <Typography style={{ color: colors.textSecondary, marginTop: 8 }} numberOfLines={3}>
                      {group.description}
                    </Typography>
                  )}

                  <View style={styles.statsRow}>
                    <Pressable
                      onPress={() => {
                        setMembersModalOpen(true)
                        fetchMembers()
                      }}
                      style={styles.statBtn}
                    >
                      <Feather name="users" size={16} color={colors.textTertiary} />
                      <Typography style={{ color: colors.textSecondary }}>{memberCount} üzv</Typography>
                    </Pressable>

                    <View style={[styles.statBtn, { opacity: 0.95 }]}>
                      <Feather name="message-circle" size={16} color={colors.textTertiary} />
                      <Typography style={{ color: colors.textSecondary }}>{group.posts_count} post</Typography>
                    </View>
                  </View>
                </View>

                <View style={styles.joinWrap}>
                  <Pressable
                    onPress={handleJoinLeave}
                    style={[
                      styles.joinBtn,
                      {
                        backgroundColor: isMember ? colors.surfaceHover : Colors.brand,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Typography
                      weight="semibold"
                      style={{ color: isMember ? colors.textSecondary : Colors.light.text }}
                    >
                      {isMember ? 'İcma üzvü' : 'Qoşul'}
                    </Typography>
                  </Pressable>
                </View>
              </View>

              {currentUser && isMember ? (
                <View style={{ marginTop: 10 }}>
                  <SocialComposer groupId={group.id} />
                </View>
              ) : (
                <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                  <Typography style={{ color: colors.textTertiary }}>
                    {currentUser ? 'Paylaşım üçün qoşulun' : 'Paylaşım üçün daxil olun'}
                  </Typography>
                </View>
              )}
            </>
          }
          renderItem={({ item }) => (
            <View style={[styles.postCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.postHeader}>
                <View style={styles.avatar}>
                  {/* We don't have author profile here; fallback avatar */}
                  <Feather name="user" size={18} color={colors.textTertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography weight="semibold" style={{ color: colors.text }} numberOfLines={1}>
                    {item.userId === currentUser?.id ? 'Siz' : 'İstifadəçi'}
                  </Typography>
                  <Typography style={{ color: colors.textTertiary, marginTop: 6 }} numberOfLines={1}>
                    {safeTimeAgo(item.createdAt)}
                  </Typography>
                </View>
              </View>

              <Typography style={{ color: colors.text, marginTop: 10, lineHeight: 22 }} numberOfLines={4}>
                {item.content}
              </Typography>

              {!!item.imageUrls && item.imageUrls.length > 0 && (
                <Image source={{ uri: item.imageUrls[0] as any }} style={styles.postImage} contentFit="cover" />
              )}

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleLike(item)}
                  style={styles.actionBtn}
                >
                  <Feather name="heart" size={18} color={item.likedByMe ? Colors.error : colors.textTertiary} />
                  <Typography style={{ color: colors.textSecondary, marginLeft: 6 }}>{item.likesCount}</Typography>
                </Pressable>

                <Pressable
                  onPress={() => handleOpenPost(item.id)}
                  style={styles.actionBtn}
                >
                  <Feather name="message-circle" size={18} color={colors.textTertiary} />
                  <Typography style={{ color: colors.textSecondary, marginLeft: 6 }}>{item.commentsCount}</Typography>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyPad}>
              <Feather name="message-circle" size={44} color={colors.textTertiary} />
              <Typography style={{ color: colors.textSecondary, marginTop: 10 }}>Hələ post yoxdur</Typography>
            </View>
          }
          ListFooterComponent={
            postsLoading ? (
              <View style={{ paddingVertical: 22 }}>
                <ActivityIndicator size="small" color={Colors.brand} />
              </View>
            ) : null
          }
        />
      )}

      <Modal visible={membersModalOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMembersModalOpen(false)}>
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalTop}>
              <Typography weight="bold" style={{ color: colors.text }}>
                Üzvlər ({memberCount})
              </Typography>
              <Pressable onPress={() => setMembersModalOpen(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>

            {membersLoading ? (
              <View style={{ paddingVertical: 22 }}>
                <ActivityIndicator size="large" color={Colors.brand} />
              </View>
            ) : (
              <FlatList
                data={members}
                keyExtractor={m => m.username}
                renderItem={({ item }) => (
                  <View style={[styles.memberRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.memberAvatar}>
                      <Feather name="user" size={16} color={colors.textTertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography weight="semibold" style={{ color: colors.text }}>
                        {item.username || item.full_name || 'İstifadəçi'}
                      </Typography>
                      {!!item.role && (
                        <Typography style={{ color: colors.textTertiary, marginTop: 4, fontSize: FontSize.xs }}>
                          {item.role}
                        </Typography>
                      )}
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 22 }}>
                    <Typography style={{ color: colors.textTertiary }}>Üzv tapılmadı</Typography>
                  </View>
                }
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 8, borderRadius: 9999 },
  loadingPad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverWrap: { height: 150 },
  coverImage: { width: '100%', height: 150 },
  headerInfo: {
    paddingHorizontal: 16,
    marginTop: -26,
    paddingBottom: 10,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  groupIcon: { width: '100%', height: '100%' },
  statsRow: { marginTop: 10, gap: 10 },
  statBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinWrap: { paddingTop: 6 },
  joinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  postCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  postHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImage: {
    marginTop: 12,
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 22,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyPad: {
    paddingTop: 90,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  modalBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalTop: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 8,
    borderRadius: 9999,
  },
  memberRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}) as any

