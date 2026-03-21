import React, { createContext, useContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'

WebBrowser.maybeCompleteAuthSession() // Required for web browser flow

import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  profile: Profile | null
  signOut: () => Promise<void>
}

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string
  banner_url?: string | null
  books_read?: number
  reviews_count?: number
  review_likes_received?: number
  created_at?: string
  rank?: string | null
}

import { registerForPushNotificationsAsync } from '@/lib/notifications'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        setupNotifications(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
          setupNotifications(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function setupNotifications(userId: string) {
    try {
      const token = await registerForPushNotificationsAsync()
      if (token) {
        console.log('Push Token Generated:', token)
        // Store token in database logic
      }
    } catch (e) {
      console.log('Failed to setup notifications:', e)
    }
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, role, banner_url, books_read, reviews_count, review_likes_received, created_at, rank')
      .eq('id', userId)
      .single()
    
    if (data) setProfile(data)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
