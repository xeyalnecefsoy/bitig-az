import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  StyleSheet,
  useColorScheme,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { supabase } from '@/lib/supabase'
import { SOCIAL_POST_ENRICHED_SELECT } from '@/lib/socialPostSelect'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { useSocial } from '@/context/social'
import type { Post, User } from '@/lib/types'
import { resolveAvatarUrl } from '@/lib/avatar'
import { SocialPostCard } from '@/components/social/SocialPostCard'

type SocialPostDetail = Post & {
  poll?: any
  status?: string
  rejectedAt?: string | null
  updatedAt?: string | null
  likedByMe?: boolean
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

export default function SocialPostPage() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const postId = id || ''

  const { posts, addComment, currentUser, users, editPost, loading: socialLoading, mergePostsFromSupabaseRows } = useSocial()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const postFromContext = useMemo(
    () => posts.find(p => p.id === postId) as SocialPostDetail | undefined,
    [posts, postId],
  )

  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(!postFromContext)
  const [commentText, setCommentText] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!postId) return
      if (postFromContext) {
        setLoading(false)
        setNotFound(false)
        return
      }
      setLoading(true)
      setNotFound(false)
      const { data, error } = await supabase.from('posts').select(SOCIAL_POST_ENRICHED_SELECT).eq('id', postId).maybeSingle()
      if (cancelled) return
      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      await mergePostsFromSupabaseRows([data])
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [postId, postFromContext, mergePostsFromSupabaseRows])

  const post = postFromContext

  useEffect(() => {
    if (!editOpen) return
    if (!post) return
    setEditText(post.content)
  }, [editOpen, post])

  const author: User | null = useMemo(() => {
    if (!post) return null
    return users.find(u => u.id === post.userId) || (currentUser?.id === post.userId ? (currentUser as any) : null) || null
  }, [currentUser, post, users])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.text} />
        </Pressable>
        <Typography weight="bold" style={{ color: colors.text, fontSize: 18, flex: 1 }} numberOfLines={1}>
          Paylaşım
        </Typography>
        {post && currentUser?.id === post.userId ? (
          <Pressable onPress={() => setEditOpen(true)} style={styles.iconBtn} accessibilityLabel="Redaktə et">
            <Feather name="edit-3" size={20} color={Colors.brand} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {loading || socialLoading ? (
        <View style={styles.loadingPad}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : notFound || !post ? (
        <View style={styles.loadingPad}>
          <Typography style={{ color: colors.textTertiary }}>Paylaşım tapılmadı</Typography>
        </View>
      ) : (
        <>
          <SocialPostCard post={post as any} mode="detail" />

          <View style={[styles.commentsBox, { borderColor: colors.border }]}>
            <Typography weight="semibold" style={{ color: colors.textSecondary, fontSize: FontSize.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
              Şərhlər ({post.comments?.length || 0})
            </Typography>

            <FlatList
              data={post.comments || []}
              keyExtractor={c => c.id}
              renderItem={({ item }) => (
                <View style={[styles.commentRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.commentAvatar}>
                    <Image
                      source={{ uri: resolveAvatarUrl(users.find(u => u.id === item.userId)?.avatar || null, item.userId) }}
                      style={styles.commentImg}
                      contentFit="cover"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography weight="semibold" style={{ color: colors.text }}>
                      {users.find(u => u.id === item.userId)?.name ||
                        users.find(u => u.id === item.userId)?.username ||
                        'İstifadəçi'}
                    </Typography>
                    <Typography style={{ color: colors.textSecondary, marginTop: 6 }}>{item.content}</Typography>
                    <Typography style={{ color: colors.textTertiary, marginTop: 6, fontSize: FontSize.xs }}>
                      {safeTimeAgo(item.createdAt)}
                    </Typography>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ paddingVertical: 18, paddingHorizontal: Spacing.lg }}>
                  <Typography style={{ color: colors.textTertiary }}>Hələ şərh yoxdur</Typography>
                </View>
              }
            />
          </View>

          <View style={[styles.commentComposer, { borderTopColor: colors.border }]}>
            <View style={[styles.commentInputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="message-square" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.commentInput, { color: colors.text }]}
                placeholder="Şərh yazın..."
                placeholderTextColor={colors.textTertiary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
            </View>

            <Pressable
              style={[
                styles.sendBtn,
                {
                  backgroundColor: commentText.trim() ? Colors.brand : colors.surfaceHover,
                  opacity: commentText.trim() ? 1 : 0.6,
                },
              ]}
              disabled={!commentText.trim()}
              onPress={async () => {
                await addComment(post.id, commentText)
                setCommentText('')
              }}
            >
              <Feather name="send" size={18} color={commentText.trim() ? '#06140A' : colors.textTertiary} />
            </Pressable>
          </View>
        </>
      )}

      <Modal visible={editOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditOpen(false)}>
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Typography weight="bold" style={{ color: colors.text }}>
              Paylaşımı redaktə et
            </Typography>
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.surfaceHover }]} onPress={() => setEditOpen(false)}>
                <Typography weight="semibold" style={{ color: colors.textSecondary }}>
                  Ləğv et
                </Typography>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: Colors.brand }]}
                onPress={async () => {
                  if (!post) return
                  const next = editText.trim()
                  if (!next) return
                  await editPost(post.id, next)
                  setEditOpen(false)
                }}
              >
                <Typography weight="semibold" style={{ color: '#06140A' }}>
                  Yadda saxla
                </Typography>
              </Pressable>
            </View>
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
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 8,
    borderRadius: 9999,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    marginHorizontal: 16,
    marginTop: 12,
    flex: 1,
    overflow: 'hidden',
  },
  commentRow: {
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  commentImg: {
    width: '100%',
    height: '100%',
  },
  commentComposer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  commentInputBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingVertical: 0,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInput: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
    maxHeight: 180,
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
    padding: Spacing.lg,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalBtn: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
