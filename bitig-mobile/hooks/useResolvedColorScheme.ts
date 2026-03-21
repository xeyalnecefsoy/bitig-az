import { Appearance, useColorScheme } from 'react-native'

import { useThemePreference } from '@/context/themePreference'

/**
 * Resolves light/dark from user preference (settings).
 * On web, `Appearance.setColorScheme` does not exist — we never rely on it; preference drives UI here.
 */
export function useResolvedColorScheme(): 'light' | 'dark' {
  const { preference } = useThemePreference()
  const systemScheme = useColorScheme()

  if (preference === 'light') return 'light'
  if (preference === 'dark') return 'dark'

  if (systemScheme === 'dark') return 'dark'
  if (systemScheme === 'light') return 'light'
  const os = Appearance.getColorScheme()
  return os === 'dark' ? 'dark' : 'light'
}
