import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useSocial } from '@/context/social'
import { useLocale } from '@/context/locale'
import type { User } from '@/lib/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isCommentEdited, type CommentThread } from '@/lib/commentTree'

export function socialCommentTimeAgo(date: string) {
  const now = Date.now()
  const created = new Date(date).getTime()
  const diffSec = Math.max(0, Math.floor((now - created) / 1000))
  if (diffSec < 60) return 'indicə'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dəq əvvəl`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat əvvəl`
  return new Date(date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })
}

type ThemeColors = (typeof Colors)['dark']

type RowProps = {
  thread: CommentThread
  postId: string
  postOwnerId: string
  users: User[]
  colors: ThemeColors
  variant: 'detail' | 'feed'
  depth: number
  onReply: (commentId: string, username: string) => void
}

type ThreadBlockProps = RowProps & {
  /** When false, nested replies are not rendered (feed preview). */
  showReplies?: boolean
}

const COMMENT_MENU_WIDTH = 222
const COMMENT_MENU_ROW_H = 46
const COMMENT_MENU_PAD = 10

type AnchorRect = { x: number; y: number; w: number; h: number }

function computeMenuPosition(
  anchor: AnchorRect,
  rowCount: number,
  winW: number,
  winH: number,
  insets: { top: number; bottom: number; left: number; right: number },
): { top: number; left: number; height: number } {
  const estH = rowCount * COMMENT_MENU_ROW_H + COMMENT_MENU_PAD
  const pad = 8
  let left = anchor.x + anchor.w - COMMENT_MENU_WIDTH
  left = Math.max(pad + insets.left, Math.min(left, winW - COMMENT_MENU_WIDTH - pad - insets.right))

  let top = anchor.y + anchor.h + 6
  const bottomSpace = winH - insets.bottom - pad
  if (top + estH > bottomSpace) {
    top = anchor.y - estH - 6
  }
  if (top < insets.top + pad) {
    top = insets.top + pad
  }
  return { top, left, height: estH }
}

function CommentRowInner({
  thread,
  postId,
  postOwnerId,
  users,
  colors,
  variant,
  depth,
  onReply,
}: RowProps) {
  const { t } = useLocale()
  const insets = useSafeAreaInsets()
  const { width: winW, height: winH } = useWindowDimensions()
  const moreAnchorRef = useRef<View>(null)
  const { currentUser, likeComment, editComment, deleteComment } = useSocial()
  const u = users.find(x => x.id === thread.userId)
  const displayName = u?.name || u?.username || 'İstifadəçi'
  const handle = u?.username || 'user'

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(thread.content)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null)

  useEffect(() => {
    setEditContent(thread.content)
  }, [thread.content])

  const isPending = thread.id.startsWith('__pending_')
  const isOwner = currentUser?.id === thread.userId
  const isPostOwner = currentUser?.id === postOwnerId
  const canDelete = !isPending && (isOwner || isPostOwner)
  const canEdit = !isPending && isOwner
  const avatarSize = variant === 'feed' ? 32 : 36
  const compact = variant === 'feed'

  /** Alert while a Modal is open fails on many Android builds; close menu first. */
  const confirmDelete = () => {
    Alert.alert(t('confirm_delete_comment'), t('confirm_delete_comment_desc'), [
      { text: t('cancel_btn'), style: 'cancel' },
      {
        text: t('confirm_btn'),
        style: 'destructive',
        onPress: () => void deleteComment(thread.id, postId, postOwnerId),
      },
    ])
  }

  const menuRowCount = 1 + (canEdit ? 1 : 0) + (canDelete ? 1 : 0)
  const replyRowIsLast = !canEdit && !canDelete
  const editRowIsLast = canEdit && !canDelete

  const menuPlacement = useMemo(() => {
    if (!menuAnchor) return null
    return computeMenuPosition(menuAnchor, menuRowCount, winW, winH, insets)
  }, [menuAnchor, menuRowCount, winW, winH, insets])

  const openMoreMenu = () => {
    requestAnimationFrame(() => {
      moreAnchorRef.current?.measureInWindow((x, y, width, height) => {
        if (width <= 0 && height <= 0) return
        setMenuAnchor({ x, y, w: width, h: height })
        setMoreMenuOpen(true)
      })
    })
  }

  const closeMoreMenu = () => {
    setMoreMenuOpen(false)
    setMenuAnchor(null)
  }

  const closeMoreMenuThen = (fn: () => void) => {
    closeMoreMenu()
    setTimeout(fn, 220)
  }

  const saveEdit = async () => {
    const next = editContent.trim()
    if (!next || next === thread.content) {
      setIsEditing(false)
      setEditContent(thread.content)
      return
    }
    await editComment(thread.id, postId, next)
    setIsEditing(false)
  }

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowFeed,
        {
          borderBottomColor: colors.border,
          marginLeft: depth > 0 ? 6 : 0,
          borderLeftWidth: depth > 0 ? 2 : 0,
          borderLeftColor: depth > 0 ? colors.border : 'transparent',
          paddingLeft: depth > 0 ? 10 : compact ? Spacing.sm : Spacing.lg,
        },
      ]}
    >
      <View style={[styles.avatarWrap, { width: avatarSize, height: avatarSize }]}>
        <UserAvatar
          avatarUrl={u?.avatar ?? null}
          usernameOrId={u?.username ?? thread.userId}
          size={avatarSize}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.nameCol}>
            <Typography weight="semibold" style={{ color: colors.text, fontSize: compact ? FontSize.sm : FontSize.md }} numberOfLines={1}>
              {displayName}
            </Typography>
          </View>
          <View style={styles.metaRight}>
            <Typography style={{ color: colors.textTertiary, fontSize: FontSize.xs }} numberOfLines={2}>
              {socialCommentTimeAgo(thread.createdAt)}
              {isCommentEdited(thread.createdAt, thread.updatedAt) ? ` (${t('edited')})` : ''}
            </Typography>
            <View ref={moreAnchorRef} collapsable={false} style={styles.moreBtnWrap}>
              <Pressable
                onPress={openMoreMenu}
                hitSlop={12}
                style={styles.moreBtn}
                accessibilityRole="button"
                accessibilityLabel={t('more_options')}
              >
                <Feather name="more-horizontal" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>
          </View>
        </View>

        <Modal visible={moreMenuOpen} transparent animationType="fade" onRequestClose={closeMoreMenu}>
          <View style={styles.popoverModalRoot} pointerEvents="box-none">
            <Pressable style={styles.moreModalBackdrop} onPress={closeMoreMenu} accessibilityRole="button" accessibilityLabel={t('cancel_btn')} />
            {menuPlacement ? (
              <View
                style={[
                  styles.popoverCard,
                  {
                    top: menuPlacement.top,
                    left: menuPlacement.left,
                    width: COMMENT_MENU_WIDTH,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.35,
                      shadowRadius: 16,
                    },
                    android: { elevation: 12 },
                    default: {},
                  }),
                ]}
                pointerEvents="box-none"
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.popoverRow,
                    replyRowIsLast && styles.popoverRowLast,
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => {
                    closeMoreMenuThen(() => onReply(thread.id, handle))
                  }}
                >
                  <Feather name="corner-up-left" size={18} color={colors.text} style={styles.popoverIcon} />
                  <Typography style={{ color: colors.text, fontSize: FontSize.sm }}>{t('reply')}</Typography>
                </Pressable>
                {canEdit ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.popoverRow,
                      editRowIsLast && styles.popoverRowLast,
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => {
                      closeMoreMenuThen(() => setIsEditing(true))
                    }}
                  >
                    <Feather name="edit-2" size={18} color={colors.text} style={styles.popoverIcon} />
                    <Typography style={{ color: colors.text, fontSize: FontSize.sm }}>{t('social_comment_edit')}</Typography>
                  </Pressable>
                ) : null}
                {canDelete ? (
                  <Pressable
                    style={({ pressed }) => [styles.popoverRow, styles.popoverRowLast, pressed && { opacity: 0.75 }]}
                    onPress={() => {
                      closeMoreMenuThen(confirmDelete)
                    }}
                  >
                    <Feather name="trash-2" size={18} color="#ef4444" style={styles.popoverIcon} />
                    <Typography style={{ color: '#ef4444', fontSize: FontSize.sm }} weight="semibold">
                      {t('delete_comment')}
                    </Typography>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </Modal>

        {isEditing ? (
          <View style={styles.editBox}>
            <TextInput
              value={editContent}
              onChangeText={setEditContent}
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              multiline
              maxLength={500}
              autoFocus
            />
            <View style={styles.editActions}>
              <Pressable
                onPress={() => {
                  setIsEditing(false)
                  setEditContent(thread.content)
                }}
                style={styles.editBtn}
              >
                <Typography style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>{t('cancel_btn')}</Typography>
              </Pressable>
              <Pressable onPress={() => void saveEdit()} style={[styles.editBtnPrimary, { backgroundColor: Colors.brand }]}>
                <Typography weight="semibold" style={{ color: '#06140A', fontSize: FontSize.sm }}>
                  {t('save_btn')}
                </Typography>
              </Pressable>
            </View>
          </View>
        ) : (
          <Typography style={[styles.contentText, { color: colors.textSecondary }]}>
            {thread.content}
          </Typography>
        )}

        {!isEditing && (
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                if (!currentUser) {
                  Alert.alert('Bitig', t('social_sign_in_prompt'))
                  return
                }
                void likeComment(thread.id, postId)
              }}
              hitSlop={8}
              style={styles.actionHit}
            >
              <View style={styles.actionInner}>
                <Feather name="heart" size={compact ? 14 : 16} color={thread.likedByMe ? '#ef4444' : colors.textTertiary} />
                {(thread.likes ?? 0) > 0 && (
                  <Typography style={{ color: colors.textTertiary, fontSize: FontSize.xs }}>{thread.likes}</Typography>
                )}
              </View>
            </Pressable>
            <Pressable onPress={() => onReply(thread.id, handle)} hitSlop={8} style={styles.actionHit}>
              <Typography style={{ color: Colors.brand, fontSize: FontSize.xs }} weight="semibold">
                {t('reply')}
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

export function SocialCommentThreadBlock({
  thread,
  postId,
  postOwnerId,
  users,
  colors,
  variant,
  depth,
  onReply,
  showReplies = true,
}: ThreadBlockProps) {
  return (
    <View>
      <CommentRowInner
        thread={thread}
        postId={postId}
        postOwnerId={postOwnerId}
        users={users}
        colors={colors}
        variant={variant}
        depth={depth}
        onReply={onReply}
      />
      {showReplies &&
        thread.replies.map(r => (
          <SocialCommentThreadBlock
            key={r.id}
            thread={r}
            postId={postId}
            postOwnerId={postOwnerId}
            users={users}
            colors={colors}
            variant={variant}
            depth={depth + 1}
            onReply={onReply}
            showReplies
          />
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowFeed: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  avatarWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  moreBtnWrap: {
    alignSelf: 'flex-start',
  },
  moreBtn: {
    padding: 2,
    marginLeft: 4,
    zIndex: 2,
  },
  popoverModalRoot: {
    flex: 1,
  },
  moreModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  popoverCard: {
    position: 'absolute',
    zIndex: 2,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  popoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.22)',
  },
  popoverRowLast: {
    borderBottomWidth: 0,
  },
  popoverIcon: {
    width: 22,
  },
  contentText: {
    marginTop: 6,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 8,
  },
  actionHit: {
    paddingVertical: 4,
  },
  actionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBox: {
    marginTop: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 72,
    maxHeight: 160,
    fontSize: FontSize.sm,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  editBtnPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
  },
})
