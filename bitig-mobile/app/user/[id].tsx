import React, { useEffect, useState } from 'react'
import {
  View, ScrollView, StyleSheet, useColorScheme, Pressable,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { useSocial } from '@/context/social'
import type { Profile, Post } from '@/lib/types'
import { resolveAvatarUrl } from '@/lib/avatar'
import { SOCIAL_POST_ENRICHED_SELECT } from '@/lib/socialPostSelect'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import { Typography } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [postsCount, setPostsCount] = useState(0)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const { user } = useAuth()
  const { mergePostsFromSupabaseRows } = useSocial()
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
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', id)
    setFollowersCount(followers || 0)

    const { count: following } = await supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', id)
    setFollowingCount(following || 0)

    const { count: posts } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
    setPostsCount(posts || 0)

    // Check if current user follows this profile
    if (user && user.id !== id) {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .single()
      setIsFollowing(!!data)
    }

    const { data: postRows } = await supabase
      .from('posts')
      .select(SOCIAL_POST_ENRICHED_SELECT)
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (postRows?.length) {
      const mapped = await mergePostsFromSupabaseRows(postRows)
      setUserPosts(mapped)
    } else {
      setUserPosts([])
    }

    setLoading(false)
  }

  async function toggleFollow() {
    if (!user) { router.push('/login' as any); return }

    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', id)
      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
    } else {
      await supabase.from('follows').insert({
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
        <Typography style={{ color: colors.textSecondary }}>İstifadəçi tapılmadı</Typography>
      </View>
    )
  }

  const avatarUrl = resolveAvatarUrl(
    userProfile.avatar_url,
    userProfile.username || userProfile.id,
  )

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: isDark ? 'rgba(74,216,96,0.10)' : 'rgba(74,216,96,0.16)' }]} />

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
        <Typography weight="bold" style={[styles.name, { color: colors.text }]}>
          {userProfile.full_name || userProfile.username}
        </Typography>
        <Typography style={[styles.username, { color: colors.textSecondary }]}>
          @{userProfile.username}
        </Typography>
        {userProfile.bio && (
          <Typography style={[styles.bio, { color: colors.textSecondary }]}>{userProfile.bio}</Typography>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Typography weight="bold" style={[styles.statNumber, { color: colors.text }]}>{postsCount}</Typography>
            <Typography style={[styles.statLabel, { color: colors.textTertiary }]}>Post</Typography>
          </View>
          <View style={styles.stat}>
            <Typography weight="bold" style={[styles.statNumber, { color: colors.text }]}>{followersCount}</Typography>
            <Typography style={[styles.statLabel, { color: colors.textTertiary }]}>İzləyici</Typography>
          </View>
          <View style={styles.stat}>
            <Typography weight="bold" style={[styles.statNumber, { color: colors.text }]}>{followingCount}</Typography>
            <Typography style={[styles.statLabel, { color: colors.textTertiary }]}>İzləyir</Typography>
          </View>
        </View>

        {/* Follow button */}
        {user && user.id !== id && (
          <View style={{ marginTop: Spacing.xl }}>
            <Button
              label={isFollowing ? 'İzləyirsiniz' : 'İzlə'}
              variant={isFollowing ? 'secondary' : 'primary'}
              onPress={toggleFollow}
            />
          </View>
        )}
      </View>

      <Typography weight="bold" style={{ fontSize: FontSize.xl, color: colors.text, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
        Paylaşımlar
      </Typography>
      {userPosts.length === 0 ? (
        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing['2xl'] }}>
          <Typography style={{ color: colors.textSecondary }}>Paylaşım yoxdur</Typography>
        </View>
      ) : (
        <View style={{ paddingBottom: Spacing['3xl'] }}>
          {userPosts.map(p => (
            <SocialPostCard key={p.id} post={p as any} />
          ))}
        </View>
      )}
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
  name: { fontSize: FontSize.xl, marginTop: Spacing.md },
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
  statNumber: { fontSize: FontSize.lg },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
})
