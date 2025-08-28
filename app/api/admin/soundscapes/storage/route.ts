import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getAllFilesRecursively(bucket: string, path = '', allFiles: any[] = []): Promise<any[]> {
  const { data: files, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(path, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    })

  if (error) {
    console.error(`Error listing files in path ${path}:`, error)
    return allFiles
  }

  for (const file of files || []) {
    const fullPath = path ? `${path}/${file.name}` : file.name

    if (file.metadata === null) {
      // This is a folder, recurse into it
      await getAllFilesRecursively(bucket, fullPath, allFiles)
    } else {
      // This is a file, add it to our list with full path
      allFiles.push({
        ...file,
        fullPath,
        folder: path || 'root'
      })
    }
  }

  return allFiles
}

export async function GET(request: NextRequest) {
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
        // Generate a thumbnail URL (you might want to store actual thumbnails)
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

    return NextResponse.json({
      success: true,
      data: filesWithUrls,
      count: filesWithUrls.length,
      folders: [...new Set(filesWithUrls.map(f => f.folder))].sort()
    })

  } catch (error) {
    console.error('Error listing storage files:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { files } = body

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request: files array required'
      }, { status: 400 })
    }

    const results = []
    
    for (const file of files) {
      try {
        // Determine category based on filename and folder path
        const fileName = file.name.toLowerCase()
        const folderPath = file.folder.toLowerCase()
        const fullPath = `${folderPath}/${fileName}`.toLowerCase()
        let category: 'Sleep' | 'Nature' | 'White Noise' | 'Focus' = 'Nature'
        
        // Check folder structure for categorization hints
        if (folderPath.includes('sleep') || folderPath.includes('lullaby') || folderPath.includes('bedtime') ||
            fileName.includes('sleep') || fileName.includes('lullaby') || fileName.includes('dream')) {
          category = 'Sleep'
        } else if (folderPath.includes('white') || folderPath.includes('noise') || folderPath.includes('static') ||
                   fileName.includes('white') || fileName.includes('noise') || fileName.includes('static')) {
          category = 'White Noise'
        } else if (folderPath.includes('focus') || folderPath.includes('concentrate') || folderPath.includes('study') ||
                   fileName.includes('focus') || fileName.includes('concentrate') || fileName.includes('study')) {
          category = 'Focus'
        } else if (folderPath.includes('nature') || folderPath.includes('ambient') || folderPath.includes('natural')) {
          category = 'Nature'
        }

        // Create soundscape entry
        const soundscapeData = {
          title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: `Imported from storage: ${file.fullPath || file.name}${file.folder && file.folder !== 'root' ? ` (${file.folder})` : ''}`,
          category,
          audio_url: file.publicUrl,
          thumbnail_url: file.thumbnailUrl,
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
            file: file.name,
            success: false,
            error: error.message
          })
        } else {
          results.push({
            file: file.name,
            success: true,
            data: data
          })
        }
      } catch (fileError) {
        results.push({
          file: file.name,
          success: false,
          error: fileError instanceof Error ? fileError.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
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
    return NextResponse.json({
      success: false,
      error: 'Failed to import from storage'
    }, { status: 500 })
  }
}
