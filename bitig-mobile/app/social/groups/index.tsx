import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, FlatList, Pressable, useColorScheme, ActivityIndicator, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { Image } from 'expo-image'

type Group = {
  id: string
  name: string
  slug: string
  description?: string | null
  icon_url?: string | null
  cover_url?: string | null
  is_official: boolean
  members_count: number
  posts_count: number
  created_at: string
}

type SortKey = 'popular' | 'newest' | 'alphabetical'

export default function GroupsIndexScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('popular')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .order('members_count', { ascending: false })

        if (error) throw error
        if (mounted) setGroups((data || []) as any)
      } catch (e) {
        console.error('Error loading groups:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let result = [...groups]
    if (q) {
      result = result.filter(g => {
        const nameMatch = (g.name || '').toLowerCase().includes(q)
        const descMatch = (g.description || '').toLowerCase().includes(q)
        return nameMatch || descMatch
      })
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name, 'az'))
        break
      case 'popular':
      default:
        result.sort((a, b) => (b.members_count || 0) - (a.members_count || 0))
        break
    }

    return result
  }, [groups, searchQuery, sortBy])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={20} color={colors.text} />
        </Pressable>
        <Typography weight="bold" style={{ color: colors.text, fontSize: 18 }}>
          İcmalar
        </Typography>
      </View>

      <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Feather name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Axtar..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.sortRow}>
          <Pressable style={styles.sortChip} onPress={() => setSortBy('popular')}>
            <Typography style={{ color: sortBy === 'popular' ? Colors.brand : colors.textTertiary, fontWeight: '600' }}>
              Populyar
            </Typography>
          </Pressable>
          <Pressable style={styles.sortChip} onPress={() => setSortBy('newest')}>
            <Typography style={{ color: sortBy === 'newest' ? Colors.brand : colors.textTertiary, fontWeight: '600' }}>
              Yeni
            </Typography>
          </Pressable>
          <Pressable style={styles.sortChip} onPress={() => setSortBy('alphabetical')}>
            <Typography style={{ color: sortBy === 'alphabetical' ? Colors.brand : colors.textTertiary, fontWeight: '600' }}>
              Əlifba
            </Typography>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingPad}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 26 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.groupCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => router.push(`/social/groups/${item.slug}` as any)}
            >
              <View style={styles.groupIconWrap}>
                {item.icon_url ? (
                  <Image source={{ uri: item.icon_url }} style={styles.groupIcon} contentFit="cover" />
                ) : (
                  <View style={[styles.groupIcon, { backgroundColor: colors.surfaceHover, alignItems: 'center', justifyContent: 'center' }]}>
                    <Typography weight="bold" style={{ color: Colors.brand }}>
                      {item.name?.charAt(0)?.toUpperCase()}
                    </Typography>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Typography weight="bold" style={{ color: colors.text }} numberOfLines={1}>
                  {item.name}
                </Typography>
                <Typography style={{ color: colors.textTertiary, marginTop: 6 }} numberOfLines={1}>
                  {item.members_count} üzv
                </Typography>
                {!!item.description && (
                  <Typography style={{ color: colors.textSecondary, marginTop: 6 }} numberOfLines={2}>
                    {item.description}
                  </Typography>
                )}
              </View>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyPad}>
              <Feather name="users" size={40} color={colors.textTertiary} />
              <Typography style={{ color: colors.textTertiary, marginTop: 10 }}>İcma tapılmadı</Typography>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 8, borderRadius: 9999 },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  loadingPad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPad: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  groupCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  groupIconWrap: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden' },
  groupIcon: { width: 52, height: 52, borderRadius: 26 },
})

