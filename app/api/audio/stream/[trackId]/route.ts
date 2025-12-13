import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getR2SignedUrl } from '@/lib/cloudflare/r2'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params

    // Get track info from database
    const supabase = await createClient()
    const { data: track, error } = await supabase
      .from('book_tracks')
      .select('r2_key, audio_url')
      .eq('id', trackId)
      .single()

    if (error || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    // If track has R2 key, generate signed URL
    if (track.r2_key) {
      const { url, error: signError } = await getR2SignedUrl(track.r2_key)

      if (signError || !url) {
        return NextResponse.json(
          { error: signError || 'Failed to generate URL' },
          { status: 500 }
        )
      }

      // Redirect to signed URL
      return NextResponse.redirect(url)
    }

    // Fallback to legacy audio_url (for backwards compatibility)
    if (track.audio_url) {
      return NextResponse.redirect(track.audio_url)
    }

    return NextResponse.json({ error: 'No audio available' }, { status: 404 })
  } catch (error) {
    console.error('Stream error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
