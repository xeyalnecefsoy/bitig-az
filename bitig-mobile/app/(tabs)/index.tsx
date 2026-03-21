import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Linking,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Typography } from '@/components/ui/Typography'
import { AppHeader } from '@/components/AppHeader'
import { LibraryContent } from '@/components/LibraryContent'
import { Feather } from '@expo/vector-icons'
import { useLocale } from '@/context/locale'

const BITIG_BASE_URL = 'https://bitig.az'

function resolveCover(cover?: string | null, coverUrl?: string | null) {
  const src = cover || coverUrl
  if (!src) return `${BITIG_BASE_URL}/logo.png`
  if (src.startsWith('http')) return src
  return `${BITIG_BASE_URL}${src}`
}

function getDiscoverGridLayout(width: number) {
  const paddingHoriz = Spacing.lg
  const gap = Spacing.md
  const usable = width - paddingHoriz * 2
  let numColumns = 2
  if (width >= 900) numColumns = 4
  else if (width >= 600) numColumns = 3
  const cardWidth = (usable - gap * (numColumns - 1)) / numColumns
  return { numColumns, cardWidth, gap, paddingHoriz }
}

function voiceTypeToI18nKey(voiceType: string | null | undefined): string {
  if (voiceType === 'multiple') return 'voice_multiple'
  if (voiceType === 'radio_theater') return 'voice_radio_theater'
  return 'voice_single'
}

interface Book {
  id: string
  title: string
  author: string
  cover: string | null
  cover_url?: string | null
  genre: string | null
  price: number
  length?: string | null
  rating?: number | null
  voice_type?: string | null
}

export default function HomeScreen() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'discover' | 'library'>('discover')
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()
  const { t, locale } = useLocale()
  const { width } = useWindowDimensions()
  const { numColumns, cardWidth, gap, paddingHoriz } = useMemo(
    () => getDiscoverGridLayout(width),
    [width]
  )

  useEffect(() => {
    loadBooks()
  }, [])

  async function loadBooks() {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover, cover_url, genre, price, length, rating, voice_type')
      .order('title')

    if (error) {
      console.warn('[Kitablar] loadBooks error:', error.message)
      setBooks([])
    } else if (data && Array.isArray(data)) {
      setBooks(data as Book[])
    } else {
      setBooks([])
    }
    setLoading(false)
  }

  const filteredBooks = useMemo(() => {
    if (!search) return books
    const q = search.toLowerCase()
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.genre && b.genre.toLowerCase().includes(q))
    )
  }, [books, search])

  const voiceLabel = (voiceType: string | null | undefined) => t(voiceTypeToI18nKey(voiceType))

  if (activeTab === 'library') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader />
        <View style={[styles.section, { paddingHorizontal: paddingHoriz }]}>
          <Typography weight="bold" style={[styles.pageTitle, { color: colors.text }]}>
            {t('nav_audiobooks')}
          </Typography>
          <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
            <Pressable style={styles.tab} onPress={() => setActiveTab('discover')}>
              <Feather name="search" size={16} color={colors.textSecondary} />
              <Typography weight="semibold" style={[styles.tabLabel, { color: colors.textSecondary }]}>
                {t('nav_discover')}
              </Typography>
            </Pressable>
            <Pressable
              style={[styles.tab, { backgroundColor: colors.surfaceHover }]}
              onPress={() => setActiveTab('library')}
            >
              <Feather name="book" size={16} color={Colors.brand} />
              <Typography weight="semibold" style={[styles.tabLabel, { color: Colors.brand }]}>
                {t('nav_library')}
              </Typography>
            </Pressable>
          </View>
        </View>
        <View style={styles.libraryWrap}>
          <LibraryContent />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />
      <View style={[styles.section, { paddingHorizontal: paddingHoriz }]}>
        <Typography weight="bold" style={[styles.pageTitle, { color: colors.text }]}>
          {t('nav_audiobooks')}
        </Typography>
        <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
          <Pressable
            style={[styles.tab, { backgroundColor: colors.surfaceHover }]}
            onPress={() => setActiveTab('discover')}
          >
            <Feather name="search" size={16} color={Colors.brand} />
            <Typography weight="semibold" style={[styles.tabLabel, { color: Colors.brand }]}>
              {t('nav_discover')}
            </Typography>
          </Pressable>
          <Pressable style={styles.tab} onPress={() => setActiveTab('library')}>
            <Feather name="book" size={16} color={colors.textSecondary} />
            <Typography weight="semibold" style={[styles.tabLabel, { color: colors.textSecondary }]}>
              {t('nav_library')}
            </Typography>
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Input
            leftIcon="search"
            rightIcon="sliders"
            onRightIconPress={() => {}}
            placeholder={t('search_placeholder')}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={{ height: 48 }}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          key={`discover-${numColumns}`}
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          style={styles.list}
          columnWrapperStyle={[styles.columnWrapper, { marginHorizontal: paddingHoriz, gap }]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={numColumns}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.bookCard, { width: cardWidth }]}
              onPress={() => router.push(`/book/${item.id}` as any)}
            >
              <Image
                source={resolveCover(item.cover, item.cover_url)}
                style={[styles.cover, { width: cardWidth, height: cardWidth * 1.5 }]}
                contentFit="cover"
                transition={200}
              />
              <Typography
                weight="bold"
                style={[styles.bookTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.title}
              </Typography>
              <Typography
                style={[styles.bookAuthor, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.author}
              </Typography>
              <View style={styles.metaRow}>
                <Typography
                  weight="bold"
                  style={{ color: item.price === 0 ? Colors.success : Colors.brand, fontSize: FontSize.sm }}
                >
                  {item.price === 0 ? t('free') : `${Number(item.price).toFixed(2)} ₼`}
                </Typography>
                <View style={styles.ratingRow}>
                  <Typography style={styles.star}>★</Typography>
                  <Typography
                    weight="semibold"
                    style={[styles.ratingText, { color: colors.text }]}
                  >
                    {item.rating != null ? item.rating.toFixed(1) : '—'}
                  </Typography>
                </View>
              </View>
              <View style={styles.voiceRow}>
                <View style={[styles.voiceBtn, { backgroundColor: colors.surface }]}>
                  <Feather name="mic" size={12} color={colors.textSecondary} />
                  <Typography style={[styles.voiceLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                    {voiceLabel(item.voice_type)}
                  </Typography>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.cartBtn, { opacity: pressed ? 0.9 : 1 }]}
                onPress={(e) => {
                  e.stopPropagation()
                  Linking.openURL(`${BITIG_BASE_URL}/${locale}/audiobooks/${item.id}`)
                }}
              >
                <Typography weight="semibold" style={styles.cartBtnLabel}>
                  {t('add_to_cart')}
                </Typography>
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typography style={[styles.emptyText, { color: colors.textSecondary }]}>
                {search ? t('no_results') : t('mobile_no_books')}
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
  section: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: 26,
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  tabLabel: {
    fontSize: FontSize.sm,
  },
  searchWrap: {
    marginBottom: Spacing.sm,
  },
  libraryWrap: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing['2xl'],
  },
  columnWrapper: {
    marginBottom: Spacing.lg,
  },
  bookCard: {
    alignItems: 'flex-start',
  },
  cover: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  bookTitle: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    color: '#EAB308',
    fontSize: 12,
  },
  ratingText: {
    fontSize: FontSize.xs,
  },
  voiceRow: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
  },
  voiceLabel: {
    fontSize: FontSize.xs,
    flex: 1,
  },
  cartBtn: {
    width: '100%',
    marginTop: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnLabel: {
    fontSize: FontSize.sm,
    color: '#06140A',
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
