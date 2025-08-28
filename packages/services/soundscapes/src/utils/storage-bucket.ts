import { supabaseAdmin } from '../../../../../src/lib/supabase'

/**
 * Storage bucket management utilities for the soundscapes plugin
 * Provides functions to interact with the plugin_soundscapes storage bucket
 */

export const SOUNDSCAPES_BUCKET = 'plugin_soundscapes'

/**
 * Configuration for the soundscapes storage bucket
 */
export const BUCKET_CONFIG = {
  name: SOUNDSCAPES_BUCKET,
  maxFileSize: 52428800, // 50MB
  allowedMimeTypes: [
    'audio/mpeg',
    'audio/wav', 
    'audio/mp3',
    'audio/m4a',
    'audio/ogg',
    'image/jpeg',
    'image/png',
    'image/webp'
  ] as const,
  paths: {
    audio: 'audio/',
    thumbnails: 'thumbnails/',
    temp: 'temp/'
  }
} as const

type AllowedMimeType = typeof BUCKET_CONFIG.allowedMimeTypes[number]

interface StorageFile {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, any>
}

interface Bucket {
  id: string
  name: string
  public?: boolean
}

/**
 * Check if the soundscapes bucket exists and is properly configured
 */
export async function checkBucketHealth(): Promise<{ 
  exists: boolean
  accessible: boolean
  error?: string 
}> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    
    if (listError) {
      return { exists: false, accessible: false, error: listError.message }
    }

    const bucketExists = (buckets as Bucket[])?.some(bucket => bucket.id === SOUNDSCAPES_BUCKET)
    
    if (!bucketExists) {
      return { exists: false, accessible: false, error: 'Bucket does not exist' }
    }

    // Test accessibility by trying to list files
    const { error: accessError } = await supabaseAdmin.storage
      .from(SOUNDSCAPES_BUCKET)
      .list('', { limit: 1 })

    if (accessError) {
      return { exists: true, accessible: false, error: accessError.message }
    }

    return { exists: true, accessible: true }
  } catch (error) {
    return { 
      exists: false, 
      accessible: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get the public URL for a file in the soundscapes bucket
 */
export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage
    .from(SOUNDSCAPES_BUCKET)
    .getPublicUrl(path)
  
  return data.publicUrl
}

/**
 * Upload a file to the soundscapes bucket
 */
export async function uploadFile(
  path: string,
  file: File | Buffer,
  options?: {
    contentType?: string
    upsert?: boolean
  }
) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SOUNDSCAPES_BUCKET)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert ?? false
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    return {
      success: true,
      path: data.path,
      publicUrl: getPublicUrl(data.path)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Delete a file from the soundscapes bucket
 */
export async function deleteFile(path: string) {
  try {
    const { error } = await supabaseAdmin.storage
      .from(SOUNDSCAPES_BUCKET)
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * List files in a specific path within the soundscapes bucket
 */
export async function listFiles(path: string = '', options?: {
  limit?: number
  offset?: number
  sortBy?: { column: string; order: 'asc' | 'desc' }
}) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SOUNDSCAPES_BUCKET)
      .list(path, {
        limit: options?.limit,
        offset: options?.offset,
        sortBy: options?.sortBy
      })

    if (error) {
      throw new Error(`List failed: ${error.message}`)
    }

    return {
      success: true,
      files: (data as StorageFile[]) || []
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List failed',
      files: []
    }
  }
}

/**
 * Move/rename a file within the soundscapes bucket
 */
export async function moveFile(fromPath: string, toPath: string) {
  try {
    const { error } = await supabaseAdmin.storage
      .from(SOUNDSCAPES_BUCKET)
      .move(fromPath, toPath)

    if (error) {
      throw new Error(`Move failed: ${error.message}`)
    }

    return { 
      success: true,
      newPublicUrl: getPublicUrl(toPath)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Move failed'
    }
  }
}

/**
 * Validate if a file type is allowed for upload
 */
export function isFileTypeAllowed(mimeType: string): boolean {
  return (BUCKET_CONFIG.allowedMimeTypes as readonly string[]).includes(mimeType)
}

/**
 * Validate if a file size is within limits
 */
export function isFileSizeAllowed(sizeInBytes: number): boolean {
  return sizeInBytes <= BUCKET_CONFIG.maxFileSize
}

/**
 * Generate a unique file path for uploads
 */
export function generateFilePath(
  originalName: string,
  type: 'audio' | 'thumbnails' | 'temp' = 'audio'
): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${BUCKET_CONFIG.paths[type]}${timestamp}_${randomSuffix}_${baseName}.${extension}`
}

/**
 * Clean up temporary files older than specified age
 */
export async function cleanupTempFiles(olderThanHours: number = 24) {
  try {
    const { files } = await listFiles(BUCKET_CONFIG.paths.temp)
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
    
    const filesToDelete = files.filter((file: StorageFile) => {
      // Extract timestamp from filename if it follows our naming convention
      const match = file.name.match(/^(\d+)_/)
      if (match) {
        const fileTimestamp = parseInt(match[1])
        return fileTimestamp < cutoffTime
      }
      return false
    })

    if (filesToDelete.length > 0) {
      const deletePaths = filesToDelete.map((file: StorageFile) => `${BUCKET_CONFIG.paths.temp}${file.name}`)
      const { error } = await supabaseAdmin.storage
        .from(SOUNDSCAPES_BUCKET)
        .remove(deletePaths)

      if (error) {
        throw new Error(`Cleanup failed: ${error.message}`)
      }
    }

    return {
      success: true,
      deletedCount: filesToDelete.length
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
      deletedCount: 0
    }
  }
}
