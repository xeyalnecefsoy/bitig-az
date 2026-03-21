import React, { useState } from 'react'
import { View, Pressable, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { createSessionFromUrl } from '@/lib/auth'
import { Feather } from '@expo/vector-icons'
import { Input } from '@/components/ui/Input'
import { Typography } from '@/components/ui/Typography'

const AGE_ERROR_MSG = 'Qeydiyyatdan keçmək üçün ən azı 13 yaşında olmalısınız.'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light
  const router = useRouter()

  async function handleEmailAuth() {
    setError(null)
    if (isSignUp) {
      if (!email || !password || !fullName || !age) {
        setError('Ad, yaş, e-poçt və şifrəni daxil edin')
        return
      }

      const parsedAge = parseInt(age, 10)
      if (Number.isNaN(parsedAge) || parsedAge < 13) {
        setError(AGE_ERROR_MSG)
        return
      }

      setLoading(true)

      const username = email.split('@')[0]

      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            age: parsedAge,
          },
        },
      })

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          username,
          full_name: fullName,
          age: parsedAge,
          avatar_url: `/api/avatar?name=${user.id}`,
          updated_at: new Date().toISOString(),
        })
      }

      Alert.alert('Uğurlu!', 'Hesabınız yaradıldı. Email-inizi təsdiqləyin.')
    } else {
      if (!email || !password) {
        setError('E-poçt və şifrəni daxil edin')
        return
      }

      setLoading(true)

      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      if (router.canGoBack()) router.back()
      else router.replace('/(tabs)')
    }

    setLoading(false)
  }

  async function handleGoogleAuth() {
    setError(null)
    try {
      setLoading(true)
      // Native: Expo Go-da exp://... lazımdır; custom/build-də bitig:// ki, vebə yönləndirməsin
      const rawRedirect = makeRedirectUri({ path: 'auth/callback' })
      const isExpoGo = Constants.appOwnership === 'expo'
      const scheme = Constants.expoConfig?.scheme ?? 'bitig'
      const redirectTo =
        Platform.OS === 'web'
          ? rawRedirect
          : isExpoGo
            ? rawRedirect
            : `${scheme}://auth/callback`

      // Expo Go: redirect URL cihazın IP-si ilə dəyişir; bu URL-i Supabase Redirect URLs-ə əlavə edin
      if (__DEV__ && redirectTo.startsWith('exp://')) {
        Alert.alert(
          'Redirect URL (Expo Go)',
          `Supabase-də bu URL əlavə olunmalıdır:\n\n${redirectTo}\n\nAuthentication → URL Configuration → Redirect URLs → Add URL`,
          [{ text: 'OK' }]
        )
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
        if (result.type === 'success' && result.url) {
          const ok = await createSessionFromUrl(result.url)
          if (ok) {
            if (router.canGoBack()) router.back()
            else router.replace('/(tabs)')
          }
        } else if (result.type === 'cancel') {
          setError('Google ilə giriş ləğv edildi')
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Xəta baş verdi')
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
        {/* Header: ikon + Bitig + subtitle + toggle (veb ilə eyni) */}
        <View style={styles.header}>
          <Feather name="book-open" size={48} color={Colors.brand} />
          <Typography weight="bold" style={[styles.brandTitle, { color: colors.text }]}>
            Bitig
          </Typography>
          <Typography style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSignUp ? 'Hesab yaradın' : 'Hesabınıza daxil olun'}
          </Typography>
          <Typography
            style={[styles.toggleText, { color: colors.textSecondary }]}
            onPress={() => { setIsSignUp(!isSignUp); setError(null) }}
          >
            {isSignUp ? 'Artıq hesabınız var? ' : 'Hesabınız yoxdur? '}
            <Typography weight="semibold" style={{ color: Colors.brand }}>
              {isSignUp ? 'Daxil ol' : 'Qeydiyyatdan keç'}
            </Typography>
          </Typography>
        </View>

        {/* Google düyməsi (veb: əvvəldə, tünd fon + border) */}
        <Pressable
          onPress={handleGoogleAuth}
          disabled={loading}
          style={({ pressed }) => [
            styles.googleButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: loading ? 0.6 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <Feather name="chrome" size={18} color={colors.text} />
          <Typography weight="semibold" style={[styles.googleButtonText, { color: colors.text }]}>
            Google ilə daxil ol
          </Typography>
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Typography style={[styles.dividerText, { color: colors.textTertiary, backgroundColor: colors.background }]}>
            Və ya e-poçt ilə davam edin
          </Typography>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {isSignUp && (
            <>
              <Input
                leftIcon="user"
                placeholder="Tam Ad"
                value={fullName}
                onChangeText={setFullName}
              />
              <Input
                leftIcon="hash"
                placeholder="Yaş"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </>
          )}
          <Input
            leftIcon="mail"
            placeholder="E-poçt ünvanı"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            leftIcon="lock"
            placeholder="Şifrə"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
          ) : null}

          <Pressable
            onPress={handleEmailAuth}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryButton,
              { opacity: loading ? 0.5 : pressed ? 0.9 : 1 },
            ]}
          >
            <Typography weight="semibold" style={styles.primaryButtonText}>
              {loading ? '...' : isSignUp ? 'Qeydiyyatdan keç' : 'Daxil ol'}
            </Typography>
          </Pressable>
        </View>

        <Typography
          style={[styles.closeText, { color: colors.textTertiary }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          Bağla
        </Typography>
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
    marginBottom: Spacing.xl,
  },
  brandTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  toggleText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  form: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.sm,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: FontSize.md,
  },
  closeText: {
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.lg,
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
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  googleButtonText: {
    fontSize: FontSize.md,
  },
})
