import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { useAuth } from '@/context/auth'

type Props = {
  bookId: string
}

export function MobileBookActions({ bookId }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const [status, setStatus] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false
    async function loadStatus() {
      const { data } = await supabase
        .from('user_books')
        .select('status, is_favorite')
        .eq('user_id', user!.id)
        .eq('book_id', bookId)
        .maybeSingle()

      if (!cancelled && data) {
        setStatus(data.status)
        setIsFavorite(data.is_favorite ?? false)
      }
      if (!cancelled) setLoading(false)
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [bookId, user])

  const requireAuth = () => {
    if (!user) {
      router.push('/login')
      return false
    }
    return true
  }

  const toggleWantToRead = async () => {
    if (!requireAuth()) return

    const newStatus = status === 'want_to_read' ? null : 'want_to_read'
    setStatus(newStatus)

    const { error } = await supabase.from('user_books').upsert(
      {
        user_id: user!.id,
        book_id: bookId,
        status: newStatus,
        is_favorite: isFavorite,
      },
      { onConflict: 'user_id,book_id' }
    )

    if (error) {
      console.error(error)
      setStatus(status)
    }
  }

  const toggleFavorite = async () => {
    if (!requireAuth()) return

    const newFav = !isFavorite
    setIsFavorite(newFav)

    const { error } = await supabase.from('user_books').upsert(
      {
        user_id: user!.id,
        book_id: bookId,
        is_favorite: newFav,
        status: status ?? undefined,
      },
      { onConflict: 'user_id,book_id' }
    )

    if (error) {
      console.error(error)
      setIsFavorite(!newFav)
    }
  }

  if (loading && user) {
    return null
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggleWantToRead}
        style={({ pressed }) => [
          styles.wantBtn,
          {
            backgroundColor:
              status === 'want_to_read'
                ? isDark
                  ? 'rgba(59, 130, 246, 0.25)'
                  : 'rgba(59, 130, 246, 0.15)'
                : colors.surface,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        accessibilityRole="button"
      >
        <Feather
          name="bookmark"
          size={18}
          color={status === 'want_to_read' ? '#60a5fa' : colors.textSecondary}
        />
        <Typography
          weight="semibold"
          style={{
            color: status === 'want_to_read' ? '#60a5fa' : colors.text,
            fontSize: FontSize.sm,
          }}
        >
          {status === 'want_to_read' ? 'İstək siyahısındadır' : 'İstəyirəm'}
        </Typography>
      </Pressable>

      <Pressable
        onPress={toggleFavorite}
        style={({ pressed }) => [
          styles.iconOnly,
          {
            backgroundColor: colors.surface,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        accessibilityRole="button"
      >
        <Feather name="heart" size={22} color={isFavorite ? '#ef4444' : colors.textTertiary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  wantBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  iconOnly: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
  },
})
