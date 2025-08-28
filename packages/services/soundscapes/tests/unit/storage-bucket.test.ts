import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  SOUNDSCAPES_BUCKET,
  BUCKET_CONFIG,
  checkBucketHealth,
  getPublicUrl,
  isFileTypeAllowed,
  isFileSizeAllowed,
  generateFilePath
} from '../../src/utils/storage-bucket'

// Mock supabaseAdmin
const mockListBuckets = jest.fn() as jest.MockedFunction<any>
const mockFrom = jest.fn() as jest.MockedFunction<any>

const mockSupabaseAdmin = {
  storage: {
    listBuckets: mockListBuckets,
    from: mockFrom
  }
}

jest.mock('../../../../../src/lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin
}))

describe('Storage Bucket Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

  describe('checkBucketHealth', () => {
    it('should return exists=false when bucket list fails', async () => {
      mockListBuckets.mockResolvedValue({
        data: null,
        error: { message: 'Access denied' }
      })

      const result = await checkBucketHealth()
      
      expect(result.exists).toBe(false)
      expect(result.accessible).toBe(false)
      expect(result.error).toBe('Access denied')
    })

    it('should return exists=false when bucket is not in list', async () => {
      mockListBuckets.mockResolvedValue({
        data: [
          { id: 'other-bucket', name: 'other-bucket' }
        ],
        error: null
      })

      const result = await checkBucketHealth()
      
      expect(result.exists).toBe(false)
      expect(result.accessible).toBe(false)
      expect(result.error).toBe('Bucket does not exist')
    })

    it('should return accessible=false when bucket exists but is not accessible', async () => {
      mockListBuckets.mockResolvedValue({
        data: [
          { id: 'plugin_soundscapes', name: 'plugin_soundscapes' }
        ],
        error: null
      })

      const mockBucketFrom = {
        list: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Permission denied' }
        })
      }
      mockFrom.mockReturnValue(mockBucketFrom)

      const result = await checkBucketHealth()
      
      expect(result.exists).toBe(true)
      expect(result.accessible).toBe(false)
      import { describe, it, expect } from '@jest/globals'
import {
  SOUNDSCAPES_BUCKET,
  BUCKET_CONFIG,
  isFileTypeAllowed,
  isFileSizeAllowed,
  generateFilePath
} from '../../src/utils/storage-bucket'

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
      
      expect(path).toMatch(/^audio\/\d+_[a-z0-9]{6}_filename_no_ext\.undefined$/)
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
    })

    it('should return healthy status when bucket exists and is accessible', async () => {
      mockListBuckets.mockResolvedValue({
        data: [
          { id: 'plugin_soundscapes', name: 'plugin_soundscapes' }
        ],
        error: null
      })

      const mockBucketFrom = {
        list: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      mockFrom.mockReturnValue(mockBucketFrom)

      const result = await checkBucketHealth()
      
      expect(result.exists).toBe(true)
      expect(result.accessible).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle exceptions gracefully', async () => {
      mockListBuckets.mockRejectedValue(new Error('Network error'))

      const result = await checkBucketHealth()
      
      expect(result.exists).toBe(false)
      expect(result.accessible).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('getPublicUrl', () => {
    it('should return public URL for given path', () => {
      const mockBucketFrom = {
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/storage/plugin_soundscapes/test.mp3' }
        })
      }
      mockFrom.mockReturnValue(mockBucketFrom)

      const url = getPublicUrl('audio/test.mp3')
      
      expect(url).toBe('https://example.com/storage/plugin_soundscapes/test.mp3')
      expect(mockFrom).toHaveBeenCalledWith('plugin_soundscapes')
      expect(mockBucketFrom.getPublicUrl).toHaveBeenCalledWith('audio/test.mp3')
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
      
      expect(path).toMatch(/^audio\/\d+_[a-z0-9]{6}_filename_no_ext\.undefined$/)
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
})
