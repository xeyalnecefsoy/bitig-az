import React from 'react'
import { Platform, Pressable, StyleSheet, useColorScheme, View } from 'react-native'
import { Image } from 'expo-image'
import { Feather } from '@expo/vector-icons'

import { Colors, Spacing, FontSize } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'

const BITIG_LOGO_URI = 'https://bitig.az/logo.png'

export interface AppHeaderProps {
  rightExtras?: React.ReactNode
}

export function AppHeader({ rightExtras }: AppHeaderProps) {
  const colorScheme = useColorScheme()
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        <Image
          source={{ uri: BITIG_LOGO_URI }}
          style={styles.logoImage}
          contentFit="contain"
          accessibilityLabel="Bitig logo"
        />
        <Typography weight="bold" style={[styles.brandText, { color: colors.text }]}>
          Bitig
        </Typography>
      </View>

      <View style={styles.right}>
        {rightExtras}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.75 : 1 }]}
          onPress={() => {}}
        >
          <Feather name="bell" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  brandText: {
    fontSize: FontSize.lg,
    letterSpacing: -0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

