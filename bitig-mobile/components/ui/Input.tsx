import React from 'react'
import { View, TextInput, Pressable, type TextInputProps, type ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { useThemeColors } from '@/hooks/useThemeColors'
import { BorderRadius, Spacing, FontSize } from '@/constants/Colors'

export interface InputProps extends TextInputProps {
  leftIcon?: keyof typeof Feather.glyphMap
  rightIcon?: keyof typeof Feather.glyphMap
  onRightIconPress?: () => void
  containerStyle?: ViewStyle
}

export function Input({ leftIcon, rightIcon, onRightIconPress, containerStyle, style, ...props }: InputProps) {
  const { colors } = useThemeColors()

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          paddingHorizontal: Spacing.md,
          height: 44,
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        containerStyle,
      ]}
    >
      {leftIcon ? <Feather name={leftIcon} size={16} color={colors.textTertiary} /> : null}
      <TextInput
        {...props}
        style={[
          {
            flex: 1,
            color: colors.text,
            fontSize: FontSize.md,
            fontFamily: 'Inter_400Regular',
          },
          style,
        ]}
        placeholderTextColor={colors.textTertiary}
      />
      {rightIcon ? (
        <Pressable
          onPress={onRightIconPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: Spacing.xs })}
          hitSlop={8}
        >
          <Feather name={rightIcon} size={18} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  )
}

