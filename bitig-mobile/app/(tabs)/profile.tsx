import React from 'react'
import { View, Text, StyleSheet, useColorScheme, Pressable, ScrollView } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { useAuth } from '@/context/auth'

export default function ProfileScreen() {
  const { user, profile, loading, signOut } = useAuth()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>📚</Text>
        <Text style={[styles.title, { color: colors.text }]}>Bitig-ə Xoş Gəlmisiniz</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Daxil olun ki, kitabxananıza çatın
        </Text>
        <Pressable
          style={[styles.loginButton, { backgroundColor: Colors.brand }]}
          onPress={() => router.push('/login' as any)}
        >
          <Text style={styles.loginButtonText}>Daxil Ol</Text>
        </Pressable>
      </View>
    )
  }

  const avatarUrl = profile?.avatar_url || `https://bitig.az/api/avatar?name=${encodeURIComponent(profile?.username || user.id)}`

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={avatarUrl}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        <Text style={[styles.name, { color: colors.text }]}>
          {profile?.full_name || profile?.username || 'İstifadəçi'}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{profile?.username || 'unknown'}
        </Text>
        {profile?.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
        )}
      </View>

      {/* Menu Items */}
      <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MenuItem 
          icon="📖" 
          label="Kitabxanam" 
          colors={colors}
          onPress={() => router.push('/(tabs)/library' as any)} 
        />
        <MenuItem 
          icon="⚙️" 
          label="Tənzimləmələr" 
          colors={colors}
          onPress={() => {}} 
        />
        <MenuItem 
          icon="📞" 
          label="Əlaqə" 
          colors={colors}
          onPress={() => {}} 
        />
      </View>

      {/* Sign Out */}
      <Pressable
        style={[styles.signOutButton, { borderColor: Colors.error }]}
        onPress={signOut}
      >
        <Text style={[styles.signOutText, { color: Colors.error }]}>Çıxış</Text>
      </Pressable>
    </ScrollView>
  )
}

function MenuItem({ icon, label, colors, onPress }: { 
  icon: string; label: string; colors: any; onPress: () => void 
}) {
  return (
    <Pressable 
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  loginButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['4xl'],
    borderRadius: BorderRadius.lg,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.lg,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  username: {
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  bio: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
    paddingHorizontal: Spacing['3xl'],
  },
  menuSection: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 0.5,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  signOutButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
})
