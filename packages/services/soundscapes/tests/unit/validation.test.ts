import { describe, it, expect } from '@jest/globals'
import {
  CreateSoundscapeSchema,
  UpdateSoundscapeSchema,
  ListSoundscapesQuery,
  StorageImportSchema,
  IdParamSchema,
  SoundscapeCategory
} from '../../src/validation/schemas'

describe('Validation Schemas', () => {
  describe('CreateSoundscapeSchema', () => {
    it('should validate a valid soundscape creation request', () => {
      const validData = {
        title: 'Ocean Waves',
        description: 'Peaceful ocean sounds',
        category: 'Nature' as const,
        audio_url: 'https://example.com/audio.mp3',
        thumbnail_url: 'https://example.com/thumb.jpg',
        is_published: true,
        sort_order: 1,
        duration_seconds: 1800
      }

      const result = CreateSoundscapeSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should apply default values for optional fields', () => {
      const minimalData = {
        title: 'Test Sound',
        category: 'Nature' as const,
        audio_url: 'https://example.com/audio.mp3'
      }

      const result = CreateSoundscapeSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('')
        expect(result.data.is_published).toBe(true)
        expect(result.data.sort_order).toBe(0)
      }
    })

    it('should reject invalid title', () => {
      const invalidData = {
        title: '', // Empty title
        category: 'Nature' as const,
        audio_url: 'https://example.com/audio.mp3'
      }

      const result = CreateSoundscapeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required')
      }
    })

    it('should reject invalid category', () => {
      const invalidData = {
        title: 'Test Sound',
        category: 'Invalid Category',
        audio_url: 'https://example.com/audio.mp3'
      }

      const result = CreateSoundscapeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid audio URL', () => {
      const invalidData = {
        title: 'Test Sound',
        category: 'Nature' as const,
        audio_url: 'not-a-url'
      }

      const result = CreateSoundscapeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject non-audio file URLs', () => {
      const invalidData = {
        title: 'Test Sound',
        category: 'Nature' as const,
        audio_url: 'https://example.com/document.pdf'
      }

      const result = CreateSoundscapeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate audio file extensions', () => {
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']
      
      audioExtensions.forEach(ext => {
        const validData = {
          title: 'Test Sound',
          category: 'Nature' as const,
          audio_url: `https://example.com/audio${ext}`
        }

        const result = CreateSoundscapeSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('UpdateSoundscapeSchema', () => {
    it('should allow partial updates', () => {
      const partialData = {
        title: 'Updated Title'
      }

      const result = UpdateSoundscapeSchema.safeParse(partialData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Updated Title')
      }
    })

    it('should validate updated fields', () => {
      const invalidData = {
        title: '', // Invalid title
        sort_order: -1 // Invalid sort order
      }

      const result = UpdateSoundscapeSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('ListSoundscapesQuery', () => {
    it('should apply default values', () => {
      const result = ListSoundscapesQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(20)
        expect(result.data.offset).toBe(0)
        expect(result.data.sort_by).toBe('sort_order')
        expect(result.data.sort_order).toBe('asc')
      }
    })

    it('should validate limit bounds', () => {
      const tooHigh = ListSoundscapesQuery.safeParse({ limit: 200 })
      expect(tooHigh.success).toBe(false)

      const tooLow = ListSoundscapesQuery.safeParse({ limit: 0 })
      expect(tooLow.success).toBe(false)

      const valid = ListSoundscapesQuery.safeParse({ limit: 50 })
      expect(valid.success).toBe(true)
    })
  })

  describe('StorageImportSchema', () => {
    it('should validate file array', () => {
      const validData = {
        files: ['path/to/file1.mp3', 'path/to/file2.wav']
      }

      const result = StorageImportSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty file array', () => {
      const invalidData = {
        files: []
      }

      const result = StorageImportSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject too many files', () => {
      const tooManyFiles = {
        files: Array(60).fill('file.mp3')
      }

      const result = StorageImportSchema.safeParse(tooManyFiles)
      expect(result.success).toBe(false)
    })
  })

  describe('IdParamSchema', () => {
    it('should validate UUID format', () => {
      const validUUID = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = IdParamSchema.safeParse(validUUID)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidUUID = {
        id: 'not-a-uuid'
      }

      const result = IdParamSchema.safeParse(invalidUUID)
      expect(result.success).toBe(false)
    })
  })

  describe('SoundscapeCategory', () => {
    it('should validate all allowed categories', () => {
      const validCategories = ['Sleep', 'Nature', 'White Noise', 'Focus']
      
      validCategories.forEach(category => {
        const result = SoundscapeCategory.safeParse(category)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid categories', () => {
      const invalidCategories = ['Music', 'Podcast', 'Invalid']
      
      invalidCategories.forEach(category => {
        const result = SoundscapeCategory.safeParse(category)
        expect(result.success).toBe(false)
      })
    })
  })
})
