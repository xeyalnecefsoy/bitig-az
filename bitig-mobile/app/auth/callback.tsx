import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Platform, Text } from 'react-native'
import { createSessionFromUrl } from '@/lib/auth'
import { useColorScheme } from 'react-native'
import { Colors } from '@/constants/Colors'

/**
 * OAuth callback route. Supabase redirects here (e.g. /auth/callback#access_token=...).
 * On web we read window.location.href, set session, then redirect to app.
 */
export default function AuthCallbackScreen() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const colorScheme = useColorScheme()
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      if (Platform.OS !== 'web' || typeof window === 'undefined') {
        router.replace('/(tabs)')
        return
      }
      const url = window.location.href
      if (!url || (!url.includes('access_token') && !url.includes('error'))) {
        router.replace('/(tabs)')
        return
      }
      try {
        await createSessionFromUrl(url)
        if (!cancelled) router.replace('/(tabs)')
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Auth xətası')
      }
    }

    handleCallback()
    return () => {
      cancelled = true
    }
  }, [router])

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 }}>
        <Text style={{ color: Colors.error, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
        <Text style={{ color: colors.textSecondary }} onPress={() => router.replace('/(tabs)')}>
          Ana səhifəyə qayıt
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={Colors.brand} />
    </View>
  )
}
