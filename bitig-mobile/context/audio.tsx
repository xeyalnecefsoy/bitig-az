/**
 * Fallback when `@/context/audio` resolves here (e.g. some TS tooling paths).
 * Must NOT re-export `./audio.native`: that pulls `useProgress` from RNTP and breaks web.
 * Metro still prefers `audio.native.tsx` / `audio.web.tsx` at bundle time.
 */
export { AudioProvider } from './audio.web'
export { useAudio } from './useAudio'
