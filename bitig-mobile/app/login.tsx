import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  async function handleEmailAuth() {
    if (!email || !password) {
      Alert.alert('Xəta', 'Email və şifrəni daxil edin')
      return
    }

    setLoading(true)
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        Alert.alert('Xəta', error.message)
      } else {
        Alert.alert('Uğurlu!', 'Hesabınız yaradıldı. Email-inizi təsdiqləyin.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        Alert.alert('Xəta', error.message)
      } else {
        router.back()
      }
    }

    setLoading(false)
  }

  async function handleGoogleAuth() {
    try {
      setLoading(true)
      const redirectUrl = Linking.createURL('/(tabs)')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      })

      if (error) throw error
      
      if (data?.url) {
        // Since we're in Expo managed workflow, we let the browser handle it
        // The redirection will be caught by the app's scheme handler
        console.log('OAuth URL:', data.url)
      }
    } catch (e: any) {
      Alert.alert('Xəta', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={{ fontSize: 56 }}>📚</Text>
          <Text style={[styles.title, { color: colors.text }]}>Bitig</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSignUp ? 'Yeni hesab yaradın' : 'Hesabınıza daxil olun'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.text 
            }]}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.text 
            }]}
            placeholder="Şifrə"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Pressable
            style={[styles.primaryButton, { backgroundColor: Colors.brand, opacity: loading ? 0.7 : 1 }]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Qeydiyyat' : 'Daxil Ol'}
              </Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary, backgroundColor: colors.background }]}>
              və ya
            </Text>
          </View>

          <Pressable
            style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleGoogleAuth}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={[styles.googleButtonText, { color: colors.text }]}>
              Google ilə davam et
            </Text>
          </Pressable>
        </View>

        {/* Toggle sign up / sign in */}
        <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleButton}>
          <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
            {isSignUp ? 'Artıq hesabınız var? ' : 'Hesabınız yoxdur? '}
            <Text style={{ color: Colors.brand, fontWeight: '600' }}>
              {isSignUp ? 'Daxil olun' : 'Qeydiyyatdan keçin'}
            </Text>
          </Text>
        </Pressable>

        {/* Close button */}
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: colors.textTertiary }]}>Bağla</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: '800',
    marginTop: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
  },
  form: {
    gap: Spacing.md,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.md,
  },
  primaryButton: {
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
  toggleText: {
    fontSize: FontSize.sm,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  closeText: {
    fontSize: FontSize.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.sm,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DB4437',
  },
  googleButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
})
