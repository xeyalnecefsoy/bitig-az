/**
 * Bitig.az Design Tokens
 * Matches the web app's design system
 */

export const Colors = {
  // Brand
  brand: '#4AD860',
  brandLight: '#59E173',
  brandDark: '#36B14A',

  // Neutral
  light: {
    background: '#ffffff', // neutral-0
    surface: '#fafafa', // neutral-50
    surfaceHover: '#f5f5f5', // neutral-100-ish
    border: '#e5e5e5', // neutral-200
    borderLight: '#f0f0f0',
    text: '#0a0a0a', // neutral-950
    textSecondary: '#525252', // neutral-600
    textTertiary: '#a3a3a3', // neutral-400
    glass: 'rgba(255,255,255,0.72)',
    glassStrong: 'rgba(255,255,255,0.88)',
  },
  dark: {
    background: '#000000',
    surface: '#171717', // neutral-900
    surfaceHover: '#262626', // neutral-800
    border: '#262626', // neutral-800
    borderLight: '#1a1a1a',
    text: '#fafafa', // neutral-50
    textSecondary: '#a3a3a3', // neutral-400
    textTertiary: '#737373', // neutral-500
    glass: 'rgba(10,10,10,0.72)',
    glassStrong: 'rgba(10,10,10,0.88)',
  },

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
}

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
}

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}
