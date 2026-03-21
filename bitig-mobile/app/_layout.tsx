import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'

import { AuthProvider } from '@/context/auth'
import { CartProvider } from '@/context/cart'
import { AudioProvider } from '@/context/audio'
import { SocialProvider } from '@/context/social'
import { LocaleProvider, useLocale } from '@/context/locale'
import { ThemePreferenceProvider, useThemePreference } from '@/context/themePreference'
import { playbackService } from '@/lib/playbackService'
import { MiniPlayer } from '@/components/MiniPlayer'
import { PlayerHintOverlay } from '@/components/PlayerHintOverlay'
import { useResolvedColorScheme } from '@/hooks/useResolvedColorScheme'

if (Platform.OS !== 'web') {
  TrackPlayer.registerPlaybackService(() => playbackService)
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

function RootLayoutInner({ fontsLoaded }: { fontsLoaded: boolean }) {
  const colorScheme = useResolvedColorScheme()
  const { ready: localeReady } = useLocale()
  const { ready: themeReady } = useThemePreference()

  useEffect(() => {
    if (fontsLoaded && localeReady && themeReady) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, localeReady, themeReady])

  // Veb brauzerdə tab başlığı və favicon (Bitig)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    document.title = 'Bitig'
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = 'https://bitig.az/logo.png'
    link.type = 'image/png'
  }, [])

  if (!fontsLoaded || !localeReady || !themeReady) {
    return null
  }

  return (
    <AuthProvider>
      <CartProvider>
        <AudioProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <SocialProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="library" options={{ headerShown: false }} />
                <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
                <Stack.Screen
                  name="login"
                  options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                  }}
                />
                <Stack.Screen
                  name="book/[id]"
                  options={{
                    headerShown: true,
                    title: '',
                    headerBackTitle: 'Geri',
                  }}
                />
                <Stack.Screen
                  name="chat/[id]"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="user/[id]"
                  options={{
                    headerShown: true,
                    title: 'Profil',
                    headerBackTitle: 'Geri',
                  }}
                />
                <Stack.Screen
                  name="settings"
                  options={{
                    headerShown: true,
                    title: '',
                    headerBackTitle: 'Geri',
                  }}
                />
                <Stack.Screen
                  name="player"
                  options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                  }}
                />
                <Stack.Screen
                  name="social/post/[id]"
                  options={{
                    headerShown: false,
                    title: 'Paylaşım',
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <MiniPlayer />
              <PlayerHintOverlay />
            </SocialProvider>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AudioProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  return (
    <LocaleProvider>
      <ThemePreferenceProvider>
        <RootLayoutInner fontsLoaded={loaded} />
      </ThemePreferenceProvider>
    </LocaleProvider>
  )
}
