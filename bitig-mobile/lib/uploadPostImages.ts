import { supabase } from '@/lib/supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

function getFileExtFromMime(mimeType?: string | null, uri?: string) {
  if (mimeType) {
    const parts = mimeType.split('/')
    if (parts.length === 2 && parts[1]) return parts[1]
  }
  if (uri) {
    const ext = uri.split('.').pop()?.toLowerCase()
    return ext || 'jpg'
  }
  return 'jpg'
}

export async function uploadPostImages(uris: string[], userId: string): Promise<string[]> {
  const results: string[] = []

  for (const uri of uris) {
    if (!uri) continue

    const res = await fetch(uri)
    const blob = await res.blob()

    if (!ALLOWED_IMAGE_TYPES.includes(blob.type)) {
      throw new Error('Invalid image type')
    }
    if (blob.size > MAX_FILE_SIZE) {
      throw new Error('Image file too large')
    }

    const ext = getFileExtFromMime(blob.type, uri)
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, blob as any, {
        cacheControl: '3600',
        upsert: false,
        contentType: blob.type,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
    if (data?.publicUrl) results.push(data.publicUrl)
  }

  return results
}

