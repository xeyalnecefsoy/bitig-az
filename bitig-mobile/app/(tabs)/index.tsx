import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'

interface Book {
  id: string
  title: string
  author: string
  cover: string | null
  genre: string | null
  price: number
  duration: number | null
}

export default function HomeScreen() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  useEffect(() => {
    loadBooks()
  }, [])

  async function loadBooks() {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover, genre, price, duration')
      .order('title')

    if (data) setBooks(data)
    setLoading(false)
  }

  const filteredBooks = search
    ? books.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
      )
    : books

  const renderBook = ({ item }: { item: Book }) => (
    <Pressable
      style={[styles.bookCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/book/${item.id}` as any)}
    >
      <Image
        source={item.cover || 'https://placehold.co/120x180/1a1a1a/666?text=📚'}
        style={styles.bookCover}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.author}
        </Text>
        <View style={styles.bookMeta}>
          <Text style={[styles.bookPrice, { color: item.price === 0 ? Colors.success : Colors.brand }]}>
            {item.price === 0 ? 'Pulsuz' : `${item.price} ₼`}
          </Text>
          {item.duration && (
            <Text style={[styles.bookDuration, { color: colors.textTertiary }]}>
              {Math.round(item.duration / 60)} dəq
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Kitab axtar..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Text style={[styles.clearButton, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBook}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search ? 'Nəticə tapılmadı' : 'Kitab yoxdur'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
  },
  clearButton: {
    fontSize: 16,
    padding: Spacing.xs,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  bookCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  bookCover: {
    width: 80,
    height: 120,
  },
  bookInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    lineHeight: 22,
  },
  bookAuthor: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  bookPrice: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  bookDuration: {
    fontSize: FontSize.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: FontSize.md,
  },
})
