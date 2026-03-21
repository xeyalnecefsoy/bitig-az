import React from 'react'
import { View, ActivityIndicator, useColorScheme } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { useAuth } from '@/context/auth'
import { Feather } from '@expo/vector-icons'

export function SocialLoginPrompt({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  if (loading) {
    return (
      <View style={{ paddingVertical: 32 }}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  if (user) return null

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: compact ? 8 : 0 }}>
      <GlassSurface style={{ padding: 18 }} intensity={22}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.surfaceHover,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="message-circle" size={20} color={Colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography weight="bold" style={{ color: colors.text, fontSize: 16 }}>
              Müzakirələrə qoşulun
            </Typography>
            <Typography style={{ color: colors.textSecondary, marginTop: 6 }}>
              Paylaşım etmək və bəyənmək üçün daxil olun.
            </Typography>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Button label="Daxil Ol" onPress={() => router.push('/login' as any)} fullWidth />
        </View>
      </GlassSurface>
    </View>
  )
}

