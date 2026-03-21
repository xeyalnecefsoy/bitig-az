import React, { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import type { Book, BookTrack } from '@/lib/types'
import { Feather } from '@expo/vector-icons'
import { Typography } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { AudiobookPlayer } from '@/components/audiobook/AudiobookPlayer'
import { MobileBookActions } from '@/components/audiobook/MobileBookActions'
import { useAuth } from '@/context/auth'
import { useCart } from '@/context/cart'
import {
  translateGenreAz,
  translateVoiceType,
  formatDurationFromSeconds,
} from '@/lib/translateBookLabels'

const BITIG_BASE_URL = 'https://bitig.az'

export function resolveCover(cover?: string | null, coverUrl?: string | null) {
  const src = cover || coverUrl
  if (!src) return `${BITIG_BASE_URL}/logo.png`
  if (src.startsWith('http')) return src
  return `${BITIG_BASE_URL}${src}`
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [tracks, setTracks] = useState<BookTrack[]>([])
  const [loading, setLoading] = useState(true)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const { user } = useAuth()
  const { add: addToCart } = useCart()
  const router = useRouter()

  useEffect(() => {
    if (id) loadBook()
  }, [id])

  async function loadBook() {
    const { data: bookData } = await supabase.from('books').select('*').eq('id', id).single()

    if (bookData) setBook(bookData as Book)

    const { data: trackData } = await supabase
      .from('book_tracks')
      .select('*')
      .eq('book_id', id)
      .order('position', { ascending: true })

    if (trackData) setTracks(trackData as BookTrack[])
    setLoading(false)
  }

  const lengthLabel = (b: Book) => {
    if (b.length && String(b.length).trim()) return b.length
    return formatDurationFromSeconds(b.duration)
  }

  const handleAddToCart = () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!book) return
    addToCart(book.id)
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  if (!book) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Typography style={{ color: colors.textSecondary, fontSize: FontSize.md }}>Kitab tapılmadı</Typography>
      </View>
    )
  }

  const genreLabel = book.genre ? translateGenreAz(book.genre) : ''
  const voiceLabel = translateVoiceType(book.voice_type)

  const showPlayerBlock = Boolean(user && tracks.length > 0)

  const priceBlock = (variant: 'hero' | 'abovePlayer') => (
    <View style={[styles.priceRow, variant === 'hero' ? styles.priceRowHero : styles.priceRowAbovePlayer]}>
      {book.price === 0 ? (
        <Typography weight="bold" style={[styles.priceHero, { color: Colors.success }]}>
          Pulsuz
        </Typography>
      ) : (
        <>
          {book.original_price != null && book.original_price > book.price ? (
            <>
              <Typography style={[styles.originalPrice, { color: colors.textTertiary }]}>
                {book.original_price} ₼
              </Typography>
              <Typography weight="bold" style={[styles.priceHero, { color: Colors.brand }]}>
                {book.price} ₼
              </Typography>
              <View style={styles.discountPill}>
                <Typography style={{ color: '#fff', fontSize: FontSize.xs }} weight="bold">
                  {Math.round(((book.original_price - book.price) / book.original_price) * 100)}% endirim
                </Typography>
              </View>
            </>
          ) : (
            <Typography weight="bold" style={[styles.priceHero, { color: Colors.brand }]}>
              {book.price} ₼
            </Typography>
          )}
        </>
      )}
    </View>
  )

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Image
          source={resolveCover(book.cover, book.cover_url ?? null)}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.info}>
          {genreLabel ? (
            <Typography weight="semibold" style={[styles.genre, { color: Colors.brand }]}>
              {genreLabel}
            </Typography>
          ) : null}
          <Typography weight="bold" style={[styles.title, { color: colors.text }]}>
            {book.title}
          </Typography>
          <Typography style={[styles.author, { color: colors.textSecondary }]}>{book.author}</Typography>

          <View style={styles.metaRow}>
            {book.rating != null && (
              <View style={styles.ratingContainer}>
                <Feather name="star" size={14} color="#f59e0b" />
                <Typography weight="semibold" style={[styles.ratingText, { color: colors.text }]}>
                  {book.rating.toFixed(1)}
                </Typography>
              </View>
            )}
            {lengthLabel(book) ? (
              <View style={styles.metaWithIcon}>
                <Feather name="clock" size={12} color={colors.textTertiary} />
                <Typography style={[styles.duration, { color: colors.textTertiary }]}>{lengthLabel(book)}</Typography>
              </View>
            ) : null}
          </View>

          <View style={styles.badgeRow}>
            {voiceLabel ? (
              <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                <Typography style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>{voiceLabel}</Typography>
              </View>
            ) : null}
            {book.has_ambience ? (
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
                <Typography style={{ color: isDark ? '#fcd34d' : '#b45309', fontSize: FontSize.xs }}>🍃 Mühiti</Typography>
              </View>
            ) : null}
            {book.has_sound_effects ? (
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.15)' }]}>
                <Typography style={{ color: isDark ? '#d8b4fe' : '#7e22ce', fontSize: FontSize.xs }}>🔊 Effektlər</Typography>
              </View>
            ) : null}
          </View>

          {!showPlayerBlock ? priceBlock('hero') : null}
        </View>
      </View>

      {showPlayerBlock ? (
        <View style={[styles.playerSection, { paddingHorizontal: Spacing.lg }]}>
          {priceBlock('abovePlayer')}
          <AudiobookPlayer book={book} tracks={tracks} resolveCover={resolveCover} />
        </View>
      ) : null}

      {!user ? (
        <View style={[styles.locked, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={[styles.lockIcon, { backgroundColor: colors.background }]}>
            <Feather name="lock" size={24} color={colors.textTertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography weight="semibold" style={{ color: colors.text }}>
              Dinləmək üçün daxil olun
            </Typography>
            <Typography style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 }}>
              Audiokitabı dinləmək üçün hesab lazımdır.
            </Typography>
          </View>
          <Button label="Daxil ol" onPress={() => router.push('/login')} />
        </View>
      ) : null}

      {book.description ? (
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Typography style={[styles.description, { color: colors.text }]}>{book.description}</Typography>
        </View>
      ) : null}

      <View style={[styles.section, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleAddToCart}
          style={({ pressed }) => [
            styles.cartBtn,
            { backgroundColor: Colors.brand, opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
        >
          <Feather name="shopping-cart" size={18} color="#06140A" />
          <Typography weight="semibold" style={{ color: '#06140A' }}>
            Səbətə at
          </Typography>
        </Pressable>
      </View>

      <View style={[styles.section, { paddingTop: 0 }]}>
        <MobileBookActions bookId={book.id} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  cover: {
    width: 140,
    height: 210,
    borderRadius: BorderRadius.lg,
  },
  info: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  genre: {
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  title: {
    fontSize: FontSize['2xl'],
    lineHeight: 28,
  },
  author: {
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  metaWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: { fontSize: FontSize.sm },
  duration: { fontSize: FontSize.xs },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  playerSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  priceRowHero: {
    marginTop: Spacing.md,
  },
  priceRowAbovePlayer: {
    marginBottom: Spacing.sm,
  },
  priceHero: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  price: {
    fontSize: FontSize.xl,
  },
  originalPrice: {
    fontSize: FontSize.md,
    textDecorationLine: 'line-through',
  },
  discountPill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
})
