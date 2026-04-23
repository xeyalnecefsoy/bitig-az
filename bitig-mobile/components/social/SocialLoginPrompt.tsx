import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/context/auth'
import { GuestCallout } from '@/components/ui/GuestCallout'

export function SocialLoginPrompt({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ paddingVertical: 32 }}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  if (user) return null

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: compact ? 8 : 12 }}>
      <GuestCallout
        icon="message-circle"
        title="Müzakirələrə qoşulun"
        subtitle="Paylaşım etmək və bəyənmək üçün daxil olun."
        actionLabel="Daxil ol"
        onPress={() => router.push('/login' as any)}
      />
    </View>
  )
}

