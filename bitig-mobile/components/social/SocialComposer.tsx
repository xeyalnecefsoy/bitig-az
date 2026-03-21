import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  useColorScheme,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Button } from '@/components/ui/Button'
import { Typography } from '@/components/ui/Typography'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useSocial } from '@/context/social'
import { useAuth } from '@/context/auth'
import { uploadPostImages } from '@/lib/uploadPostImages'
import { useLocale } from '@/context/locale'
import { resolveAvatarUrl } from '@/lib/avatar'
import type { QuotedPostEmbed } from '@/lib/types'

function quotePreviewTimeAgo(date: string) {
  const now = Date.now()
  const created = new Date(date).getTime()
  const diffSec = Math.max(0, Math.floor((now - created) / 1000))
  if (diffSec < 60) return 'indicə'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dəq`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat`
  return new Date(date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })
}

type SocialComposerProps = {
  groupId?: string
  replyToPostId?: string
  quotedPostId?: string
  /** When the quoted post is not yet in `posts` (e.g. edge cases), show embed from this snapshot */
  quotedPostSnapshot?: QuotedPostEmbed | null
  onPostCreated?: () => void
  /** Full-screen quote modal: flatter chrome, hide tip row */
  quoteFullscreenModal?: boolean
}

export function SocialComposer({
  groupId,
  replyToPostId,
  quotedPostId,
  quotedPostSnapshot,
  onPostCreated,
  quoteFullscreenModal = false,
}: SocialComposerProps) {
  const router = useRouter()
  const { t } = useLocale()
  const { createPost, loading: socialLoading, posts, users } = useSocial()
  const { user } = useAuth()

  const [value, setValue] = useState('')
  const [posting, setPosting] = useState(false)
  const [imageUris, setImageUris] = useState<string[]>([])

  // Thread mode (creates multiple posts with parent_post_id chain)
  const [threadOpen, setThreadOpen] = useState(false)
  const [threadSubmitting, setThreadSubmitting] = useState(false)
  const [threadDrafts, setThreadDrafts] = useState<string[]>(['', ''])

  // Poll creation mode
  const [pollEnabled, setPollEnabled] = useState(false)
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [pollDurationHours, setPollDurationHours] = useState(24)

  // Mention (user tagging) - simple @username suggestions
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionLoading, setMentionLoading] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<
    { id: string; username: string; full_name: string | null; avatar_url: string | null }[]
  >([])
  const mentionStartIndexRef = useRef<number>(-1)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const quotedPreview = useMemo(() => {
    if (!quotedPostId) return null
    return posts.find(p => p.id === quotedPostId) ?? quotedPostSnapshot ?? null
  }, [quotedPostId, posts, quotedPostSnapshot])

  const quotedAuthor = quotedPreview
    ? users.find(u => u.id === quotedPreview.userId) ?? null
    : null

  const trimmedValue = useMemo(() => value.trim(), [value])
  const pollValid = useMemo(() => {
    if (!pollEnabled) return false
    const clean = pollOptions.map(o => o.trim()).filter(Boolean)
    return clean.length >= 2
  }, [pollEnabled, pollOptions])

  const canPost = useMemo(() => {
    if (!user) return false
    if (socialLoading) return false
    if (posting) return false
    if (threadOpen) return false
    if (pollEnabled && !pollValid) return false
    const hasBody = !!trimmedValue
    return hasBody || !!quotedPostId
  }, [posting, socialLoading, threadOpen, user, trimmedValue, quotedPostId, pollEnabled, pollValid])

  const updateMentionFromText = (nextText: string) => {
    const lastAt = nextText.lastIndexOf('@')
    if (lastAt === -1) {
      mentionStartIndexRef.current = -1
      setMentionOpen(false)
      setMentionQuery('')
      setMentionSuggestions([])
      return
    }

    const afterAt = nextText.slice(lastAt + 1)
    if (/\s/.test(afterAt) || afterAt.length < 2) {
      mentionStartIndexRef.current = -1
      setMentionOpen(false)
      setMentionQuery('')
      setMentionSuggestions([])
      return
    }

    mentionStartIndexRef.current = lastAt
    setMentionQuery(afterAt)
    setMentionOpen(true)
  }

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!mentionOpen) return
      if (mentionQuery.trim().length < 2) return

      setMentionLoading(true)
      try {
        const sanitized = mentionQuery.replace(/[%_(),.'\"\\]/g, '').trim()
        if (!sanitized || sanitized.length < 2) {
          setMentionSuggestions([])
          return
        }

        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .or(`username.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`)
          .limit(8)

        if (mounted) setMentionSuggestions((data || []) as any)
      } catch (e) {
        console.error('Mention search failed:', e)
      } finally {
        if (mounted) setMentionLoading(false)
      }
    }

    const t = setTimeout(run, 250)
    return () => {
      mounted = false
      clearTimeout(t)
    }
  }, [mentionOpen, mentionQuery])

  const applyMention = (p: { id: string; username: string }) => {
    const atIndex = mentionStartIndexRef.current
    if (atIndex < 0) return

    const before = value.slice(0, atIndex)
    const after = value.slice(atIndex + 1 + mentionQuery.length)
    const nextValue = `${before}@${p.username} ${after}`

    setValue(nextValue)
    setMentionOpen(false)
    setMentionQuery('')
    setMentionSuggestions([])
    mentionStartIndexRef.current = -1
  }

  const canPickImages = !!user && !posting && !threadOpen && imageUris.length < 4

  const pickImages = async () => {
    if (!canPickImages) return

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (perm.status !== 'granted') return

    const remaining = 4 - imageUris.length
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    })

    if (result.canceled) return
    const uris = (result.assets || []).map(a => a.uri).filter(Boolean)
    if (uris.length === 0) return
    setImageUris(prev => [...prev, ...uris].slice(0, 4))
  }

  const removeImageAt = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index))
  }

  const submitSingle = async () => {
    if (!user) return
    if (!trimmedValue && !quotedPostId) return
    if (posting) return

    setPosting(true)
    try {
      let uploadedUrls: string[] | undefined
      if (imageUris.length > 0) {
        uploadedUrls = await uploadPostImages(imageUris, user.id)
      }

      const options = pollValid ? pollOptions.map(o => o.trim()).filter(Boolean) : undefined
      const parentForSubmit = quotedPostId ? undefined : replyToPostId
      const body = trimmedValue || ' '

      await createPost(body, undefined, groupId, uploadedUrls, parentForSubmit, options, pollDurationHours, quotedPostId)

      setValue('')
      setImageUris([])
      setPollEnabled(false)
      setPollOptions(['', ''])
      setPollDurationHours(24)
      onPostCreated?.()
    } finally {
      setPosting(false)
    }
  }

  const openThread = () => {
    setPollEnabled(false)
    setThreadDrafts([trimmedValue, ''])
    setThreadOpen(true)
  }

  const submitThread = async () => {
    if (!user) return
    if (threadSubmitting) return

    const draftsClean = threadDrafts.map(d => d.trim()).filter(Boolean)
    if (draftsClean.length === 0) return

    setThreadSubmitting(true)
    try {
      let firstImageUrls: string[] | undefined
      if (imageUris.length > 0) {
        firstImageUrls = await uploadPostImages(imageUris, user.id)
      }

      let previousPostId: string | undefined = replyToPostId
      for (let i = 0; i < draftsClean.length; i++) {
        const imageUrlsForThis = i === 0 ? firstImageUrls : undefined
        const useQuote = !!quotedPostId && i === 0
        const parentForThis = useQuote ? undefined : previousPostId
        const quotedForThis = useQuote ? quotedPostId : undefined
        const newId = await createPost(
          draftsClean[i],
          undefined,
          groupId,
          imageUrlsForThis,
          parentForThis,
          undefined,
          undefined,
          quotedForThis,
        )
        if (!newId) throw new Error('Thread post creation failed')
        previousPostId = newId
      }

      setValue('')
      setImageUris([])
      setThreadOpen(false)
      setThreadDrafts(['', ''])
      onPostCreated?.()
    } finally {
      setThreadSubmitting(false)
    }
  }

  return (
    <GlassSurface
      style={[
        styles.composer,
        { borderColor: colors.border },
        quoteFullscreenModal && { marginHorizontal: 0, marginTop: 0, borderWidth: 0 },
      ]}
      intensity={quoteFullscreenModal ? 1 : 22}
    >
      {!quoteFullscreenModal && (
      <Pressable
        onPress={() =>
          setValue(v =>
            v
              ? v
              : 'Məsləhət: Maraqlı ideyalar, kitablar və ya təəssüratlarınız haqqında ətraflı bölüşün',
          )
        }
        style={[styles.suggestionBox, { borderColor: Colors.warning }]}
      >
        <View style={styles.suggestionLeftIcon}>
          <Feather name="info" size={14} color={Colors.warning} />
        </View>
        <Typography style={{ color: colors.textSecondary, flex: 1 }} weight="semibold">
          Məsləhət:
        </Typography>
        <Typography style={{ color: Colors.warning, flex: 3 }} numberOfLines={2}>
          Maraqlı ideyalar, kitablar və ya təəssüratlarınız haqqında ətraflı bölüşün
        </Typography>
      </Pressable>
      )}

      <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Paylaşım yazın..."
          value={value}
          placeholderTextColor={colors.textTertiary}
          onChangeText={text => {
            setValue(text)
            updateMentionFromText(text)
          }}
          multiline
          maxLength={500}
          editable={!threadOpen}
        />
      </View>

      {!!imageUris.length && !threadOpen && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {imageUris.map((uri, idx) => (
            <View key={uri + idx} style={[styles.imageThumbWrap, { borderColor: colors.border }]}>
              <Image source={{ uri }} style={styles.imageThumb} contentFit="cover" />
              <Pressable
                onPress={() => removeImageAt(idx)}
                style={[styles.imageRemove, { backgroundColor: Colors.error }]}
              >
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Bottom row: 3 ikon (şəkil/səsvermə/ardlar) + sağda Paylaş */}
      {!threadOpen && (
        <View style={styles.bottomRow}>
          <View style={styles.bottomIcons}>
            <Pressable
              onPress={pickImages}
              disabled={!canPickImages}
              style={[styles.iconBtn, { borderColor: colors.border }]}
            >
              <Feather name="image" size={18} color={colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={() => {
                const next = !pollEnabled
                setPollEnabled(next)
                if (next) setPollOptions(['', ''])
              }}
              style={[
                styles.iconBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: pollEnabled ? 'rgba(74,216,96,0.12)' : 'transparent',
                },
              ]}
            >
              <Feather
                name="bar-chart-2"
                size={18}
                color={pollEnabled ? Colors.brand : colors.textTertiary}
              />
            </Pressable>

            <Pressable
              onPress={openThread}
              disabled={!!quotedPostId}
              style={[
                styles.iconBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceHover,
                  opacity: quotedPostId ? 0.35 : 1,
                },
              ]}
            >
              <Feather name="plus-square" size={18} color={Colors.brand} />
            </Pressable>
          </View>

          <Pressable
            onPress={submitSingle}
            disabled={!canPost}
            style={({ pressed }) => [
              styles.shareBtn,
              {
                opacity: canPost ? (pressed ? 0.88 : 1) : 0.55,
                backgroundColor: Colors.brand,
              },
            ]}
          >
            <Feather name="send" size={18} color="#06140A" />
            <Typography style={{ color: '#06140A' }} weight="semibold">
              Paylaş
            </Typography>
          </Pressable>
        </View>
      )}

      {/* Örəntilənən paylaşım aşağıda — X kimi əvvəl öz mətniniz/şəkil/ikonlar */}
      {!!quotedPostId && (
        <View style={[styles.quotePreviewWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Typography style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginBottom: 8 }} weight="semibold">
            {t('social_quoted_post')}
          </Typography>
          {quotedPreview ? (
            <Pressable
              onPress={() => router.push(`/social/post/${quotedPreview.id}` as any)}
              style={[styles.quotePreviewCard, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <Image
                source={{ uri: resolveAvatarUrl(quotedAuthor?.avatar ?? null, quotedAuthor?.username ?? quotedPreview.userId) }}
                style={styles.quoteAvatar}
                contentFit="cover"
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Typography weight="semibold" style={{ color: colors.text, fontSize: FontSize.md }} numberOfLines={1}>
                  {quotedAuthor?.name || quotedAuthor?.username || 'User'}
                </Typography>
                <Typography style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginTop: 2 }} numberOfLines={1}>
                  @{quotedAuthor?.username || 'unknown'}
                  {quotedPreview.createdAt ? ` · ${quotePreviewTimeAgo(quotedPreview.createdAt)}` : ''}
                </Typography>
                <Typography style={{ color: colors.text, marginTop: 8, fontSize: FontSize.md, lineHeight: 20 }} numberOfLines={6}>
                  {quotedPreview.content.trim() || ' '}
                </Typography>
                {quotedPreview.imageUrls?.[0] ? (
                  <View style={styles.quoteMediaFrame}>
                    <Image
                      source={{ uri: quotedPreview.imageUrls[0] }}
                      style={styles.quoteThumb}
                      contentFit="cover"
                    />
                  </View>
                ) : null}
              </View>
            </Pressable>
          ) : (
            <Typography style={{ color: colors.textSecondary }}>{t('composer_quote_hint')}</Typography>
          )}
        </View>
      )}

      {pollEnabled && !threadOpen && !quotedPostId && (
        <View style={[styles.pollBox, { borderColor: colors.border }]}>
          <Typography weight="semibold" style={{ color: colors.textSecondary, marginBottom: 10 }}>
            Səsvermə
          </Typography>

          <View style={styles.pollOptions}>
            {pollOptions.map((opt, idx) => (
              <View key={idx} style={[styles.pollOptionRow, { borderColor: colors.border }]}>
                <Typography style={{ color: colors.textTertiary, width: 22, textAlign: 'center' }}>
                  {idx + 1}
                </Typography>
                <TextInput
                  style={[styles.pollInput, { color: colors.text }]}
                  placeholder={`Seçim ${idx + 1}`}
                  value={opt}
                  placeholderTextColor={colors.textTertiary}
                  onChangeText={t => {
                    setPollOptions(prev => {
                      const next = [...prev]
                      next[idx] = t
                      return next
                    })
                  }}
                  maxLength={60}
                />
                {pollOptions.length > 2 && (
                  <Pressable
                    style={styles.pollRemove}
                    onPress={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <Feather name="x" size={14} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          <View style={styles.pollFooter}>
            {pollOptions.length < 4 && (
              <Pressable
                style={[styles.pollAddBtn, { borderColor: colors.border }]}
                onPress={() => setPollOptions(prev => [...prev, ''])}
              >
                <Feather name="plus" size={16} color={Colors.brand} />
                <Typography style={{ color: Colors.brand, fontWeight: '600' }}>
                  Seçim əlavə et
                </Typography>
              </Pressable>
            )}

            <View style={styles.durationRow}>
              {[24, 72, 168].map(h => (
                <Pressable
                  key={h}
                  onPress={() => setPollDurationHours(h)}
                  style={[
                    styles.durationChip,
                    {
                      borderColor: h === pollDurationHours ? Colors.brand : colors.border,
                      backgroundColor:
                        h === pollDurationHours ? 'rgba(74,216,96,0.12)' : 'transparent',
                    },
                  ]}
                >
                  <Typography style={{ color: h === pollDurationHours ? Colors.brand : colors.textTertiary }}>
                    {h === 24 ? '1 Gün' : h === 72 ? '3 Gün' : '1 Həftə'}
                  </Typography>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Mention Suggestions */}
      <Modal visible={mentionOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMentionOpen(false)}>
          <View style={[styles.mentionBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {mentionLoading ? (
              <View style={styles.mentionLoading}>
                <ActivityIndicator size="small" color={Colors.brand} />
                <Typography style={{ color: colors.textSecondary, marginTop: 10 }}>Axtarılır...</Typography>
              </View>
            ) : mentionSuggestions.length > 0 ? (
              <ScrollView style={{ maxHeight: 260 }}>
                {mentionSuggestions.map(s => (
                  <Pressable
                    key={s.id}
                    onPress={() => applyMention(s)}
                    style={[styles.mentionItem, { borderBottomColor: colors.border }]}
                  >
                    <Typography weight="semibold" style={{ color: colors.text }}>
                      @{s.username}
                    </Typography>
                    {!!s.full_name && (
                      <Typography style={{ color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
                        {s.full_name}
                      </Typography>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.mentionEmpty}>
                <Typography style={{ color: colors.textTertiary }}>Nəticə tapılmadı</Typography>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Thread Modal */}
      <Modal visible={threadOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setThreadOpen(false)}>
          <View style={[styles.threadBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <View style={styles.threadHeader}>
              <Typography weight="bold" style={{ color: colors.text }}>
                Ardlar (Threads)
              </Typography>
              <Pressable onPress={() => setThreadOpen(false)} style={styles.modalClose}>
                <Feather name="x" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>

            <ScrollView style={styles.threadBody} keyboardShouldPersistTaps="handled">
              {threadDrafts.map((d, idx) => (
                <View key={idx} style={[styles.threadDraftRow, { borderColor: colors.border }]}>
                  <Typography style={{ color: colors.textTertiary, width: 22, textAlign: 'center' }}>
                    {idx + 1}
                  </Typography>
                  <TextInput
                    style={[styles.threadInput, { color: colors.text }]}
                    placeholder={`Paylaşım ${idx + 1}`}
                    value={d}
                    placeholderTextColor={colors.textTertiary}
                    onChangeText={t => {
                      setThreadDrafts(prev => {
                        const next = [...prev]
                        next[idx] = t
                        return next
                      })
                    }}
                    multiline
                    maxLength={500}
                  />
                  {threadDrafts.length > 2 && (
                    <Pressable style={styles.threadRemove} onPress={() => setThreadDrafts(prev => prev.filter((_, i) => i !== idx))}>
                      <Feather name="x" size={14} color={colors.textTertiary} />
                    </Pressable>
                  )}
                </View>
              ))}

              {threadDrafts.length < 4 && (
                <Pressable style={[styles.threadAddBtn, { borderColor: colors.border }]} onPress={() => setThreadDrafts(prev => [...prev, ''])}>
                  <Feather name="plus" size={16} color={Colors.brand} />
                  <Typography style={{ color: Colors.brand, fontWeight: '600' }}>Yeni paylaşım</Typography>
                </Pressable>
              )}
            </ScrollView>

            <View style={styles.threadFooter}>
              <Button
                label={threadSubmitting ? '...' : 'Ardları paylaş'}
                fullWidth
                onPress={submitThread}
                disabled={threadSubmitting || threadDrafts.every(d => !d.trim())}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </GlassSurface>
  )
}

const styles = StyleSheet.create({
  quotePreviewWrap: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  quotePreviewCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  quoteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  quoteMediaFrame: {
    marginTop: Spacing.sm,
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.35)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  quoteThumb: {
    width: '100%',
    height: '100%',
  },
  composer: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: BorderRadius.lg,
  },
  input: {
    fontSize: 16,
    minHeight: 52,
    maxHeight: 92,
    paddingVertical: 4,
  },
  suggestionBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  suggestionLeftIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bottomIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBtn: {
    width: 44,
    height: 38,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    height: 42,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  imageRow: {
    paddingTop: 12,
    paddingBottom: 6,
    paddingLeft: 4,
  },
  imageThumbWrap: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 10,
    position: 'relative',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  imageRemove: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollBox: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  pollOptions: {
    marginTop: 4,
  },
  pollOptionRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pollInput: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pollRemove: {
    padding: 4,
  },
  pollFooter: {
    marginTop: 8,
  },
  pollAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  mentionBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    padding: 10,
  },
  mentionLoading: {
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionEmpty: {
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  threadBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  threadHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
  },
  modalClose: {
    padding: 8,
    borderRadius: 9999,
  },
  threadBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 420,
  },
  threadDraftRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  threadInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 160,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  threadRemove: {
    padding: 4,
    marginTop: 6,
  },
  threadAddBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 10,
  },
  threadFooter: {
    padding: 14,
    borderTopWidth: 1,
  },
})

