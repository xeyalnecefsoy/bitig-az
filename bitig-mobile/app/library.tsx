import React from 'react'
import { View, StyleSheet, useColorScheme } from 'react-native'
import { Colors } from '@/constants/Colors'
import { LibraryContent } from '@/components/LibraryContent'

export default function LibraryScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LibraryContent />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
