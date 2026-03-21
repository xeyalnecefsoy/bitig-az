import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  useColorScheme,
  useWindowDimensions,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Typography } from '@/components/ui/Typography'
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors'
import { setPlayerHintImpl } from '@/lib/playerHintRegistry'

const AUTO_DISMISS_MS = 5500

/**
 * Uzun basım izahları — kiçik tooltip (veb və native); böyük modal yoxdur.
 */
export function PlayerHintOverlay() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()

  const [visible, setVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    setVisible(false)
  }, [])

  const show = useCallback((t: string, m: string) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setTitle(t)
    setMessage(m)
    setVisible(true)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      hideTimer.current = null
    }, AUTO_DISMISS_MS)
  }, [])

  useEffect(() => {
    setPlayerHintImpl(show)
    return () => {
      setPlayerHintImpl(null)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [show])

  const bubbleMax = Math.min(width - Spacing.md * 2, 300)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.modalRoot} pointerEvents="box-none">
        <Pressable
          style={styles.backdrop}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Bağla"
        />
        <View
          style={[
            styles.anchor,
            {
              paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.sm,
              paddingHorizontal: Spacing.md,
            },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: isDark ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
                maxWidth: bubbleMax,
              },
            ]}
          >
            <View style={styles.bubbleHeader}>
              <Typography
                weight="semibold"
                numberOfLines={2}
                style={{ color: colors.text, fontSize: FontSize.sm, flex: 1, paddingRight: Spacing.xs }}
              >
                {title}
              </Typography>
              <Pressable
                onPress={dismiss}
                hitSlop={10}
                style={styles.closeHit}
                accessibilityRole="button"
                accessibilityLabel="Bağla"
              >
                <Feather name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Typography
              style={{
                color: colors.textSecondary,
                fontSize: FontSize.xs,
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              {message}
            </Typography>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  /** Aşağıda, idarəetmələrə yaxın — kiçik “toast” kimi. */
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  closeHit: {
    padding: 2,
    marginTop: -2,
    marginRight: -2,
  },
})
