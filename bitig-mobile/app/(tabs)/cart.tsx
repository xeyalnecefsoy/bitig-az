import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { AppHeader } from '@/components/AppHeader'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/cart'
import { useLocale } from '@/context/locale'
import { Feather } from '@expo/vector-icons'

const BITIG_BASE_URL = 'https://bitig.az'

interface Book {
  id: string
  title: string
  author: string
  cover: string | null
  cover_url?: string | null
  price?: number
}

function resolveCover(cover?: string | null, coverUrl?: string | null) {
  const src = cover || coverUrl
  if (!src) return `${BITIG_BASE_URL}/logo.png`
  if (src.startsWith('http')) return src
  return `${BITIG_BASE_URL}${src}`
}

export default function CartScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()
  const { t } = useLocale()
  const { items, remove, count } = useCart()
  const [suggestions, setSuggestions] = useState<Book[]>([])
  const [cartBooks, setCartBooks] = useState<Book[]>([])
  const cardWidth = 128

  useEffect(() => {
    loadSuggestions()
  }, [])

  useEffect(() => {
    if (items.length === 0) {
      setCartBooks([])
      return
    }
    const ids = items.map((i) => i.id)
    supabase
      .from('books')
      .select('id, title, author, cover, cover_url, price')
      .in('id', ids)
      .then(({ data }) => {
        if (data) setCartBooks(data as Book[])
      })
  }, [items])

  async function loadSuggestions() {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover, cover_url')
      .order('title')
      .limit(8)
    if (!error && data?.length) {
      setSuggestions(data as Book[])
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sizə tövsiyə olunanlar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
              {t('recommended')}
            </Typography>
            <Typography style={[styles.swipeHint, { color: colors.textTertiary }]}>
              {t('swipe')}
            </Typography>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.recommendationsList, { paddingHorizontal: Spacing.lg }]}
          >
            {suggestions.map((book) => (
              <Pressable
                key={book.id}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } } as any)}
              >
                <View style={[styles.recommendationCard, { width: cardWidth }]}>
                  <Image
                    source={{ uri: resolveCover(book.cover, book.cover_url) }}
                    style={styles.recommendationCover}
                    contentFit="cover"
                  />
                  <Typography weight="semibold" style={[styles.recommendationTitle, { color: colors.text }]} numberOfLines={2}>
                    {book.title}
                  </Typography>
                  <Typography style={[styles.recommendationAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                    {book.author}
                  </Typography>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Səbət */}
        <View style={[styles.section, { paddingHorizontal: Spacing.lg }]}>
          <Typography weight="bold" style={[styles.cartTitle, { color: colors.text }]}>
            {t('nav_cart')} {count > 0 ? `(${count})` : ''}
          </Typography>
          {items.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Typography style={[styles.emptyText, { color: colors.text }]}>
                {t('cart_empty')}
              </Typography>
              <Pressable
                style={({ pressed }) => [
                  styles.browseBtn,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={() => router.replace('/(tabs)')}
              >
                <Typography weight="semibold" style={[styles.browseBtnLabel, { fontFamily: 'Inter_600SemiBold' }]}>
                  {t('browse_audiobooks')}
                </Typography>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {cartBooks.map((book) => {
                const qty = items.find((i) => i.id === book.id)?.qty ?? 1
                return (
                  <View
                    key={book.id}
                    style={[
                      styles.cartRow,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <Pressable
                      onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } } as any)}
                      style={styles.cartRowMain}
                    >
                      <Image
                        source={{ uri: resolveCover(book.cover, book.cover_url) }}
                        style={styles.cartThumb}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Typography weight="semibold" numberOfLines={2} style={{ color: colors.text }}>
                          {book.title}
                        </Typography>
                        <Typography numberOfLines={1} style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>
                          {book.author}
                        </Typography>
                        <Typography style={{ color: Colors.brand, marginTop: 4, fontSize: FontSize.sm }}>
                          {book.price === 0 ? t('free') : `${book.price} ₼`}
                          {qty > 1 ? ` × ${qty}` : ''}
                        </Typography>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => remove(book.id)}
                      style={styles.removeBtn}
                      accessibilityRole="button"
                      accessibilityLabel={t('delete')}
                    >
                      <Feather name="trash-2" size={20} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: Spacing['4xl'] },
  section: { marginBottom: Spacing['3xl'] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.xl },
  swipeHint: { fontSize: FontSize.sm },
  recommendationsList: { gap: Spacing.xl, paddingBottom: Spacing.lg },
  recommendationCard: { marginRight: Spacing.xl },
  recommendationCover: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
  },
  recommendationTitle: { fontSize: FontSize.sm, marginTop: Spacing.md },
  recommendationAuthor: { fontSize: FontSize.xs, marginTop: 4 },
  cartTitle: { fontSize: 26, marginBottom: Spacing.xl },
  emptyCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: FontSize.md, marginBottom: Spacing['2xl'] },
  browseBtn: {
    backgroundColor: Colors.brand,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: 8,
    alignSelf: 'center',
  },
  browseBtnLabel: { fontSize: FontSize.sm, color: '#06140A' },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cartRowMain: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  cartThumb: {
    width: 56,
    height: 84,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surface,
  },
  removeBtn: {
    padding: Spacing.lg,
  },
})
