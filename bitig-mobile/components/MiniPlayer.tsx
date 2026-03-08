import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useAudio } from '@/context/audio';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export function MiniPlayer() {
  const { activeTrack, isPlaying, togglePlayback } = useAudio();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  if (!activeTrack) return null;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderTopColor: colors.border,
        },
      ]}
      onPress={() => router.push('/player' as any)} // Will build player modal later
    >
      <View style={styles.content}>
        <Image
          source={activeTrack.artwork || 'https://placehold.co/100x100/1a1a1a/666?text=🎵'}
          style={styles.cover}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {activeTrack.title}
          </Text>
          <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
            {activeTrack.artist || 'Bilinməyən Müəllif'}
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={togglePlayback} style={styles.playButton} hitSlop={10}>
            <Text style={{ fontSize: 28, color: colors.text }}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
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
    gap: Spacing.md,
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
    paddingHorizontal: Spacing.sm,
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
});
