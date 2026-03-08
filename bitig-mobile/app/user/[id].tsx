import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, useColorScheme, Pressable,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Profile } from '@/lib/types'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [postsCount, setPostsCount] = useState(0)
  const { user } = useAuth()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  useEffect(() => {
    if (id) loadProfile()
  }, [id])

  async function loadProfile() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (profile) setUserProfile(profile)

    // Counts
    const { count: followers } = await supabase
      .from('social_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', id)
    setFollowersCount(followers || 0)

    const { count: following } = await supabase
      .from('social_follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', id)
    setFollowingCount(following || 0)

    const { count: posts } = await supabase
      .from('social_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
    setPostsCount(posts || 0)

    // Check if current user follows this profile
    if (user && user.id !== id) {
      const { data } = await supabase
        .from('social_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .single()
      setIsFollowing(!!data)
    }

    setLoading(false)
  }

  async function toggleFollow() {
    if (!user) { router.push('/login' as any); return }

    if (isFollowing) {
      await supabase.from('social_follows').delete()
        .eq('follower_id', user.id).eq('following_id', id)
      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
    } else {
      await supabase.from('social_follows').insert({
        follower_id: user.id,
        following_id: id,
      })
      setIsFollowing(true)
      setFollowersCount(prev => prev + 1)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  if (!userProfile) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>İstifadəçi tapılmadı</Text>
      </View>
    )
  }

  const avatarUrl = userProfile.avatar_url || 
    `https://bitig.az/api/avatar?name=${encodeURIComponent(userProfile.username || userProfile.id)}`

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: isDark ? '#1a1a2e' : '#e8f0fe' }]} />

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
        <Text style={[styles.name, { color: colors.text }]}>
          {userProfile.full_name || userProfile.username}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{userProfile.username}
        </Text>
        {userProfile.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]}>{userProfile.bio}</Text>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{postsCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Post</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{followersCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>İzləyici</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{followingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>İzləyir</Text>
          </View>
        </View>

        {/* Follow button */}
        {user && user.id !== id && (
          <Pressable
            style={[styles.followButton, {
              backgroundColor: isFollowing ? 'transparent' : Colors.brand,
              borderColor: isFollowing ? colors.border : Colors.brand,
              borderWidth: 1,
            }]}
            onPress={toggleFollow}
          >
            <Text style={[styles.followButtonText, {
              color: isFollowing ? colors.text : '#fff',
            }]}>
              {isFollowing ? 'İzləyirsiniz' : 'İzlə'}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  banner: { height: 120 },
  profileSection: {
    alignItems: 'center',
    marginTop: -40,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: { fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.md },
  username: { fontSize: FontSize.md, marginTop: Spacing.xs },
  bio: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing['3xl'],
    marginTop: Spacing.xl,
  },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: FontSize.lg, fontWeight: '700' },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  followButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing['3xl'],
    borderRadius: BorderRadius.full,
  },
  followButtonText: { fontSize: FontSize.md, fontWeight: '600' },
})
