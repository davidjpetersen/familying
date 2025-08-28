import { NextRequest } from 'next/server'
import { supabaseAdmin } from '../../../../../src/lib/supabase'
import { validateRequestBody } from '../validation/middleware'
import { StorageImportSchema, type StorageImportInput } from '../validation/schemas'
import { ErrorResponses, createSuccessResponse, handleApiError } from '../utils/error-handling'

async function getAllFilesRecursively(
  bucket: string, 
  path = '', 
  allFiles: any[] = [], 
  depth = 0, 
  maxDepth = 10,
  visitedPaths = new Set<string>()
): Promise<any[]> {
  // Prevent infinite recursion and loops
  if (depth >= maxDepth) {
    console.warn(`Max depth ${maxDepth} reached for path: ${path}`)
    return allFiles
  }

  const fullPath = path ? `${bucket}/${path}` : bucket
  if (visitedPaths.has(fullPath)) {
    console.warn(`Circular reference detected, skipping: ${fullPath}`)
    return allFiles
  }
  visitedPaths.add(fullPath)

  // Use paginated approach instead of single request with limit
  let hasMore = true
  let offset = 0
  const pageSize = 100

  while (hasMore) {
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path, {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error(`Error listing files in path ${path}:`, error)
      return allFiles
    }

    if (!files || files.length === 0) {
      hasMore = false
      break
    }

    for (const file of files) {
      const fullPath = path ? `${path}/${file.name}` : file.name

      if (file.metadata === null) {
        // This is a folder, recurse into it
        await getAllFilesRecursively(bucket, fullPath, allFiles, depth + 1, maxDepth, visitedPaths)
      } else {
        // This is a file, add it to our list with full path
        allFiles.push({
          ...file,
          fullPath,
          folder: path || 'root'
        })
      }
    }

    // Check if we got fewer results than requested (end of pagination)
    if (files.length < pageSize) {
      hasMore = false
    } else {
      offset += pageSize
    }
  }

  return allFiles
}

/**
 * GET /api/admin/soundscapes/storage
 * Lists all audio files in the storage bucket with recursive folder search
 */
export async function getStorageFiles(request: NextRequest) {
  try {
    // Get all files recursively from the plugin_soundscapes storage bucket
    const allFiles = await getAllFilesRecursively('plugin_soundscapes')

    // Filter for audio files only
    const audioFiles = allFiles.filter(file => {
      const extension = file.name.toLowerCase().split('.').pop()
      return ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(extension || '')
    })

    // Get public URLs for the files
    const filesWithUrls = audioFiles.map(file => {
      const { data: urlData } = supabaseAdmin.storage
        .from('plugin_soundscapes')
        .getPublicUrl(file.fullPath)

      return {
        id: file.id,
        name: file.name,
        fullPath: file.fullPath,
        folder: file.folder,
        size: file.metadata?.size || 0,
        contentType: file.metadata?.mimetype || 'audio/mpeg',
        lastModified: file.updated_at || file.created_at,
        publicUrl: urlData.publicUrl,
        thumbnailUrl: `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop&auto=format`
      }
    })

    // Sort by folder then by name
    filesWithUrls.sort((a, b) => {
      if (a.folder !== b.folder) {
        return a.folder.localeCompare(b.folder)
      }
      return a.name.localeCompare(b.name)
    })

    return createSuccessResponse(
      filesWithUrls,
      {
        count: filesWithUrls.length,
        folders: [...new Set(filesWithUrls.map(f => f.folder))].sort()
      }
    )
  } catch (error) {
    return await handleApiError(error, '/api/admin/soundscapes/storage', 'GET')
  }
}

/**
 * POST /api/admin/soundscapes/storage
 * Imports selected files from storage into the soundscapes database
 */
export async function importStorageFiles(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequestBody(request, StorageImportSchema)
    if (!validation.success) {
      return ErrorResponses.validation(
        validation.error.message,
        validation.error.details,
        '/api/admin/soundscapes/storage',
        'POST'
      )
    }

    const { files } = validation.data as StorageImportInput

    const results = []
    
    for (const filePath of files) {
      try {
        // Check file existence by attempting to get file listing in directory
        const pathParts = filePath.split('/')
        const fileName = pathParts[pathParts.length - 1]
        const folderPath = pathParts.slice(0, -1).join('/')

        const { data: info, error: infoError } = await supabaseAdmin.storage
          .from('plugin_soundscapes')
          .list(folderPath, {
            search: fileName
          })

        if (infoError || !info || info.length === 0) {
          results.push({
            file: filePath,
            success: false,
            error: 'File not found in storage'
          })
          continue
        }

        const file = info.find(f => f.name === fileName)
        if (!file) {
          results.push({
            file: filePath,
            success: false,
            error: 'File not found in storage'
          })
          continue
        }

        // Determine category based on filename and folder path
        const fileNameLower = fileName.toLowerCase()
        const folderPathLower = folderPath.toLowerCase()
        let category: 'Sleep' | 'Nature' | 'White Noise' | 'Focus' = 'Nature'
        
        // Check folder structure for categorization hints (folder-based takes priority)
        if (folderPathLower.includes('sleep') || folderPathLower.includes('lullaby') || folderPathLower.includes('bedtime')) {
          category = 'Sleep'
        } else if (folderPathLower.includes('white') || folderPathLower.includes('noise') || folderPathLower.includes('static')) {
          category = 'White Noise'
        } else if (folderPathLower.includes('focus') || folderPathLower.includes('concentrate') || folderPathLower.includes('study')) {
          category = 'Focus'
        } else if (folderPathLower.includes('nature') || folderPathLower.includes('ambient') || folderPathLower.includes('natural')) {
          category = 'Nature'
        } else {
          // Fallback to filename-based categorization
          if (fileNameLower.includes('sleep') || fileNameLower.includes('lullaby') || fileNameLower.includes('dream')) {
            category = 'Sleep'
          } else if (fileNameLower.includes('white') || fileNameLower.includes('noise') || fileNameLower.includes('static')) {
            category = 'White Noise'
          } else if (fileNameLower.includes('focus') || fileNameLower.includes('concentrate') || fileNameLower.includes('study')) {
            category = 'Focus'
          }
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('plugin_soundscapes')
          .getPublicUrl(filePath)

        // Generate a unique title
        const baseTitle = fileName
          .replace(/\.[^/.]+$/, "") // Remove extension
          .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
          .replace(/\b\w/g, (l: string) => l.toUpperCase()) // Title case

        // Include folder path for uniqueness
        const titleWithPath = folderPath !== 'root' 
          ? `${folderPath.split('/').map(p => p.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())).join(' / ')} / ${baseTitle}`
          : baseTitle

        // Generate unique title by checking for collisions
        let uniqueTitle = titleWithPath
        let counter = 1
        while (true) {
          const { data: existingData } = await supabaseAdmin
            .from('soundscapes')
            .select('id')
            .eq('title', uniqueTitle)
            .single()

          if (!existingData) {
            break // Title is unique
          }

          // Generate next variant
          uniqueTitle = `${titleWithPath} (${counter})`
          counter++
        }

        // Create soundscape entry
        const soundscapeData = {
          title: uniqueTitle,
          description: `Imported from storage: ${filePath}${folderPath !== 'root' ? ` (${folderPath})` : ''}`,
          category,
          audio_url: urlData.publicUrl,
          thumbnail_url: `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop&auto=format`,
          is_published: false, // Import as draft by default
          sort_order: 0,
          duration_seconds: null
        }

        // Insert into database
        const { data, error } = await supabaseAdmin
          .from('soundscapes')
          .insert(soundscapeData)
          .select()
          .single()

        if (error) {
          results.push({
            file: filePath,
            success: false,
            error: error.message
          })
        } else {
          results.push({
            file: filePath,
            success: true,
            data: data
          })
        }
      } catch (fileError) {
        results.push({
          file: filePath,
          success: false,
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return createSuccessResponse({
      message: `Imported ${successCount} soundscapes successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    })
  } catch (error) {
    console.error('Error importing from storage:', error)
    return ErrorResponses.internal(
      'Failed to import from storage',
      error instanceof Error ? error.message : undefined,
      '/api/admin/soundscapes/storage',
      'POST'
    )
  }
}
