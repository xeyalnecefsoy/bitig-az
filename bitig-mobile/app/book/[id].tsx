import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, useColorScheme, Pressable,
  ActivityIndicator, FlatList,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import type { Book, BookTrack } from '@/lib/types'
import { useAudio } from '@/context/audio'
import { MiniPlayer } from '@/components/MiniPlayer'

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [tracks, setTracks] = useState<BookTrack[]>([])
  const [loading, setLoading] = useState(true)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()
  const { playQueue, activeTrack, isPlaying, togglePlayback } = useAudio()

  useEffect(() => {
    if (id) loadBook()
  }, [id])

  async function loadBook() {
    const { data: bookData } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (bookData) setBook(bookData)

    const { data: trackData } = await supabase
      .from('book_tracks')
      .select('*')
      .eq('book_id', id)
      .order('track_number')

    if (trackData) setTracks(trackData)
    setLoading(false)
  }

  async function handlePlayTrack(index: number) {
    if (!book) return
    const queue = tracks.map(t => ({
      id: t.id,
      url: t.audio_url,
      title: t.title,
      artist: book.author,
      artwork: book.cover || 'https://bitig.az/logo.png',
      duration: t.duration,
    }))
    await playQueue(queue, index)
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
        <Text style={{ color: colors.textSecondary, fontSize: FontSize.md }}>Kitab tapılmadı</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Cover & Info */}
      <View style={styles.header}>
        <Image
          source={book.cover || 'https://placehold.co/200x300/1a1a1a/666?text=📚'}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>
          <Text style={[styles.author, { color: colors.textSecondary }]}>{book.author}</Text>
          
          <View style={styles.metaRow}>
            {book.rating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingIcon}>⭐</Text>
                <Text style={[styles.ratingText, { color: colors.text }]}>{book.rating.toFixed(1)}</Text>
              </View>
            )}
            {book.duration && (
              <Text style={[styles.duration, { color: colors.textTertiary }]}>
                {Math.floor(book.duration / 3600)}s {Math.floor((book.duration % 3600) / 60)}d
              </Text>
            )}
          </View>

          <Text style={[styles.price, { color: book.price === 0 ? Colors.success : Colors.brand }]}>
            {book.price === 0 ? 'Pulsuz' : `${book.price} ₼`}
          </Text>
        </View>
      </View>

      {/* Description */}
      {book.description && (
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Haqqında</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{book.description}</Text>
        </View>
      )}

      {/* Tracks */}
      {tracks.length > 0 && (
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Fəsillər ({tracks.length})
          </Text>
          {tracks.map((track, index) => (
            <Pressable 
              key={track.id} 
              style={[styles.trackItem, { borderBottomColor: colors.borderLight }]}
            >
              <View style={[styles.trackNumber, { backgroundColor: colors.surface }]}>
                <Text style={[styles.trackNumberText, { color: colors.textTertiary }]}>{index + 1}</Text>
              </View>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={[styles.trackDuration, { color: colors.textTertiary }]}>
                  {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: Colors.brand }}>▶</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
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
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    lineHeight: 26,
  },
  author: {
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingIcon: { fontSize: 14 },
  ratingText: { fontSize: FontSize.sm, fontWeight: '600' },
  duration: { fontSize: FontSize.xs },
  price: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginTop: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    gap: Spacing.md,
  },
  trackNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackNumberText: { fontSize: FontSize.sm, fontWeight: '600' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: FontSize.md, fontWeight: '500' },
  trackDuration: { fontSize: FontSize.xs, marginTop: 2 },
})
