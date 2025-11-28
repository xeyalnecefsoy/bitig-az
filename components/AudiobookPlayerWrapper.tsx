"use client"

import { AudioPlayer } from '@/components/AudioPlayer'
import { useAudio } from '@/context/audio'
import { useEffect } from 'react'

export function AudiobookPlayerWrapper({ 
  tracks, 
  title, 
  cover 
}: { 
  tracks: any[]
  title: string
  cover: string 
}) {
  const { play, track } = useAudio()

  // Optional: Auto-play or just load the track when entering the page
  // For now, we'll just let the user click play on the AudioPlayer component
  
  return (
    <div className="w-full">
      <AudioPlayer tracks={tracks} title={title} cover={cover} />
    </div>
  )
}
