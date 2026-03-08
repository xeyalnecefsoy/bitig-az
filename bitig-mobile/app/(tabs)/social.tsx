import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, useColorScheme, Pressable,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { formatDistanceToNow } from '@/lib/utils'

interface SocialPost {
  id: string
  user_id: string
  content: string
  image_urls: string[] | null
  created_at: string
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
  likes_count: number
  comments_count: number
  liked_by_me: boolean
}

export default function SocialScreen() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const { user, profile } = useAuth()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    const { data, error } = await supabase
      .from('social_posts')
      .select(`
        id, user_id, content, image_urls, created_at,
        profiles:user_id (username, full_name, avatar_url)
      `)
      .is('parent_post_id', null)
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) {
      // Get likes count and user's likes
      const postsWithMeta = await Promise.all(
        data.map(async (post: any) => {
          const { count: likesCount } = await supabase
            .from('social_likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)

          const { count: commentsCount } = await supabase
            .from('social_comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)

          let likedByMe = false
          if (user) {
            const { data: likeData } = await supabase
              .from('social_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single()
            likedByMe = !!likeData
          }

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            liked_by_me: likedByMe,
          }
        })
      )
      setPosts(postsWithMeta)
    }
    setLoading(false)
  }

  async function handleLike(postId: string) {
    if (!user) {
      router.push('/login' as any)
      return
    }

    const post = posts.find(p => p.id === postId)
    if (!post) return

    if (post.liked_by_me) {
      await supabase.from('social_likes').delete().eq('post_id', postId).eq('user_id', user.id)
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, liked_by_me: false, likes_count: p.likes_count - 1 } : p
      ))
    } else {
      await supabase.from('social_likes').insert({ post_id: postId, user_id: user.id })
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, liked_by_me: true, likes_count: p.likes_count + 1 } : p
      ))
    }
  }

  async function handlePost() {
    if (!user || !newPost.trim()) return
    setPosting(true)

    const { error } = await supabase.from('social_posts').insert({
      user_id: user.id,
      content: newPost.trim(),
    })

    if (error) {
      Alert.alert('Xəta', error.message)
    } else {
      setNewPost('')
      loadPosts()
    }
    setPosting(false)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadPosts()
    setRefreshing(false)
  }, [])

  const renderPost = ({ item }: { item: SocialPost }) => {
    const avatarUrl = item.profiles?.avatar_url || 
      `https://bitig.az/api/avatar?name=${encodeURIComponent(item.profiles?.username || item.user_id)}`

    return (
      <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.postHeader}>
          <Image source={avatarUrl} style={styles.avatar} contentFit="cover" />
          <View style={styles.postHeaderInfo}>
            <Text style={[styles.postName, { color: colors.text }]}>
              {item.profiles?.full_name || item.profiles?.username || 'İstifadəçi'}
            </Text>
            <Text style={[styles.postTime, { color: colors.textTertiary }]}>
              @{item.profiles?.username} · {formatDistanceToNow(item.created_at)}
            </Text>
          </View>
        </View>

        <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>

        {item.image_urls && item.image_urls.length > 0 && (
          <Image 
            source={item.image_urls[0]} 
            style={styles.postImage} 
            contentFit="cover"
            transition={200}
          />
        )}

        <View style={styles.postActions}>
          <Pressable style={styles.actionButton} onPress={() => handleLike(item.id)}>
            <Text style={{ fontSize: 16 }}>{item.liked_by_me ? '❤️' : '🤍'}</Text>
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>{item.likes_count}</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Text style={{ fontSize: 16 }}>💬</Text>
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>{item.comments_count}</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Composer */}
      {user && (
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.composerInput, { color: colors.text }]}
            placeholder="Nə düşünürsünüz?"
            placeholderTextColor={colors.textTertiary}
            value={newPost}
            onChangeText={setNewPost}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.postButton, { 
              backgroundColor: Colors.brand, 
              opacity: newPost.trim() && !posting ? 1 : 0.5 
            }]}
            onPress={handlePost}
            disabled={!newPost.trim() || posting}
          >
            <Text style={styles.postButtonText}>
              {posting ? '...' : 'Paylaş'}
            </Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>💬</Text>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.md }]}>
              Hələ heç bir post yoxdur
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  composerInput: {
    flex: 1,
    fontSize: FontSize.md,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  postButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  postButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  listContent: { paddingBottom: 20 },
  postCard: {
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postHeaderInfo: { flex: 1 },
  postName: { fontSize: FontSize.md, fontWeight: '600' },
  postTime: { fontSize: FontSize.xs, marginTop: 2 },
  postContent: {
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: Spacing['2xl'],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionCount: { fontSize: FontSize.sm },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
})
