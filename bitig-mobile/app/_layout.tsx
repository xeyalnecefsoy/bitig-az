import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import TrackPlayer from 'react-native-track-player'

import { AuthProvider } from '@/context/auth'
import { AudioProvider } from '@/context/audio'
import { playbackService } from '@/lib/playbackService'
import { MiniPlayer } from '@/components/MiniPlayer'

// Important: Register playback service right away
TrackPlayer.registerPlaybackService(() => playbackService);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <AuthProvider>
      <AudioProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ 
              headerShown: false,
              presentation: 'fullScreenModal' 
            }} />
            <Stack.Screen name="book/[id]" options={{ 
              headerShown: true,
              title: '',
              headerBackTitle: 'Geri',
            }} />
            <Stack.Screen name="chat/[id]" options={{ 
              headerShown: false,
            }} />
            <Stack.Screen name="user/[id]" options={{ 
              headerShown: true,
              title: 'Profil',
              headerBackTitle: 'Geri',
            }} />
            <Stack.Screen name="player" options={{ 
              headerShown: false,
              presentation: 'fullScreenModal',
            }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <MiniPlayer />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AudioProvider>
    </AuthProvider>
  )
}
