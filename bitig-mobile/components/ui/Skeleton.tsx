import React from 'react'
import { View, type ViewProps } from 'react-native'

import { useThemeColors } from '@/hooks/useThemeColors'
import { BorderRadius } from '@/constants/Colors'

export interface SkeletonProps extends ViewProps {
  radius?: number
}

export function Skeleton({ radius = BorderRadius.md, style, ...props }: SkeletonProps) {
  const { isDark } = useThemeColors()
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          borderRadius: radius,
        },
        style,
      ]}
    />
  )
}

