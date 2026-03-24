import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToR2, generateAudioKey } from '@/lib/cloudflare/r2'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { logApi } from '@/lib/logger'

// Allowed audio formats
const ALLOWED_TYPES = [
  'audio/opus',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
]

const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (!checkRateLimit(`audio-upload:ip:${ip}`, 40, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }

    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!checkRateLimit(`audio-upload:user:${user.id}`, 20, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'coadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse form data
    const formData: any = await request.formData()
    const file = formData.get('file') as File
    const bookId = formData.get('bookId') as string
    const trackTitle = formData.get('trackTitle') as string

    if (!file || !bookId || !trackTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: file, bookId, trackTitle' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: OPUS, OGG, MP3, WAV' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 200MB' },
        { status: 400 }
      )
    }

    // Determine format from file type
    let format = 'opus'
    if (file.type.includes('mp3') || file.type.includes('mpeg')) {
      format = 'mp3'
    } else if (file.type.includes('wav')) {
      format = 'wav'
    } else if (file.type.includes('ogg')) {
      format = 'ogg'
    }

    // Generate R2 key
    const r2Key = generateAudioKey(bookId, trackTitle, format)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to R2
    const result = await uploadToR2(buffer, r2Key, file.type)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      r2Key: result.key,
      format,
      size: file.size,
    })
  } catch (error) {
    logApi('error', 'audio_upload_failed', { err: String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
