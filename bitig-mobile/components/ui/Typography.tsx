import React from 'react'
import { Text, type TextProps, type TextStyle } from 'react-native'

type Weight = 'regular' | 'medium' | 'semibold' | 'bold'

const fontByWeight: Record<Weight, string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
}

export interface TypographyProps extends TextProps {
  weight?: Weight
}

export function Typography({ weight = 'regular', style, ...props }: TypographyProps) {
  return <Text {...props} style={[{ fontFamily: fontByWeight[weight] } as TextStyle, style]} />
}

