import { useColorScheme } from 'react-native'
import { Colors } from '@/constants/Colors'

export function useThemeColors() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return {
    isDark,
    colors: isDark ? Colors.dark : Colors.light,
    brand: Colors.brand,
    brandLight: Colors.brandLight,
    brandDark: Colors.brandDark,
  }
}
