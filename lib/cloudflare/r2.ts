import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'bitig-audiobooks'

// Create S3 client configured for Cloudflare R2
export function getR2Client() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn('R2 credentials not configured. Audio uploads will fail.')
    return null
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string
): Promise<{ success: boolean; key: string; error?: string }> {
  const client = getR2Client()
  if (!client) {
    return { success: false, key: '', error: 'R2 client not configured' }
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    )

    return { success: true, key }
  } catch (error) {
    console.error('R2 upload error:', error)
    return { 
      success: false, 
      key: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  const client = getR2Client()
  if (!client) {
    return { success: false, error: 'R2 client not configured' }
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    )

    return { success: true }
  } catch (error) {
    console.error('R2 delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Generate a signed URL for secure streaming (expires in 1 hour)
 */
export async function getR2SignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error?: string }> {
  const client = getR2Client()
  if (!client) {
    return { url: null, error: 'R2 client not configured' }
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    const url = await getSignedUrl(client, command, { expiresIn })
    return { url }
  } catch (error) {
    console.error('R2 signed URL error:', error)
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Generate a unique key for audio files
 */
export function generateAudioKey(bookId: string, trackTitle: string, format: string = 'opus'): string {
  const sanitizedTitle = trackTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const timestamp = Date.now()
  return `audiobooks/${bookId}/${sanitizedTitle}-${timestamp}.${format}`
}
