import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { useAudio } from '@/context/audio';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { usePathname, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { GlassSurface } from '@/components/ui/GlassSurface';
import {
  hintNextChapterLongPress,
  hintPlayPauseLongPress,
  hintPrevChapterLongPress,
} from '@/lib/playerHints';

export function MiniPlayer() {
  const pathname = usePathname();
  const {
    activeTrack,
    isPlaying,
    togglePlayback,
    skipToNextInQueue,
    skipToPreviousInQueue,
    queueLength,
    activeQueueIndex,
    clearPlayback,
  } = useAudio();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const onFullScreenPlayer = pathname === '/player' || pathname?.endsWith('/player');
  if (onFullScreenPlayer) return null;

  if (!activeTrack) return null;

  const canSkipPrev = queueLength > 1 && activeQueueIndex > 0;
  const canSkipNext = queueLength > 1 && activeQueueIndex < queueLength - 1;

  return (
    <GlassSurface
      intensity={28}
      style={[
        styles.container,
        {
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <Pressable
          style={styles.tapArea}
          onPress={() => router.push('/player' as any)}
          accessibilityRole="button"
          accessibilityLabel="Tam ekran pleyer"
        >
          <Image
            source={activeTrack.artwork || 'https://placehold.co/100x100/1a1a1a/666?text=🎵'}
            style={styles.cover}
            contentFit="cover"
          />
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {activeTrack.album ?? activeTrack.title}
            </Text>
            <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
              {activeTrack.album ? activeTrack.title : activeTrack.artist || 'Bilinməyən Müəllif'}
            </Text>
          </View>
        </Pressable>

        <View style={styles.controls}>
          <Pressable
            onPress={() => {
              if (canSkipPrev) void skipToPreviousInQueue();
            }}
            onLongPress={() =>
              hintPrevChapterLongPress({ canSkip: canSkipPrev, queueLength, bookContextActive: true })
            }
            delayLongPress={450}
            style={[styles.skipBtn, { opacity: !canSkipPrev ? 0.35 : 1 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Öncəki bölüm"
            accessibilityHint="Uzun bas: izah"
            accessibilityState={{ disabled: !canSkipPrev }}
          >
            <Feather name="chevrons-left" size={22} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={togglePlayback}
            onLongPress={() => hintPlayPauseLongPress({ tracksEmpty: false, isPlaying })}
            delayLongPress={450}
            style={styles.playButton}
            hitSlop={10}
            accessibilityLabel={isPlaying ? 'Fasilə' : 'Oxut'}
            accessibilityHint="Uzun bas: izah"
          >
            <Feather name={isPlaying ? 'pause' : 'play'} size={22} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => {
              if (canSkipNext) void skipToNextInQueue();
            }}
            onLongPress={() =>
              hintNextChapterLongPress({ canSkip: canSkipNext, queueLength, bookContextActive: true })
            }
            delayLongPress={450}
            style={[styles.skipBtn, { opacity: !canSkipNext ? 0.35 : 1 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Sonrakı bölüm"
            accessibilityHint="Uzun bas: izah"
            accessibilityState={{ disabled: !canSkipNext }}
          >
            <Feather name="chevrons-right" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => void clearPlayback()}
          style={[
            styles.closeBtn,
            {
              borderLeftColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)',
            },
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Pleyeri bağla"
        >
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above the tab bar
    left: 8,
    right: 8,
    height: 64,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 0,
  },
  tapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 0,
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  artist: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 0,
    flexShrink: 0,
  },
  skipBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 34,
    height: 40,
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 38,
    height: 40,
  },
  closeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 44,
    flexShrink: 0,
    marginLeft: 4,
    paddingLeft: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});
