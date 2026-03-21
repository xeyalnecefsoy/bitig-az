import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Appearance, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'bitig-theme-preference'

export type ThemePreference = 'system' | 'light' | 'dark'

type ThemePreferenceContextValue = {
  preference: ThemePreference
  setPreference: (p: ThemePreference) => Promise<void>
  ready: boolean
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null)

function parsePreference(raw: string | null): ThemePreference {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

/** RN native only: `Appearance.setColorScheme`. RN Web does not implement it. */
function setNativeColorScheme(scheme: 'light' | 'dark' | 'unspecified') {
  const setter = (
    Appearance as {
      setColorScheme?: (s: 'light' | 'dark' | 'unspecified') => void
    }
  ).setColorScheme
  if (typeof setter === 'function') {
    setter(scheme)
  }
}

/** Optional hints for browser UI; theme UI is driven by `useResolvedColorScheme`. */
function applyWebThemeHint(p: ThemePreference) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.bitigTheme = p
  if (p === 'light') {
    root.style.colorScheme = 'light'
  } else if (p === 'dark') {
    root.style.colorScheme = 'dark'
  } else {
    root.style.colorScheme = ''
  }
}

export function applyThemePreference(p: ThemePreference) {
  if (Platform.OS === 'web') {
    applyWebThemeHint(p)
    return
  }
  if (p === 'system') {
    setNativeColorScheme('unspecified')
  } else {
    setNativeColorScheme(p)
  }
}

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      const p = parsePreference(v)
      setPreferenceState(p)
      applyThemePreference(p)
      setReady(true)
    })
  }, [])

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPreferenceState(p)
    await AsyncStorage.setItem(STORAGE_KEY, p)
    applyThemePreference(p)
  }, [])

  const value = useMemo(
    () => ({ preference, setPreference, ready }),
    [preference, setPreference, ready]
  )

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  )
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext)
  if (!ctx) throw new Error('useThemePreference must be used within ThemePreferenceProvider')
  return ctx
}
