import React, { useEffect, useState } from 'react'
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
  const resolved = resolveAvatarUrl(avatarUrl, usernameOrId)
  const source = getAvatarImageSource(resolved)
  const radius = size / 2

  useEffect(() => {
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
      onError={() => setFailed(true)}
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
