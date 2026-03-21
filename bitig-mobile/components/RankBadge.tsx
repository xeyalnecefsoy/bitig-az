import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export type Rank = 'novice' | 'reader' | 'bookworm' | 'scholar' | 'ozan' | 'writer' | 'founder'

interface RankBadgeProps {
  rank: Rank | string | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const rankLabels: Record<Rank, string> = {
  novice: 'Oxucu',
  reader: 'Kitabsəvər',
  bookworm: 'Kitab Qurdu',
  scholar: 'Bilgə',
  ozan: 'Ozan',
  writer: 'Yazıçı',
  founder: 'Qurucu',
}

const rankConfig: Record<Rank, { icon: string; bg: string; text: string }> = {
  novice: { icon: '📖', bg: '#262626', text: '#a3a3a3' },
  reader: { icon: '📚', bg: 'rgba(59, 130, 246, 0.25)', text: '#60a5fa' },
  bookworm: { icon: '🐛', bg: 'rgba(34, 197, 94, 0.25)', text: '#4ade80' },
  scholar: { icon: '🎓', bg: 'rgba(168, 85, 247, 0.25)', text: '#c084fc' },
  ozan: { icon: '🎭', bg: 'rgba(245, 158, 11, 0.25)', text: '#fbbf24' },
  writer: { icon: '✍️', bg: 'rgba(244, 63, 94, 0.2)', text: '#fb7185' },
  founder: { icon: '🚀', bg: 'rgba(59, 130, 246, 0.25)', text: '#60a5fa' },
}

const RANKS: Rank[] = ['novice', 'reader', 'bookworm', 'scholar', 'ozan', 'writer', 'founder']

export function RankBadge({ rank, size = 'sm', showLabel = true }: RankBadgeProps) {
  const safeRank: Rank = RANKS.includes(rank as Rank) ? (rank as Rank) : 'novice'
  const config = rankConfig[safeRank]
  const label = rankLabels[safeRank]

  const sizeStyles = {
    sm: { paddingVertical: 4, paddingHorizontal: 8, gap: 4 },
    md: { paddingVertical: 6, paddingHorizontal: 10, gap: 6 },
    lg: { paddingVertical: 8, paddingHorizontal: 12, gap: 8 },
  }
  const fontSizes = { sm: 12, md: 14, lg: 16 }

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, ...sizeStyles[size] }]}>
      <Text style={styles.emoji}>{config.icon}</Text>
      {showLabel && (
        <Text style={[styles.label, { color: config.text, fontSize: fontSizes[size] }]}>{label}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontWeight: '500',
  },
})
