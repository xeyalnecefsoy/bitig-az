"use client"

import { AudioPlayer } from '@/components/AudioPlayer'
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
  return (
    <div className="w-full">
      <AudioPlayer tracks={tracks} title={title} cover={cover} />
    </div>
  )
}
