import React, { useLayoutEffect } from 'react'
import { View, StyleSheet, Pressable, useColorScheme } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { useLocale, type Locale } from '@/context/locale'
import { useThemePreference, type ThemePreference } from '@/context/themePreference'

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { t, locale, setLocale } = useLocale()
  const { preference, setPreference } = useThemePreference()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('mobile_settings_title') })
  }, [navigation, t])

  const themeOptions: { value: ThemePreference; labelKey: string }[] = [
    { value: 'system', labelKey: 'mobile_theme_system' },
    { value: 'light', labelKey: 'mobile_theme_light' },
    { value: 'dark', labelKey: 'mobile_theme_dark' },
  ]

  const localeOptions: { value: Locale; label: string }[] = [
    { value: 'az', label: 'AZ' },
    { value: 'en', label: 'EN' },
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Typography weight="semibold" style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('mobile_language')}
      </Typography>
      <View style={[styles.rowGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {localeOptions.map((opt, index) => {
          const selected = locale === opt.value
          return (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                styles.row,
                index < localeOptions.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
                  : { borderBottomWidth: 0 },
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => setLocale(opt.value)}
            >
              <Typography style={[styles.rowLabel, { color: colors.text }]}>{opt.label}</Typography>
              {selected ? (
                <Typography weight="semibold" style={{ color: Colors.brand }}>
                  ✓
                </Typography>
              ) : null}
            </Pressable>
          )
        })}
      </View>

      <Typography weight="semibold" style={[styles.sectionLabel, styles.sectionSpacer, { color: colors.textSecondary }]}>
        {t('mobile_appearance')}
      </Typography>
      <View style={[styles.rowGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {themeOptions.map((opt, index) => {
          const selected = preference === opt.value
          return (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                styles.row,
                index < themeOptions.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
                  : { borderBottomWidth: 0 },
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => setPreference(opt.value)}
            >
              <Typography style={[styles.rowLabel, { color: colors.text }]}>{t(opt.labelKey)}</Typography>
              {selected ? (
                <Typography weight="semibold" style={{ color: Colors.brand }}>
                  ✓
                </Typography>
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionSpacer: {
    marginTop: Spacing.xl,
  },
  rowGroup: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowLabel: {
    fontSize: FontSize.md,
  },
})
