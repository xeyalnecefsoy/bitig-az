import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, useColorScheme, Pressable, TextInput, Modal } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { SocialProvider, useSocial } from '@/context/social'
import { SocialComposer } from '@/components/social/SocialComposer'
import { SocialFeed } from '@/components/social/SocialFeed'
import { SocialLoginPrompt } from '@/components/social/SocialLoginPrompt'
import { useRouter } from 'expo-router'

type TabKey = 'foryou' | 'feed' | 'following'
type SortKey = 'newest' | 'oldest' | 'popular'

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey
  onChange: (v: SortKey) => void
}) {
  const [open, setOpen] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const label = value === 'newest' ? 'Ən yenilər' : value === 'oldest' ? 'Ən köhnələr' : 'Populyar'

  return (
    <View>
      <Pressable
        style={[styles.sortBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => setOpen(true)}
      >
        <Typography style={{ color: colors.text, fontSize: FontSize.sm }}>
          {label}
        </Typography>
        <Feather name="chevron-down" size={16} color={colors.textTertiary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {(['newest', 'oldest', 'popular'] as SortKey[]).map(key => (
              <Pressable
                key={key}
                style={styles.modalItem}
                onPress={() => {
                  onChange(key)
                  setOpen(false)
                }}
                onPressIn={(e: any) => e?.stopPropagation?.()}
              >
                <Typography style={{ color: key === value ? Colors.brand : colors.textSecondary, fontSize: FontSize.sm }}>
                  {key === 'newest' ? 'Ən yenilər' : key === 'oldest' ? 'Ən köhnələr' : 'Populyar'}
                </Typography>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

function SocialScreenInner() {
  const router = useRouter()
  const { currentUser, posts, following, loading, hasMorePosts, loadMorePosts, loadForYouPosts, loadFeedPosts } = useSocial()
  const [tab, setTab] = useState<TabKey>('foryou')
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('newest')

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const filteredPosts = useMemo(() => {
    let result = posts as any[]

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter(p => (p.content || '').toLowerCase().includes(q))
    }

    if (tab === 'following') {
      result = result.filter(p => following.includes(p.userId))
    }

    const sorted = [...result]
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0))
    }

    return sorted
  }, [following, posts, searchQuery, sortBy, tab])

  useEffect(() => {
    // Tab dəyişdikdə müvafiq post siyahısını yenilə
    if (tab === 'foryou') {
      loadForYouPosts()
    } else {
      loadFeedPosts()
    }
  }, [loadFeedPosts, loadForYouPosts, tab])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      if (tab === 'foryou') {
        await loadForYouPosts()
      } else {
        await loadFeedPosts()
      }
    } finally {
      setRefreshing(false)
    }
  }, [loadFeedPosts, loadForYouPosts, tab])

  const onEndReached = useCallback(async () => {
    if (!hasMorePosts) return
    await loadMorePosts()
  }, [hasMorePosts, loadMorePosts])

  const handleGroupsPress = () => {
    router.push('/social/groups' as any)
  }

  const listHeader = currentUser ? <SocialComposer /> : <SocialLoginPrompt />

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBlock}>
        <Typography weight="bold" style={{ color: colors.text, fontSize: 28 }}>
          Sosial
        </Typography>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tabBtn, tab === 'foryou' && { borderBottomColor: Colors.brand, borderBottomWidth: 2 }]}
          onPress={() => setTab('foryou')}
        >
          <Typography style={{ color: tab === 'foryou' ? Colors.brand : colors.textTertiary, fontWeight: '600' }}>
            Sizin Üçün
          </Typography>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, tab === 'feed' && { borderBottomColor: Colors.brand, borderBottomWidth: 2 }]}
          onPress={() => setTab('feed')}
        >
          <Typography style={{ color: tab === 'feed' ? Colors.brand : colors.textTertiary, fontWeight: '600' }}>
            Ən Yenilər
          </Typography>
        </Pressable>

        {currentUser && (
          <Pressable
            style={[
              styles.tabBtn,
              tab === 'following' && { borderBottomColor: Colors.brand, borderBottomWidth: 2 },
            ]}
            onPress={() => setTab('following')}
          >
            <Typography
              style={{ color: tab === 'following' ? Colors.brand : colors.textTertiary, fontWeight: '600' }}
            >
              İzlənilənlər
            </Typography>
          </Pressable>
        )}

        <Pressable style={styles.groupsBtn} onPress={handleGroupsPress}>
          <Typography style={{ color: colors.textSecondary, fontWeight: '600' }}>İcmalar</Typography>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="İstifadəçi və ya paylaşım axtar..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </View>
      </View>

      <SocialFeed
        posts={loading ? [] : (filteredPosts as any)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        hasMorePosts={hasMorePosts}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingPad}>
              <Typography style={{ color: colors.textTertiary }}>Yüklənir...</Typography>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={44} color={colors.textTertiary} />
              <Typography
                style={{ color: colors.textSecondary, marginTop: 10, fontSize: FontSize.md }}
              >
                Hələ heç bir post yoxdur
              </Typography>
            </View>
          )
        }
      />
    </View>
  )
}

export default function SocialScreen() {
  return <SocialScreenInner />
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  tabBtn: {
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
  groupsBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  sortBtn: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingPad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyState: {
    paddingTop: 100,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 18,
  },
  modalBox: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 10,
    overflow: 'hidden',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
})
