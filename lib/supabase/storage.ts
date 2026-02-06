import { createClient } from './client'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 5MB.' }
  }
  
  return { valid: true }
}

export async function uploadAudiobookCover(file: File): Promise<{ url: string | null; error: string | null }> {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { url: null, error: validation.error || 'Invalid file' }
  }

  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `covers/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('audiobook-covers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const { data } = supabase.storage
    .from('audiobook-covers')
    .getPublicUrl(filePath)

  return { url: data.publicUrl, error: null }
}

export async function uploadAvatar(file: File, userId: string): Promise<{ url: string | null; error: string | null }> {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { url: null, error: validation.error || 'Invalid file' }
  }

  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  // Delete old avatar if exists
  await supabase.storage
    .from('avatars')
    .remove([filePath])

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return { url: data.publicUrl, error: null }
}

export async function uploadBanner(file: File, userId: string): Promise<{ url: string | null; error: string | null }> {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { url: null, error: validation.error || 'Invalid file' }
  }

  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}_banner.${fileExt}`
  const filePath = `${userId}/${fileName}`

  // Delete old banner if exists (we don't strictly need to do this if we overwrite, but good for cleanup if ext changes)
  // Actually, standardizing on one extension or just overwriting is easier if we knew the old path, 
  // but let's just upload with upsert: true. 
  // Ideally we'd remove old ones to save space if extension differs, but for now specific naming is fine.
  
  const { error: uploadError } = await supabase.storage
    .from('avatars') // Reusing avatars bucket for user-specific public images
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Append timestamp to force refresh cache on client
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}

export async function deleteAudiobookCover(url: string): Promise<{ success: boolean; error: string | null }> {
  if (!url || !url.includes('audiobook-covers')) {
    return { success: true, error: null }
  }

  const supabase = createClient()
  const path = url.split('/audiobook-covers/')[1]
  
  if (!path) {
    return { success: true, error: null }
  }

  const { error } = await supabase.storage
    .from('audiobook-covers')
    .remove([path])

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

const MAX_AUDIO_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a', 'audio/aac']

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Some browsers might have different mime types for mp3, so we check extension too
  const isMp3 = file.name.toLowerCase().endsWith('.mp3')
  
  if (!ALLOWED_AUDIO_TYPES.includes(file.type) && !isMp3) {
    return { valid: false, error: 'Invalid file type. Please upload an MP3, WAV, or AAC audio file.' }
  }
  
  if (file.size > MAX_AUDIO_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 100MB.' }
  }
  
  return { valid: true }
}

export async function uploadAudioTrack(file: File): Promise<{ url: string | null; error: string | null; duration?: number }> {
  const validation = validateAudioFile(file)
  if (!validation.valid) {
    return { url: null, error: validation.error || 'Invalid file' }
  }

  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `tracks/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('audiobooks')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    return { url: null, error: uploadError.message }
  }

  const { data } = supabase.storage
    .from('audiobooks')
    .getPublicUrl(filePath)

  return { url: data.publicUrl, error: null }
}

export async function deleteAudioTrack(url: string): Promise<{ success: boolean; error: string | null }> {
  if (!url || !url.includes('audiobooks')) {
    return { success: true, error: null }
  }

  const supabase = createClient()
  const path = url.split('/audiobooks/')[1]
  
  if (!path) {
    return { success: true, error: null }
  }

  const { error } = await supabase.storage
    .from('audiobooks')
    .remove([path])

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
