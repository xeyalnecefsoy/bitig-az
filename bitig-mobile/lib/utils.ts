/**
 * Simple relative time formatting (Azerbaijani)
 */
export function formatDistanceToNow(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'indicə'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} dəq əvvəl`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat əvvəl`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} gün əvvəl`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} həftə əvvəl`
  
  return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })
}
