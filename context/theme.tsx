"use client"
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeState = {
  theme: Theme
  toggle: () => void
  set: (t: Theme) => void
}

const ThemeCtx = createContext<ThemeState | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  // Load preference on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('bitig_theme') as Theme | null
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial: Theme = saved ?? (prefersDark ? 'dark' : 'light')
      setTheme(initial)
    } catch {}
  }, [])

  // Apply class to <html> and persist
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { window.localStorage.setItem('bitig_theme', theme) } catch {}
  }, [theme])

  const value = useMemo<ThemeState>(() => ({
    theme,
    toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
    set: (t: Theme) => setTheme(t),
  }), [theme])

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
