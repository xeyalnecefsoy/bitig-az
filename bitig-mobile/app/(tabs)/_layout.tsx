import React from 'react'
import { Tabs } from 'expo-router'
import { useColorScheme, Platform, useWindowDimensions } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useLocale } from '@/context/locale'

function TabIcon({
  name,
  color,
  size,
}: {
  name: keyof typeof Feather.glyphMap
  color: string
  size?: number
}) {
  return <Feather name={name} size={size ?? 22} color={color} />
}

export default function TabLayout() {
  const { t } = useLocale()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const { width } = useWindowDimensions()
  // Label-ların kəsilməməsi üçün daha geniş breakpoint götürürük
  const isSmallScreen = width <= 390

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: isDark ? '#ffffff' : colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#000000' : colors.background,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
          // Native tab bar label'ları üçün kifayət qədər vertical space
          height: Platform.OS === 'ios' ? (isSmallScreen ? 92 : 84) : (isSmallScreen ? 84 : 76),
          paddingBottom: Platform.OS === 'ios' ? (isSmallScreen ? 24 : 20) : (isSmallScreen ? 10 : 8),
          paddingTop: isSmallScreen ? 8 : 10,
          elevation: 0,
        },
        tabBarItemStyle: {
          paddingVertical: isSmallScreen ? 8 : 10,
        },
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 10 : 11,
          lineHeight: isSmallScreen ? 12 : 14,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          fontFamily: Platform.select({ ios: 'Inter_700Bold', android: 'Inter_700Bold', default: 'Inter_700Bold' }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav_audiobooks'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <TabIcon name="headphones" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: t('nav_social'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <TabIcon name="message-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('dm_title'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <TabIcon name="send" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav_profile'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <TabIcon name="user" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('nav_cart'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <TabIcon name="shopping-cart" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
