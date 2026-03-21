import React from 'react'
import { View, type ViewProps } from 'react-native'

import { useThemeColors } from '@/hooks/useThemeColors'
import { BorderRadius, Spacing } from '@/constants/Colors'

export interface CardProps extends ViewProps {
  padded?: boolean
}

export function Card({ padded = true, style, ...props }: CardProps) {
  const { colors } = useThemeColors()
  return (
    <View
      {...props}
      style={[
        {
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: padded ? Spacing.md : 0,
        },
        style,
      ]}
    />
  )
}

