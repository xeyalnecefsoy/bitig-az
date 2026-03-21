import React from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import type { Post } from '@/lib/types'
import { SocialPostCard } from './SocialPostCard'

type SocialPost = Post & {
  poll?: any
  status?: string
  rejectedAt?: string | null
  updatedAt?: string | null
}

export function SocialFeed({
  posts,
  refreshing,
  onRefresh,
  onEndReached,
  hasMorePosts,
  ListHeaderComponent,
  ListEmptyComponent,
}: {
  posts: SocialPost[]
  refreshing: boolean
  onRefresh: () => Promise<void> | void
  onEndReached: () => Promise<void> | void
  hasMorePosts: boolean
  ListHeaderComponent?: React.ReactElement
  ListEmptyComponent?: React.ReactElement
}) {
  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <SocialPostCard post={item} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      onEndReached={() => {
        if (hasMorePosts) onEndReached()
      }}
      onEndReachedThreshold={0.2}
      ListEmptyComponent={
        ListEmptyComponent ? (
          ListEmptyComponent
        ) : (
          <View style={styles.emptyPad} />
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 26,
  },
  emptyPad: {
    height: 40,
  },
})

