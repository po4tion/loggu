import { createClient } from '@/lib/supabase/client'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const BUCKET_NAME = 'content-images'

export interface UploadResult {
  url: string
  path: string
}

export interface UploadError {
  message: string
}

/**
 * Extract the storage path from a Supabase Storage public URL
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/content-images\/(.+)/)
    if (pathMatch) {
      return pathMatch[1]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Delete an image from Supabase Storage by its public URL
 */
export async function deleteContentImage(url: string): Promise<{ error: UploadError | null }> {
  const path = extractPathFromUrl(url)

  if (!path) {
    return { error: null } // Not a storage URL, nothing to delete
  }

  const supabase = createClient()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    console.error('Delete error:', error)
    return { error: { message: error.message || 'Failed to delete image' } }
  }

  return { error: null }
}

export async function uploadContentImage(
  file: File,
  authorId: string
): Promise<{ data: UploadResult | null; error: UploadError | null }> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      data: null,
      error: { message: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
    }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      data: null,
      error: { message: 'File size must be less than 10MB' },
    }
  }

  const supabase = createClient()

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${authorId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    return {
      data: null,
      error: { message: error.message || 'Failed to upload image' },
    }
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    data: {
      url: urlData.publicUrl,
      path: data.path,
    },
    error: null,
  }
}
