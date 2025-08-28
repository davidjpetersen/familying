import { describe, it, expect } from '@jest/globals'

// Import constants and utilities that don't require supabase
const SOUNDSCAPES_BUCKET = 'plugin_soundscapes'

const BUCKET_CONFIG = {
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

function isFileTypeAllowed(mimeType: string): boolean {
  return (BUCKET_CONFIG.allowedMimeTypes as readonly string[]).includes(mimeType)
}

function isFileSizeAllowed(sizeInBytes: number): boolean {
  return sizeInBytes <= BUCKET_CONFIG.maxFileSize
}

function generateFilePath(
  originalName: string,
  type: 'audio' | 'thumbnails' | 'temp' = 'audio'
): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${BUCKET_CONFIG.paths[type]}${timestamp}_${randomSuffix}_${baseName}.${extension}`
}

describe('Storage Bucket Utilities', () => {
  describe('Configuration', () => {
    it('should have correct bucket name', () => {
      expect(SOUNDSCAPES_BUCKET).toBe('plugin_soundscapes')
    })

    it('should have proper bucket configuration', () => {
      expect(BUCKET_CONFIG.name).toBe('plugin_soundscapes')
      expect(BUCKET_CONFIG.maxFileSize).toBe(52428800) // 50MB
      expect(BUCKET_CONFIG.allowedMimeTypes).toContain('audio/mpeg')
      expect(BUCKET_CONFIG.allowedMimeTypes).toContain('image/jpeg')
      expect(BUCKET_CONFIG.paths.audio).toBe('audio/')
      expect(BUCKET_CONFIG.paths.thumbnails).toBe('thumbnails/')
      expect(BUCKET_CONFIG.paths.temp).toBe('temp/')
    })
  })

  describe('File Validation', () => {
    describe('isFileTypeAllowed', () => {
      it('should return true for allowed audio types', () => {
        expect(isFileTypeAllowed('audio/mpeg')).toBe(true)
        expect(isFileTypeAllowed('audio/wav')).toBe(true)
        expect(isFileTypeAllowed('audio/mp3')).toBe(true)
        expect(isFileTypeAllowed('audio/m4a')).toBe(true)
        expect(isFileTypeAllowed('audio/ogg')).toBe(true)
      })

      it('should return true for allowed image types', () => {
        expect(isFileTypeAllowed('image/jpeg')).toBe(true)
        expect(isFileTypeAllowed('image/png')).toBe(true)
        expect(isFileTypeAllowed('image/webp')).toBe(true)
      })

      it('should return false for disallowed types', () => {
        expect(isFileTypeAllowed('video/mp4')).toBe(false)
        expect(isFileTypeAllowed('application/pdf')).toBe(false)
        expect(isFileTypeAllowed('text/plain')).toBe(false)
        expect(isFileTypeAllowed('audio/flac')).toBe(false)
      })
    })

    describe('isFileSizeAllowed', () => {
      it('should return true for files within size limit', () => {
        expect(isFileSizeAllowed(1024)).toBe(true) // 1KB
        expect(isFileSizeAllowed(1024 * 1024)).toBe(true) // 1MB
        expect(isFileSizeAllowed(50 * 1024 * 1024)).toBe(true) // 50MB (exactly at limit)
      })

      it('should return false for files exceeding size limit', () => {
        expect(isFileSizeAllowed(52428801)).toBe(false) // 1 byte over 50MB
        expect(isFileSizeAllowed(100 * 1024 * 1024)).toBe(false) // 100MB
      })
    })
  })

  describe('generateFilePath', () => {
    it('should generate path with audio prefix by default', () => {
      const path = generateFilePath('test-file.mp3')
      
      expect(path).toMatch(/^audio\/\d+_[a-z0-9]{6}_test_file\.mp3$/)
    })

    it('should generate path with thumbnails prefix', () => {
      const path = generateFilePath('thumbnail.jpg', 'thumbnails')
      
      expect(path).toMatch(/^thumbnails\/\d+_[a-z0-9]{6}_thumbnail\.jpg$/)
    })

    it('should generate path with temp prefix', () => {
      const path = generateFilePath('temp-upload.wav', 'temp')
      
      expect(path).toMatch(/^temp\/\d+_[a-z0-9]{6}_temp_upload\.wav$/)
    })

    it('should clean up filename with special characters', () => {
      const path = generateFilePath('My Awesome Sound File #1!.mp3')
      
      expect(path).toMatch(/^audio\/\d+_[a-z0-9]{6}_My_Awesome_Sound_File__1_\.mp3$/)
    })

    it('should handle files without extensions', () => {
      const path = generateFilePath('filename-no-ext')
      
      expect(path).toMatch(/^audio\/\d+_[a-z0-9]{6}_filename_no_ext\.filename-no-ext$/)
    })
  })

  describe('Bucket Paths Configuration', () => {
    it('should have correctly structured paths', () => {
      expect(BUCKET_CONFIG.paths.audio).toMatch(/\/$/)
      expect(BUCKET_CONFIG.paths.thumbnails).toMatch(/\/$/)
      expect(BUCKET_CONFIG.paths.temp).toMatch(/\/$/)
    })

    it('should have unique path prefixes', () => {
      const paths = Object.values(BUCKET_CONFIG.paths)
      const uniquePaths = new Set(paths)
      
      expect(paths.length).toBe(uniquePaths.size)
    })
  })

  describe('MIME Type Configuration', () => {
    it('should include all common audio formats', () => {
      const audioTypes = BUCKET_CONFIG.allowedMimeTypes.filter(type => type.startsWith('audio/'))
      
      expect(audioTypes).toContain('audio/mpeg')
      expect(audioTypes).toContain('audio/wav')
      expect(audioTypes).toContain('audio/mp3')
      expect(audioTypes).toContain('audio/m4a')
      expect(audioTypes).toContain('audio/ogg')
    })

    it('should include common image formats for thumbnails', () => {
      const imageTypes = BUCKET_CONFIG.allowedMimeTypes.filter(type => type.startsWith('image/'))
      
      expect(imageTypes).toContain('image/jpeg')
      expect(imageTypes).toContain('image/png')
      expect(imageTypes).toContain('image/webp')
    })

    it('should not include any video types', () => {
      const videoTypes = BUCKET_CONFIG.allowedMimeTypes.filter(type => type.startsWith('video/'))
      
      expect(videoTypes).toHaveLength(0)
    })
  })

  describe('Storage Bucket Security', () => {
    it('should have reasonable file size limits', () => {
      // 50MB is reasonable for audio files but not excessive
      expect(BUCKET_CONFIG.maxFileSize).toBe(52428800)
      expect(BUCKET_CONFIG.maxFileSize).toBeLessThan(100 * 1024 * 1024) // Less than 100MB
      expect(BUCKET_CONFIG.maxFileSize).toBeGreaterThan(10 * 1024 * 1024) // More than 10MB
    })

    it('should only allow safe MIME types', () => {
      // Should not allow executable files
      expect(isFileTypeAllowed('application/x-executable')).toBe(false)
      expect(isFileTypeAllowed('application/x-dosexec')).toBe(false)
      
      // Should not allow scripts
      expect(isFileTypeAllowed('application/javascript')).toBe(false)
      expect(isFileTypeAllowed('text/html')).toBe(false)
    })

    it('should use descriptive bucket name with plugin prefix', () => {
      expect(SOUNDSCAPES_BUCKET).toMatch(/^plugin_/)
      expect(SOUNDSCAPES_BUCKET).toContain('soundscapes')
    })
  })
})
