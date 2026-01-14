"use client"
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeState = {
  theme: Theme
  toggle: () => void
  set: (t: Theme) => void
}

const ThemeCtx = createContext<ThemeState | null>(null)

const STORAGE_KEY = 'bitig_theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with null to avoid hydration mismatch
  const [theme, setTheme] = useState<Theme | null>(null)
  const [mounted, setMounted] = useState(false)

  // On mount, read theme from localStorage or system preference
  useEffect(() => {
    setMounted(true)
    
    let initialTheme: Theme = 'light'
    
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null
      if (saved === 'light' || saved === 'dark') {
        initialTheme = saved
      } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        initialTheme = 'dark'
      }
    } catch {}
    
    setTheme(initialTheme)
    
    // Apply class immediately
    const root = document.documentElement
    if (initialTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  // Apply class to <html> when theme changes (after mount)
  useEffect(() => {
    if (!mounted || theme === null) return
    
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    try { 
      window.localStorage.setItem(STORAGE_KEY, theme) 
    } catch {}
  }, [theme, mounted])

  const value = useMemo<ThemeState>(() => ({
    theme: theme ?? 'light', // Fallback for SSR
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
