import React, { useEffect, useMemo, useState } from 'react'
import { Image, View, StyleSheet, type StyleProp, type ImageStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { getAvatarImageSource, resolveAvatarUrl } from '@/lib/avatar'

type Props = {
  avatarUrl: string | null | undefined
  usernameOrId?: string | null
  size?: number
  style?: StyleProp<ImageStyle>
  /** Shown behind image while loading / on failure before icon fallback */
  backgroundColor?: string
}

/**
 * Remote avatars: React Native `Image` with browser-like headers (fixes CDN 403 / empty responses vs web).
 */
export function UserAvatar({
  avatarUrl,
  usernameOrId,
  size = 48,
  style,
  backgroundColor = 'rgba(128, 128, 128, 0.25)',
}: Props) {
  const [failed, setFailed] = useState(false)
  const resolvedPrimary = useMemo(
    () => resolveAvatarUrl(avatarUrl, usernameOrId),
    [avatarUrl, usernameOrId],
  )
  const resolvedFallback = useMemo(() => resolveAvatarUrl(null, usernameOrId), [usernameOrId])
  const [resolved, setResolved] = useState<string>(resolvedPrimary)

  useEffect(() => {
    setResolved(resolvedPrimary)
    setFailed(false)
  }, [resolvedPrimary])

  const source = useMemo(() => getAvatarImageSource(resolved), [resolved])
  const radius = size / 2

  useEffect(() => {
    // Reset failure state when retrying a different resolved URI.
    setFailed(false)
  }, [resolved])

  if (failed) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: size, height: size, borderRadius: radius, backgroundColor },
          style,
        ]}
      >
        <Feather name="user" size={size * 0.45} color="#9ca3af" />
      </View>
    )
  }

  return (
    <Image
      source={source}
      style={[{ width: size, height: size, borderRadius: radius, backgroundColor }, style]}
      resizeMode="cover"
      onError={() => {
        if (resolved !== resolvedFallback) {
          // If the stored avatar URL is broken/unreachable for this account,
          // fallback to the generated avatar endpoint.
          setResolved(resolvedFallback)
          return
        }
        setFailed(true)
      }}
    />
  )
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
})
