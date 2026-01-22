"use client"
import { useEffect, useRef, useCallback } from 'react'
import { useAudio } from '@/context/audio'
import { useAuth } from '@/context/auth'
import { createClient } from '@/lib/supabase/client'

const SAVE_INTERVAL = 30000 // Save every 30 seconds
const MIN_LISTEN_TIME = 5 // Minimum seconds before saving

export function useListeningProgress(bookId: string | undefined, trackIndex: number) {
  const { currentTime, playing, track, duration } = useAudio()
  const { user } = useAuth()
  const supabase = createClient()
  
  const lastSaveRef = useRef(0)
  const accumulatedTimeRef = useRef(0)
  const lastTimeRef = useRef(0)

  // Save progress to database
  const saveProgress = useCallback(async (
    positionSeconds: number, 
    additionalTime: number = 0,
    completed: boolean = false
  ) => {
    if (!user || !bookId) return
    
    try {
      const { data: existing } = await supabase
        .from('listening_progress')
        .select('id, total_listened_seconds')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single()

      const totalListened = (existing?.total_listened_seconds || 0) + additionalTime

      if (existing) {
        await supabase
          .from('listening_progress')
          .update({
            track_index: trackIndex,
            position_seconds: Math.floor(positionSeconds),
            total_listened_seconds: totalListened,
            last_played_at: new Date().toISOString(),
            completed,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('listening_progress')
          .insert({
            user_id: user.id,
            book_id: bookId,
            track_index: trackIndex,
            position_seconds: Math.floor(positionSeconds),
            total_listened_seconds: additionalTime,
            completed
          })
      }

      // Update streak
      await supabase.rpc('update_user_streak', { p_user_id: user.id })
      
      console.log('[Progress] Saved:', { bookId, trackIndex, position: positionSeconds, total: totalListened })
    } catch (error) {
      console.error('[Progress] Save error:', error)
    }
  }, [user, bookId, trackIndex, supabase])

  // Load saved progress
  const loadProgress = useCallback(async (): Promise<{ trackIndex: number; position: number } | null> => {
    if (!user || !bookId) return null
    
    try {
      const { data } = await supabase
        .from('listening_progress')
        .select('track_index, position_seconds')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single()

      if (data) {
        return {
          trackIndex: data.track_index,
          position: data.position_seconds
        }
      }
    } catch (error) {
      // No existing progress
    }
    return null
  }, [user, bookId, supabase])

  // Track accumulated listening time
  useEffect(() => {
    if (playing && track?.bookId === bookId) {
      const timeDiff = currentTime - lastTimeRef.current
      if (timeDiff > 0 && timeDiff < 5) { // Avoid big jumps from seeking
        accumulatedTimeRef.current += timeDiff
      }
      lastTimeRef.current = currentTime
    }
  }, [currentTime, playing, track?.bookId, bookId])

  // Auto-save on interval
  useEffect(() => {
    if (!playing || !bookId || track?.bookId !== bookId) return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastSaveRef.current >= SAVE_INTERVAL && accumulatedTimeRef.current >= MIN_LISTEN_TIME) {
        saveProgress(currentTime, accumulatedTimeRef.current)
        lastSaveRef.current = now
        accumulatedTimeRef.current = 0
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [playing, bookId, currentTime, saveProgress, track?.bookId])

  // Save on pause/stop
  useEffect(() => {
    if (!playing && accumulatedTimeRef.current >= MIN_LISTEN_TIME && bookId && track?.bookId === bookId) {
      saveProgress(currentTime, accumulatedTimeRef.current)
      accumulatedTimeRef.current = 0
    }
  }, [playing, bookId, currentTime, saveProgress, track?.bookId])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (accumulatedTimeRef.current >= MIN_LISTEN_TIME && bookId) {
        // Can't await in cleanup, just fire and forget
        saveProgress(currentTime, accumulatedTimeRef.current)
      }
    }
  }, [bookId, currentTime, saveProgress])

  return { saveProgress, loadProgress }
}

// Hook to get continue listening books
export function useContinueListening() {
  const { user } = useAuth()
  const supabase = createClient()

  const getContinueListening = useCallback(async (limit: number = 5) => {
    if (!user) return []

    try {
      const { data } = await supabase
        .from('listening_progress')
        .select(`
          *,
          books:book_id (
            id, title, author, cover, cover_url
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('last_played_at', { ascending: false })
        .limit(limit)

      return data || []
    } catch (error) {
      console.error('[Progress] Load error:', error)
      return []
    }
  }, [user, supabase])

  return { getContinueListening }
}
