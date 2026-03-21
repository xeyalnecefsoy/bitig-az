import React from 'react'
import { Platform, View, type ViewProps } from 'react-native'
import { BlurView } from 'expo-blur'

import { useThemeColors } from '@/hooks/useThemeColors'

export interface GlassSurfaceProps extends ViewProps {
  intensity?: number
  tint?: 'light' | 'dark' | 'default'
}

export function GlassSurface({
  intensity = 22,
  tint = 'default',
  style,
  ...props
}: GlassSurfaceProps) {
  const { isDark, colors } = useThemeColors()

  // Web blur support is inconsistent; fall back to translucent fill.
  if (Platform.OS === 'web') {
    return (
      <View
        {...props}
        style={[
          {
            backgroundColor: colors.glass,
            borderColor: colors.border,
            borderWidth: 1,
          },
          style,
        ]}
      />
    )
  }

  return (
    <BlurView
      {...props}
      intensity={intensity}
      tint={tint === 'default' ? (isDark ? 'dark' : 'light') : tint}
      style={[
        {
          backgroundColor: colors.glass,
          borderColor: colors.border,
          borderWidth: 1,
        },
        style,
      ]}
    />
  )
}

