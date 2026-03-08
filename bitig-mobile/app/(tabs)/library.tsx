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

interface UserBookItem {
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

export default function LibraryScreen() {
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
    const { data } = await supabase
      .from('user_books')
      .select('id, book_id, status, books:book_id (id, title, author, cover, price)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (data) setUserBooks(data as any)
    setLoading(false)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadUserBooks()
    setRefreshing(false)
  }, [user])

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>📖</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Kitabxanınız</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Daxil olun ki, kitablarınızı görəsiniz
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

  const filtered = filter === 'all' ? userBooks : userBooks.filter(b => b.status === filter)

  const statusLabels: Record<string, string> = {
    all: 'Hamısı',
    reading: 'Oxuyuram',
    completed: 'Bitirdim',
    want_to_read: 'Oxumaq istəyirəm',
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {Object.entries(statusLabels).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.filterTab, filter === key && { borderBottomColor: Colors.brand, borderBottomWidth: 2 }]}
            onPress={() => setFilter(key)}
          >
            <Text style={[
              styles.filterLabel,
              { color: filter === key ? Colors.brand : colors.textTertiary }
            ]}>
              {label}
            </Text>
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
          keyExtractor={item => item.id}
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
                source={item.books?.cover || 'https://placehold.co/60x90/1a1a1a/666?text=📚'}
                style={styles.bookCover}
                contentFit="cover"
              />
              <View style={styles.bookInfo}>
                <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.books?.title || 'Bilinməyən'}
                </Text>
                <Text style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.books?.author}
                </Text>
                <Text style={[styles.statusBadge, {
                  color: item.status === 'completed' ? Colors.success :
                    item.status === 'reading' ? Colors.brand : colors.textTertiary
                }]}>
                  {statusLabels[item.status] || item.status}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={[styles.centered, { paddingTop: 80 }]}>
              <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>📚</Text>
              <Text style={[{ color: colors.textSecondary, fontSize: FontSize.md }]}>
                Kitabxananız boşdur
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
  bookTitle: { fontSize: FontSize.md, fontWeight: '600' },
  bookAuthor: { fontSize: FontSize.sm, marginTop: 2 },
  statusBadge: { fontSize: FontSize.xs, fontWeight: '600', marginTop: Spacing.sm },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing['3xl'] },
  loginBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['4xl'],
    borderRadius: BorderRadius.lg,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
})
