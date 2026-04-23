import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { Feather } from '@expo/vector-icons'
import { Button } from '@/components/ui/Button'
import { Typography } from '@/components/ui/Typography'
import { GuestCallout } from '@/components/ui/GuestCallout'

const BITIG_BASE_URL = 'https://bitig.az'

function resolveCover(cover?: string | null, coverUrl?: string | null) {
  const src = cover || coverUrl
  if (!src) return `${BITIG_BASE_URL}/logo.png`
  if (src.startsWith('http')) return src
  return `${BITIG_BASE_URL}${src}`
}

export interface UserBookItem {
  id: string
  book_id: string
  status: string
  books: {
    id: string
    title: string
    author: string
    cover: string | null
    price: number
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  all: 'Hamısı',
  reading: 'Oxuyuram',
  completed: 'Bitirdim',
  want_to_read: 'Oxumaq istəyirəm',
}

export function LibraryContent() {
  const [userBooks, setUserBooks] = useState<UserBookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const { user } = useAuth()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  useEffect(() => {
    if (user) loadUserBooks()
    else setLoading(false)
  }, [user])

  async function loadUserBooks() {
    if (!user) return
    const { data } = await supabase
      .from('user_books')
      .select('id, book_id, status, books:book_id (id, title, author, cover, price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setUserBooks(data as unknown as UserBookItem[])
    setLoading(false)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadUserBooks()
    setRefreshing(false)
  }, [user])

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.guestWrap}>
          <GuestCallout
            icon="lock"
            title="Dinləmək üçün daxil olun"
            subtitle="Tam səsli kitabları dinləmək üçün hesab lazımdır."
            actionLabel="Daxil ol"
            onPress={() => router.push('/login' as any)}
          />
        </View>
      </View>
    )
  }

  const filtered = filter === 'all' ? userBooks : userBooks.filter((b) => b.status === filter)

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.filterTab, filter === key && { borderBottomColor: Colors.brand, borderBottomWidth: 2 }]}
            onPress={() => setFilter(key)}
          >
            <Typography
              style={[styles.filterLabel, { color: filter === key ? Colors.brand : colors.textTertiary }]}
            >
              {label}
            </Typography>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.bookRow, { borderBottomColor: colors.borderLight }]}
              onPress={() => router.push(`/book/${item.book_id}` as any)}
            >
              <Image
                source={resolveCover(item.books?.cover ?? null, (item.books as any)?.cover_url ?? null)}
                style={styles.bookCover}
                contentFit="cover"
              />
              <View style={styles.bookInfo}>
                <Typography weight="semibold" style={[styles.bookTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.books?.title || 'Bilinməyən'}
                </Typography>
                <Typography style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.books?.author}
                </Typography>
                <Typography
                  style={[
                    styles.statusBadge,
                    {
                      color:
                        item.status === 'completed'
                          ? Colors.success
                          : item.status === 'reading'
                            ? Colors.brand
                            : colors.textTertiary,
                    },
                  ]}
                >
                  {STATUS_LABELS[item.status] || item.status}
                </Typography>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={[styles.centered, { paddingTop: 80 }]}>
              <Feather name="book-open" size={44} color={colors.textTertiary} style={{ marginBottom: Spacing.md }} />
              <Typography style={[{ color: colors.textSecondary, fontSize: FontSize.md }]}>
                Kitabxananız boşdur
              </Typography>
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
  guestWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  listContent: { paddingBottom: 20 },
  bookRow: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 0.5,
  },
  bookCover: {
    width: 50,
    height: 75,
    borderRadius: BorderRadius.sm,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: { fontSize: FontSize.md },
  bookAuthor: { fontSize: FontSize.sm, marginTop: 2 },
  statusBadge: { fontSize: FontSize.xs, fontWeight: '600', marginTop: Spacing.sm },
})
