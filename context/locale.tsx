"use client"
import { createContext, useContext } from 'react'
import type { Locale } from '@/lib/i18n'

const LocaleCtx = createContext<Locale>('en')

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleCtx.Provider value={locale}>{children}</LocaleCtx.Provider>
}

export function useLocale() {
  return useContext(LocaleCtx)
}

export function pickByLocale<T>(locale: Locale, en: T, az: T): T {
  return locale === 'az' ? az : en
}
