import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4AD860',
          50: '#EEFFF1',
          100: '#D7FFDE',
          200: '#A7F8B5',
          300: '#79EE90',
          400: '#59E173',
          500: '#4AD860',
          600: '#36B14A',
          700: '#2B8A3B',
          800: '#21692E',
          900: '#1B5526'
        }
      },
      boxShadow: {
        soft: '0 6px 24px rgba(0,0,0,0.06)'
      }
    },
  },
  plugins: [],
}
export default config
