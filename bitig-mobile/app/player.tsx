import React from 'react'
import { View, Text, StyleSheet, Pressable, useColorScheme, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useProgress } from 'react-native-track-player'
import { useAudio } from '@/context/audio'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'

const { width } = Dimensions.get('window')
const COVER_SIZE = width * 0.8

export default function PlayerScreen() {
  const { activeTrack, isPlaying, togglePlayback, seekTo } = useAudio()
  const { position, duration } = useProgress()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  if (!activeTrack) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Heç nə oxunmur</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.brand }}>Geri qayıt</Text>
        </Pressable>
      </View>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Text style={{ fontSize: 24, color: colors.text }}>⌄</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>İndi oxunur</Text>
        <View style={styles.iconButton} />
      </View>

      {/* Cover */}
      <View style={styles.coverContainer}>
        <Image
          source={activeTrack.artwork || 'https://placehold.co/400x400/1a1a1a/666?text=🎵'}
          style={styles.cover}
          contentFit="cover"
          transition={300}
        />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {activeTrack.title}
        </Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
          {activeTrack.artist || 'Bilinməyən Müəllif'}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {/* Simple Progress Bar (can use slider library later) */}
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { backgroundColor: Colors.brand, width: `${(position / (duration || 1)) * 100}%` }
            ]} 
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>{formatTime(position)}</Text>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <Pressable onPress={() => seekTo(position - 15)} hitSlop={10}>
          <Text style={{ fontSize: 28, color: colors.text }}>↺</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.playButton, { backgroundColor: Colors.brand }]} 
          onPress={togglePlayback}
        >
          <Text style={{ fontSize: 32, color: '#fff' }}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </Pressable>

        <Pressable onPress={() => seekTo(position + 15)} hitSlop={10}>
          <Text style={{ fontSize: 28, color: colors.text }}>↻</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  coverContainer: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  infoContainer: {
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  artist: {
    fontSize: FontSize.lg,
  },
  progressContainer: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  timeText: { fontSize: FontSize.xs, fontWeight: '500' },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
