import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const isBrowser = typeof window !== 'undefined'

/**
 * Native: prefer expo-secure-store (Keychain/Keystore); fallback to AsyncStorage if payload is too large or write fails.
 * Web: localStorage.
 */
function getAuthStorage() {
  if (Platform.OS === 'web') {
    if (isBrowser) return window.localStorage
    return undefined
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage').default

  return {
    getItem: async (key: string) => {
      const secure = await SecureStore.getItemAsync(key)
      if (secure != null) return secure
      return AsyncStorage.getItem(key)
    },
    setItem: async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value)
      } catch {
        await AsyncStorage.setItem(key, value)
      }
    },
    removeItem: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key)
      } catch {
        /* ignore */
      }
      await AsyncStorage.removeItem(key)
    },
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
