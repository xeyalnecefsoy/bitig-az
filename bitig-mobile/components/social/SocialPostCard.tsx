import React, { useMemo, useState } from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  useColorScheme,
  Modal,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { useSocial } from '@/context/social'
import { useLocale } from '@/context/locale'
import { resolveAvatarUrl } from '@/lib/avatar'
import type { Post, User } from '@/lib/types'
import { SocialComposer } from './SocialComposer'

type SocialPost = Post & {
  poll?: any
  status?: string
  rejectedAt?: string | null
  updatedAt?: string | null
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

export function SocialPostCard({
  post,
  mode = 'feed',
  showInlineComments = true,
}: {
  post: SocialPost
  mode?: 'feed' | 'detail'
  showInlineComments?: boolean
}) {
  const router = useRouter()
  const { t } = useLocale()
  const { currentUser, users, like, deletePost, voteOnPoll, addComment } = useSocial()

  const author = useMemo<User | null>(() => {
    return users.find(u => u.id === post.userId) || (currentUser?.id === post.userId ? currentUser : null) || null
  }, [currentUser, post.userId, users])

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const avatarUrl = resolveAvatarUrl(author?.avatar || null, author?.username || post.userId)

  const quotedAuthor = useMemo(() => {
    if (!post.quotedPost) return null
    return users.find(u => u.id === post.quotedPost!.userId) ?? null
  }, [post.quotedPost, users])

  const quotedAvatarUrl = post.quotedPost
    ? resolveAvatarUrl(quotedAuthor?.avatar ?? null, quotedAuthor?.username ?? post.quotedPost.userId)
    : ''

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [quoteComposerOpen, setQuoteComposerOpen] = useState(false)
  const [inlineComment, setInlineComment] = useState('')

  const onOpenDetail = () => {
    if (mode === 'detail') return
    router.push(`/social/post/${post.id}` as any)
  }

  const quotedSnapshot = useMemo(
    () => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      imageUrls: post.imageUrls,
      createdAt: post.createdAt,
    }),
    [post],
  )

  const submitInlineComment = async () => {
    const text = inlineComment.trim()
    if (!text) return
    if (!currentUser) {
      Alert.alert(t('social_sign_in_prompt'))
      return
    }
    await addComment(post.id, text)
    setInlineComment('')
  }

  return (
    <>
    <View style={{ marginHorizontal: 16, marginTop: 10 }}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable onPress={onOpenDetail} disabled={mode === 'detail'}>
        <View style={styles.header}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Typography weight="semibold" style={{ color: colors.text }} numberOfLines={1}>
              {author?.name || author?.username || 'İstifadəçi'}
            </Typography>
            <Typography style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginTop: 3 }}>
              @{author?.username || 'unknown'} · {safeTimeAgo(post.createdAt)}
            </Typography>
          </View>

          {currentUser?.id === post.userId && (
            <Pressable
              onPress={(e: any) => {
                // RN: prevent bubbling to card press
                e?.stopPropagation?.()
                setConfirmDeleteOpen(true)
              }}
              style={styles.moreBtn}
            >
              <Feather name="trash-2" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        <Typography style={{ color: colors.text, fontSize: FontSize.md, lineHeight: 22, marginTop: 10 }}>
          {post.content}
        </Typography>

        {post.imageUrls && post.imageUrls.length > 0 && (
          <Image
            source={{ uri: post.imageUrls[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        )}

        {post.poll && (
          <View style={[styles.pollBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {post.poll.options?.map((opt: any) => {
              const showResults = post.poll?.hasExpired || opt?.hasVoted
              const maxVotes = Math.max(...(post.poll.options || []).map((o: any) => o.votesCount || 0))
              const isWinning = showResults && opt.votesCount === maxVotes
              return (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.pollOption,
                    {
                      borderColor: isWinning ? Colors.brand : colors.border,
                      backgroundColor: showResults
                        ? isWinning
                          ? 'rgba(74,216,96,0.12)'
                          : colors.surfaceHover
                        : colors.surfaceHover,
                    },
                  ]}
                  onPress={() => {
                    if (!showResults && opt.id) voteOnPoll(post.id, opt.id)
                  }}
                >
                  <Typography style={{ color: colors.text }}>
                    {opt.text}
                  </Typography>
                  <Typography style={{ color: colors.textTertiary, fontSize: FontSize.sm, marginTop: 2 }}>
                    {showResults ? `${opt.votesCount}` : 'Seç'}
                  </Typography>
                </Pressable>
              )
            })}
          </View>
        )}

        {!!post.mentionedBook?.id && (
          <Pressable
            onPress={() => router.push(`/book/${post.mentionedBook!.id}` as any)}
            style={[styles.bookPill, { borderColor: colors.border }]}
          >
            <Feather name="book-open" size={16} color={Colors.brand} />
            <View style={{ flex: 1 }}>
              <Typography weight="semibold" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {post.mentionedBook!.title}
              </Typography>
              {!!post.mentionedBook!.author && (
                <Typography style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginTop: 2 }} numberOfLines={1}>
                  {post.mentionedBook!.author}
                </Typography>
              )}
            </View>
          </Pressable>
        )}

        {post.quotedPost && (
          <Pressable
            onPress={(e: any) => {
              e?.stopPropagation?.()
              router.push(`/social/post/${post.quotedPost!.id}` as any)
            }}
            style={[styles.quotedEmbed, { borderColor: colors.border, backgroundColor: colors.background }]}
          >
            <Image source={{ uri: quotedAvatarUrl }} style={styles.quotedAvatar} contentFit="cover" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography weight="semibold" style={{ color: colors.text, fontSize: FontSize.md }} numberOfLines={1}>
                {quotedAuthor?.name || quotedAuthor?.username || 'User'}
              </Typography>
              <Typography style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginTop: 2 }} numberOfLines={1}>
                @{quotedAuthor?.username || 'unknown'}
                {post.quotedPost.createdAt ? ` · ${safeTimeAgo(post.quotedPost.createdAt)}` : ''}
              </Typography>
              <Typography style={{ color: colors.text, marginTop: 8, fontSize: FontSize.md, lineHeight: 20 }} numberOfLines={8}>
                {post.quotedPost.content.trim() || ' '}
              </Typography>
              {post.quotedPost.imageUrls?.[0] ? (
                <View style={styles.quotedMediaFrame}>
                  <Image
                    source={{ uri: post.quotedPost.imageUrls[0] }}
                    style={styles.quotedThumb}
                    contentFit="cover"
                  />
                </View>
              ) : null}
            </View>
          </Pressable>
        )}

        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={() => like(post.id)}
            style={styles.actionBtn}
          >
            <Feather name="heart" size={18} color={post.likedByMe ? Colors.error : colors.textTertiary} />
            <Typography style={{ color: colors.textSecondary, marginLeft: 6, fontSize: FontSize.sm }}>
              {post.likes}
            </Typography>
          </Pressable>

          <Pressable onPress={onOpenDetail} style={styles.actionBtn}>
            <Feather name="message-circle" size={18} color={colors.textTertiary} />
            <Typography style={{ color: colors.textSecondary, marginLeft: 6, fontSize: FontSize.sm }}>
              {post.comments?.length || 0}
            </Typography>
          </Pressable>

          <Pressable
            onPress={() => {
              if (!currentUser) {
                Alert.alert(t('social_sign_in_prompt'))
                return
              }
              setQuoteComposerOpen(true)
            }}
            style={styles.actionBtn}
          >
            <Feather name="repeat" size={18} color={colors.textTertiary} />
            <Typography style={{ color: colors.textSecondary, marginLeft: 6, fontSize: FontSize.sm }}>
              {t('social_quote')}
            </Typography>
          </Pressable>
        </View>

        {mode === 'feed' && showInlineComments && (
          <View style={styles.inlineComments}>
            {(post.comments || []).slice(0, 3).map(c => {
              const cUser = users.find(u => u.id === c.userId)
              const cAvatar = resolveAvatarUrl(cUser?.avatar || null, cUser?.username || c.userId)
              return (
                <View
                  key={c.id}
                  style={[styles.commentPreviewRow, { borderBottomColor: colors.border }]}
                >
                  <Image source={{ uri: cAvatar }} style={styles.commentPreviewAvatar} contentFit="cover" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Typography weight="semibold" style={{ color: colors.text }} numberOfLines={1}>
                      {cUser?.name || cUser?.username || 'İstifadəçi'}
                    </Typography>
                    <Typography style={{ color: colors.textSecondary, marginTop: 4, fontSize: FontSize.sm }}>
                      {c.content}
                    </Typography>
                    <Typography style={{ color: colors.textTertiary, marginTop: 4, fontSize: FontSize.xs }}>
                      {safeTimeAgo(c.createdAt)}
                    </Typography>
                  </View>
                </View>
              )
            })}

            <View style={[styles.inlineCommentForm, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.inlineCommentInput, { color: colors.text }]}
                placeholder={t('social_write_comment')}
                placeholderTextColor={colors.textTertiary}
                value={inlineComment}
                onChangeText={setInlineComment}
                multiline
                maxLength={500}
              />
              <Pressable
                onPress={submitInlineComment}
                disabled={!inlineComment.trim()}
                style={[
                  styles.inlineCommentSend,
                  {
                    backgroundColor: inlineComment.trim() ? Colors.brand : colors.surfaceHover,
                    opacity: inlineComment.trim() ? 1 : 0.55,
                  },
                ]}
              >
                <Typography weight="semibold" style={{ color: inlineComment.trim() ? '#06140A' : colors.textTertiary, fontSize: FontSize.sm }}>
                  {t('social_post_button')}
                </Typography>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>

      <Modal
        visible={quoteComposerOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setQuoteComposerOpen(false)}
      >
        <SafeAreaView style={[styles.quoteFullscreenRoot, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <View style={[styles.quoteFullscreenHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setQuoteComposerOpen(false)} style={styles.moreBtn} accessibilityRole="button" accessibilityLabel="Bağla">
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
            <Typography weight="bold" style={{ color: colors.text, fontSize: 18 }}>
              {t('social_quote')}
            </Typography>
            <View style={{ width: 40 }} />
          </View>
          <KeyboardAvoidingView
            style={styles.quoteFullscreenBody}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.quoteFullscreenScrollContent}
            >
              <SocialComposer
                quotedPostId={post.id}
                quotedPostSnapshot={quotedSnapshot}
                onPostCreated={() => setQuoteComposerOpen(false)}
                quoteFullscreenModal
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal visible={confirmDeleteOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setConfirmDeleteOpen(false)}
        >
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Typography weight="bold" style={{ color: colors.text }}>
              Paylaşımı silmək?
            </Typography>
            <Typography style={{ color: colors.textSecondary, marginTop: 8 }}>
              Bu əməliyyat geri qaytarılmayacaq.
            </Typography>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.surfaceHover }]} onPress={() => setConfirmDeleteOpen(false)}>
                <Typography weight="semibold" style={{ color: colors.textSecondary }}>
                  Ləğv et
                </Typography>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: Colors.error }]}
                onPress={() => {
                  deletePost(post.id)
                  setConfirmDeleteOpen(false)
                }}
              >
                <Typography weight="semibold" style={{ color: '#fff' }}>
                  Sil
                </Typography>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  moreBtn: {
    padding: 8,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineComments: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.25)',
  },
  commentPreviewRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentPreviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  inlineCommentForm: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  inlineCommentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: FontSize.sm,
    paddingVertical: 6,
  },
  inlineCommentSend: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  pollBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  pollOption: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  bookPill: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quotedEmbed: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quotedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  quotedMediaFrame: {
    marginTop: Spacing.sm,
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 220,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.35)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  quotedThumb: {
    width: '100%',
    height: '100%',
  },
  quoteFullscreenRoot: {
    flex: 1,
  },
  quoteFullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  quoteFullscreenBody: {
    flex: 1,
  },
  quoteFullscreenScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

