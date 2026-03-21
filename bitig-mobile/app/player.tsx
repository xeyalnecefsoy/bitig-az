import React, { useCallback, useMemo } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  useColorScheme,
  useWindowDimensions,
  ScrollView,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAudio } from '@/context/audio'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Feather } from '@expo/vector-icons'
import { Typography } from '@/components/ui/Typography'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Button } from '@/components/ui/Button'
import { PlayerTransportShared } from '@/components/player/PlayerTransportShared'
import {
  hintNextChapterLongPress,
  hintPlayPauseLongPress,
  hintPrevChapterLongPress,
} from '@/lib/playerHints'

export default function PlayerScreen() {
  const {
    activeTrack,
    isPlaying,
    togglePlayback,
    skipToNextInQueue,
    skipToPreviousInQueue,
    queueLength,
    activeQueueIndex,
  } = useAudio()
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  /** Birbaşa /player açılanda naviqasiya yığını boş ola bilər — `back` xəta verir. */
  const leavePlayer = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)' as const)
    }
  }, [router])

  const coverSize = useMemo(() => {
    const byWidth = windowWidth * 0.72
    const byHeight = windowHeight * 0.32
    return Math.min(Math.max(byWidth, 200), Math.min(byHeight, 340))
  }, [windowWidth, windowHeight])

  const canSkipPrev = queueLength > 1 && activeQueueIndex > 0
  const canSkipNext = queueLength > 1 && activeQueueIndex < queueLength - 1

  if (!activeTrack) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Typography style={{ color: colors.text }}>Heç nə oxunmur</Typography>
        <View style={{ marginTop: 20 }}>
          <Button label="Geri qayıt" variant="secondary" onPress={leavePlayer} />
        </View>
      </View>
    )
  }

  const headerPadTop = Math.max(insets.top, Spacing.sm)

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={[styles.header, { paddingTop: headerPadTop }]}>
          <Pressable onPress={leavePlayer} style={styles.iconButton} accessibilityRole="button">
            <Feather name="chevron-down" size={22} color={colors.text} />
          </Pressable>
          <Typography weight="semibold" style={[styles.headerTitle, { color: colors.textSecondary }]}>
            İndi oxunur
          </Typography>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.coverContainer}>
          <Image
            source={activeTrack.artwork || 'https://placehold.co/400x400/1a1a1a/666?text=🎵'}
            style={[styles.cover, { width: coverSize, height: coverSize, borderRadius: BorderRadius.xl }]}
            contentFit="cover"
            transition={300}
          />
        </View>

        <View style={styles.infoContainer}>
          <Typography weight="bold" style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {activeTrack.album ?? activeTrack.title}
          </Typography>
          <Typography style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
            {activeTrack.album ? activeTrack.title : activeTrack.artist || 'Bilinməyən Müəllif'}
          </Typography>
          {activeTrack.album ? (
            <Typography
              style={[styles.artist, { color: colors.textTertiary, fontSize: FontSize.sm, marginTop: 4 }]}
              numberOfLines={1}
            >
              {activeTrack.artist || ''}
            </Typography>
          ) : null}
        </View>

        <View style={styles.mainTransport}>
          <Pressable
            onPress={() => {
              if (canSkipPrev) void skipToPreviousInQueue()
            }}
            onLongPress={() =>
              hintPrevChapterLongPress({ canSkip: canSkipPrev, queueLength, bookContextActive: true })
            }
            delayLongPress={450}
            style={[
              styles.chapterBtn,
              {
                borderColor: isDark ? '#333' : colors.border,
                backgroundColor: isDark ? '#141414' : colors.background,
                opacity: !canSkipPrev ? 0.35 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Öncəki bölüm"
            accessibilityHint="Uzun bas: izah"
            accessibilityState={{ disabled: !canSkipPrev }}
          >
            <Feather name="chevrons-left" size={26} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.playButtonWrap}
            onPress={() => togglePlayback()}
            onLongPress={() => hintPlayPauseLongPress({ tracksEmpty: false, isPlaying })}
            delayLongPress={450}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Fasilə' : 'Oxut'}
            accessibilityHint="Uzun bas: izah"
          >
            <GlassSurface intensity={26} style={[styles.playButton, { borderColor: 'transparent', backgroundColor: Colors.brand }]}>
              <Feather name={isPlaying ? 'pause' : 'play'} size={28} color="#06140A" />
            </GlassSurface>
          </Pressable>

          <Pressable
            onPress={() => {
              if (canSkipNext) void skipToNextInQueue()
            }}
            onLongPress={() =>
              hintNextChapterLongPress({ canSkip: canSkipNext, queueLength, bookContextActive: true })
            }
            delayLongPress={450}
            style={[
              styles.chapterBtn,
              {
                borderColor: isDark ? '#333' : colors.border,
                backgroundColor: isDark ? '#141414' : colors.background,
                opacity: !canSkipNext ? 0.35 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sonrakı bölüm"
            accessibilityHint="Uzun bas: izah"
            accessibilityState={{ disabled: !canSkipNext }}
          >
            <Feather name="chevrons-right" size={26} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.transportPad}>
          <PlayerTransportShared isActive />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: FontSize.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  coverContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  infoContainer: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize['2xl'],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  artist: {
    fontSize: FontSize.lg,
  },
  mainTransport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chapterBtn: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonWrap: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  transportPad: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
})
