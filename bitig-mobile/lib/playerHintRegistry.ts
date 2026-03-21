import { Alert, Platform } from 'react-native'

type ShowHintFn = (title: string, message: string) => void

let impl: ShowHintFn | null = null

/** Overlay mount olduqda çağırılır (PlayerHintOverlay). */
export function setPlayerHintImpl(fn: ShowHintFn | null) {
  impl = fn
}

/**
 * Uzun basım izahı — mümkünsə UI overlay; yoxdursa (test edge) köhnə fallback.
 */
export function showPlayerHint(title: string, message: string) {
  if (impl) {
    impl(title, message)
    return
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`)
    return
  }
  Alert.alert(title, message)
}
