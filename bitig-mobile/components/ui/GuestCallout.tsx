import React from 'react'
import { View, StyleSheet, useColorScheme, type ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'

export interface GuestCalloutProps {
  icon: keyof typeof Feather.glyphMap
  title: string
  subtitle: string
  actionLabel: string
  onPress: () => void
  style?: ViewStyle
}

export function GuestCallout({
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
  style,
}: GuestCalloutProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const bg = isDark ? 'rgba(74, 216, 96, 0.10)' : 'rgba(74, 216, 96, 0.14)'
  const border = isDark ? 'rgba(74, 216, 96, 0.18)' : 'rgba(74, 216, 96, 0.22)'
  const iconBg = isDark ? 'rgba(74, 216, 96, 0.14)' : 'rgba(74, 216, 96, 0.18)'

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }, style]}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={18} color={Colors.brand} />
        </View>
        <View style={styles.textCol}>
          <Typography weight="bold" style={[styles.title, { color: colors.text }]}>
            {title}
          </Typography>
          <Typography style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Typography>
        </View>
      </View>

      <View style={styles.action}>
        <Button label={actionLabel} onPress={onPress} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minWidth: 0 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontSize: FontSize.md },
  subtitle: { fontSize: FontSize.sm, marginTop: 4 },
  action: { alignSelf: 'stretch', justifyContent: 'center' },
})

