import { useContext } from 'react'
import { AudioContext } from '@/context/audioContext'

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return ctx
}
