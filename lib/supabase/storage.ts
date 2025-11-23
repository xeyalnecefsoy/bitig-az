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
