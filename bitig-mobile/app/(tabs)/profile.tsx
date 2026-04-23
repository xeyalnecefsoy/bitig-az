import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  useColorScheme,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { useAuth } from '@/context/auth'
import { useLocale } from '@/context/locale'
import { Feather } from '@expo/vector-icons'
import { Button } from '@/components/ui/Button'
import { Typography } from '@/components/ui/Typography'
import { RankBadge } from '@/components/RankBadge'
import { AppHeader } from '@/components/AppHeader'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { supabase } from '@/lib/supabase'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useSocial } from '@/context/social'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import { SOCIAL_POST_ENRICHED_SELECT } from '@/lib/socialPostSelect'
import type { Post } from '@/lib/types'

export default function ProfileScreen() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const { mergePostsFromSupabaseRows } = useSocial()
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [postsCount, setPostsCount] = useState(0)
  const [profilePosts, setProfilePosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()
  const { t } = useLocale()

  const settingsHeaderButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('mobile_settings_title')}
      onPress={() => router.push('/settings' as any)}
      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
    >
      <Feather name="settings" size={20} color={colors.text} />
    </Pressable>
  )

  async function loadProfileData() {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [
        { count: followers },
        { count: following },
        { count: postsTotal },
        { data: postsData },
      ] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase
          .from('posts')
          .select(SOCIAL_POST_ENRICHED_SELECT)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setFollowersCount(followers ?? 0)
      setFollowingCount(following ?? 0)
      setPostsCount(postsTotal ?? 0)
      const rows = postsData as any[] | null
      if (rows?.length) {
        const mapped = await mergePostsFromSupabaseRows(rows)
        setProfilePosts(mapped)
      } else {
        setProfilePosts([])
      }
    } catch (_) {
      setProfilePosts([])
      setFollowersCount(0)
      setFollowingCount(0)
      setPostsCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) loadProfileData()
    else setLoading(false)
  }, [user?.id])

  async function onRefresh() {
    setRefreshing(true)
    await loadProfileData()
    setRefreshing(false)
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader rightExtras={settingsHeaderButton} />
        <View style={styles.guestCentered}>
          <GlassSurface style={[styles.guestCard, { borderColor: colors.border }]} intensity={18}>
            <Typography weight="bold" style={[styles.guestTitle, { color: colors.text }]}>
              Profilinizi görmək üçün daxil olun
            </Typography>
            <Typography style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
              Profil səhifənizə daxil olmaq üçün sistemdə olmalısınız.
            </Typography>
            <View style={styles.guestBtnWrap}>
              <Button label="Daxil ol" onPress={() => router.push('/login' as any)} />
            </View>
          </GlassSurface>
        </View>
      </View>
    )
  }

  if (authLoading || (user && !profile)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader rightExtras={settingsHeaderButton} />
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      </View>
    )
  }

  const rank = (profile?.username === 'xeyalnecefsoy' ? 'founder' : profile?.rank) || 'novice'
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader rightExtras={settingsHeaderButton} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        {/* Profile card (veb ilə eyni): banner + avatar + name + badge + edit/logout */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {/* Banner + avatar bir wrapper-da: avatar yalnız bannerin alt kənarına nisbətən yerləşir */}
        <View style={styles.bannerAvatarWrap}>
          <View style={styles.bannerWrap}>
            {profile?.banner_url ? (
              <Image source={{ uri: profile.banner_url }} style={styles.banner} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={['rgba(59,130,246,0.2)', 'rgba(168,85,247,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerPlaceholder}
              />
            )}
          </View>
          <View style={styles.avatarWrap}>
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              usernameOrId={profile?.username || user.id}
              size={96}
              style={[styles.avatar, { borderColor: colors.surface }]}
            />
          </View>
        </View>

        {/* Name + RankBadge + Edit + Logout */}
        <View style={styles.nameRow}>
          <View style={styles.nameBadgeRow}>
            <Typography weight="bold" style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {profile?.full_name || profile?.username || 'İstifadəçi'}
            </Typography>
            <RankBadge rank={rank} size="sm" showLabel />
          </View>
          <View style={styles.actionsRow}>
            <Pressable onPress={() => {}} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <Feather name="edit-2" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={signOut} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <Feather name="log-out" size={20} color={Colors.error} />
            </Pressable>
          </View>
        </View>

        <Typography style={[styles.username, { color: colors.textSecondary }]}>
          @{profile?.username || 'unknown'}
        </Typography>
        {profile?.bio ? (
          <Typography style={[styles.bio, { color: colors.text }]}>{profile.bio}</Typography>
        ) : null}

        {/* Stats 2x3: birinci sıra rəngli fon, ikinci sıra neytral */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCell label="Oxunmuş Kitablar" value={profile?.books_read ?? 0} color="#60a5fa" colors={colors} tintBg isDark={isDark} />
            <StatCell label="Rəylər" value={profile?.reviews_count ?? 0} color="#4ade80" colors={colors} tintBg isDark={isDark} />
            <StatCell label="Rəy Bəyənmələri" value={profile?.review_likes_received ?? 0} color="#fbbf24" colors={colors} tintBg isDark={isDark} />
          </View>
          <View style={styles.statsRow}>
            <StatCell label="Paylaşımlar" value={postsCount} neutral colors={colors} />
            <StatCell label="İzlənilənlər" value={followingCount} neutral colors={colors} />
            <StatCell label="İzləyicilər" value={followersCount} neutral colors={colors} />
          </View>
        </View>

        {joinDate ? (
          <Typography style={[styles.joinDate, { color: colors.textTertiary }]}>
            Qoşulub {joinDate}
          </Typography>
        ) : null}
      </View>

      {/* Mənim Paylaşımlarım */}
      <Typography weight="bold" style={[styles.sectionTitle, { color: colors.text }]}>
        Mənim Paylaşımlarım
      </Typography>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.brand} style={{ marginVertical: Spacing.xl }} />
      ) : profilePosts.length === 0 ? (
        <View style={[styles.emptyPosts, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Typography style={{ color: colors.textSecondary }}>Paylaşım yoxdur</Typography>
        </View>
      ) : (
        <View style={styles.postsList}>
          {profilePosts.map(post => (
            <SocialPostCard key={post.id} post={post as any} />
          ))}
        </View>
      )}
      </ScrollView>
    </View>
  )
}

// Dark mode stat card backgrounds (web-aligned: navy, forest green, brown-maroon)
const STAT_BG_DARK = {
  // Web-dəki kimi /20 opacity (gradient əvəzi RN-də tək background ilə yaxınlaşdırırıq)
  blue: 'rgba(30, 58, 138, 0.22)',   // blue-900 /20
  green: 'rgba(20, 83, 45, 0.22)',   // green-900 /20
  amber: 'rgba(120, 53, 15, 0.22)',  // amber-900 /20
} as const

function StatCell({
  label,
  value,
  color,
  neutral,
  colors,
  tintBg,
  isDark,
}: {
  label: string
  value: number
  color?: string
  neutral?: boolean
  colors: typeof Colors.dark
  tintBg?: boolean
  isDark?: boolean
}) {
  let bg = colors.surfaceHover || colors.surface
  if (tintBg && color) {
    if (isDark) {
      bg = color === '#60a5fa' ? STAT_BG_DARK.blue : color === '#4ade80' ? STAT_BG_DARK.green : STAT_BG_DARK.amber
    } else {
      bg = color === '#60a5fa' ? 'rgba(59, 130, 246, 0.2)' : color === '#4ade80' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)'
    }
  }
  return (
    <View style={[styles.statCell, { backgroundColor: bg, borderColor: tintBg && isDark ? 'transparent' : colors.border }]}>
      <Typography style={[styles.statLabel, { color: neutral ? colors.textTertiary : color }]}>{label}</Typography>
      <Typography weight="bold" style={[styles.statValue, { color: colors.text }]}>{value}</Typography>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: Spacing['3xl'] },
  guestCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  guestCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing['3xl'],
  },
  guestTitle: { fontSize: FontSize.xl, textAlign: 'center', marginBottom: Spacing.md },
  guestSubtitle: { fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing['2xl'], lineHeight: 22 },
  guestBtnWrap: { alignItems: 'center' },
  scrollView: { flex: 1 },
  // Upper gap between AppHeader and the first content card
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: 40, paddingHorizontal: Spacing.lg },
  title: { fontSize: FontSize['2xl'], marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing['3xl'] },

  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  bannerAvatarWrap: {
    position: 'relative',
  },
  bannerWrap: { width: '100%', aspectRatio: 4 / 1 },
  banner: { width: '100%', height: '100%' },
  bannerPlaceholder: { width: '100%', height: '100%' },
  avatarWrap: {
    position: 'absolute',
    left: Spacing.lg,
    bottom: -48,
    width: 96,
    height: 96,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    gap: Spacing.md,
  },
  nameBadgeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  name: { fontSize: FontSize['2xl'], flexShrink: 0 },
  actionsRow: { flexDirection: 'row', gap: Spacing.xs },
  iconBtn: { padding: Spacing.sm },
  username: { fontSize: FontSize.md, marginTop: Spacing.xs, paddingHorizontal: Spacing.lg },
  bio: { fontSize: FontSize.sm, marginTop: Spacing.md, paddingHorizontal: Spacing.lg, lineHeight: 20 },
  statsGrid: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statValue: { fontSize: FontSize.lg },
  joinDate: { fontSize: 12, marginTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },

  sectionTitle: { fontSize: FontSize.xl, marginBottom: Spacing.lg },
  emptyPosts: {
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  postsList: { gap: Spacing.lg },
})
