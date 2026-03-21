import React from 'react'
import { Pressable, type PressableProps, type TextStyle } from 'react-native'

import { useThemeColors } from '@/hooks/useThemeColors'
import { Typography } from '@/components/ui/Typography'
import { BorderRadius, Spacing } from '@/constants/Colors'

type Variant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string
  variant?: Variant
  fullWidth?: boolean
}

export function Button({ label, variant = 'primary', fullWidth, disabled, ...props }: ButtonProps) {
  const { colors } = useThemeColors()

  const backgroundColor =
    variant === 'primary'
      ? '#4AD860'
      : variant === 'secondary'
        ? colors.surface
        : 'transparent'

  const borderColor =
    variant === 'primary'
      ? 'transparent'
      : variant === 'secondary'
        ? colors.border
        : 'transparent'

  const textColor = variant === 'primary' ? '#06140A' : colors.text

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...props}
      style={({ pressed }) => [
        {
          width: fullWidth ? '100%' : undefined,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          borderRadius: BorderRadius.lg,
          backgroundColor,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: Spacing.sm,
        },
      ]}
    >
      <Typography
        weight="semibold"
        style={[{ color: textColor } as TextStyle]}
      >
        {label}
      </Typography>
    </Pressable>
  )
}

