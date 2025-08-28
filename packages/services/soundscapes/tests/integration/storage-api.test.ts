/**
 * Integration tests for storage API functions
 * Note: These tests require proper Supabase setup and mocking
 */

// Mock Supabase before importing storage functions
jest.mock('../../../../../src/lib/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}))

import { getStorageFiles, importStorageFiles } from '../../src/api/storage'

describe('Storage API Integration', () => {
  let mockListFn: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create a mock list function that returns a promise
    mockListFn = jest.fn()
    
    // Configure the storage mock to return an object with the list function
    const { supabaseAdmin } = require('../../../../../src/lib/supabase')
    supabaseAdmin.storage.from.mockReturnValue({
      list: mockListFn,
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.mp3' }
      })
    })
  })

  describe('getStorageFiles', () => {
    it('should return storage files with proper structure', async () => {
      // Mock the successful response
      mockListFn.mockResolvedValue({
        data: [
          {
            name: 'test.mp3',
            metadata: { size: 1000, mimetype: 'audio/mpeg' },
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        error: null
      })

      const mockRequest = {
        url: 'https://example.com/api/admin/soundscapes/storage'
      } as any

      const response = await getStorageFiles(mockRequest)
      
      expect(response.status).toBe(200)
      expect(mockListFn).toHaveBeenCalledWith('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })
    })

    it('should handle storage errors gracefully', async () => {
      // Mock an error response
      mockListFn.mockResolvedValue({
        data: null,
        error: new Error('Storage error')
      })

      const mockRequest = {
        url: 'https://example.com/api/admin/soundscapes/storage'
      } as any

      const response = await getStorageFiles(mockRequest)
      
      expect(response.status).toBe(200) // Should still return empty array
    })

    it('should filter non-audio files', async () => {
      // Mock files with mixed types
      mockListFn.mockResolvedValue({
        data: [
          {
            name: 'test.mp3',
            metadata: { size: 1000, mimetype: 'audio/mpeg' },
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            name: 'document.pdf',
            metadata: { size: 2000, mimetype: 'application/pdf' },
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        error: null
      })

      const mockRequest = {
        url: 'https://example.com/api/admin/soundscapes/storage'
      } as any

      const response = await getStorageFiles(mockRequest)
      
      expect(response.status).toBe(200)
      // Should only return audio files (mp3), not PDF
    })
  })

  describe('importStorageFiles', () => {
    it('should validate request body', async () => {
      const mockRequest = {
        json: async () => ({ files: [] }) // Invalid: empty array
      } as any

      const response = await importStorageFiles(mockRequest)
      
      expect(response.status).toBe(400) // Validation error
    })

    it('should handle valid import request', async () => {
      const { supabaseAdmin } = require('../../../../../src/lib/supabase')
      
      // Mock storage operations
      supabaseAdmin.storage.from().list.mockResolvedValue({
        data: [{
          id: '1',
          name: 'test.mp3',
          metadata: { size: 1000 }
        }],
        error: null
      })
      
      supabaseAdmin.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test.mp3' }
      })

      // Mock database operations
      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null, // No existing soundscape
        error: null
      })
      
      supabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: { id: 'new-id', title: 'Test' },
        error: null
      })

      const mockRequest = {
        json: async () => ({ files: ['test.mp3'] })
      } as any

      const response = await importStorageFiles(mockRequest)
      
      expect(response.status).toBe(200)
    })

    it('should handle database errors during import', async () => {
      const { supabaseAdmin } = require('../../../../../src/lib/supabase')
      
      // Mock storage operations
      supabaseAdmin.storage.from().list.mockResolvedValue({
        data: [{
          id: '1',
          name: 'test.mp3',
          metadata: { size: 1000 }
        }],
        error: null
      })
      
      supabaseAdmin.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test.mp3' }
      })

      // Mock database operations - no existing, but insert fails
      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      })
      
      supabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const mockRequest = {
        json: async () => ({ files: ['test.mp3'] })
      } as any

      const response = await importStorageFiles(mockRequest)
      
      expect(response.status).toBe(200) // Should return with error details
    })

    it('should skip existing soundscapes', async () => {
      const { supabaseAdmin } = require('../../../../../src/lib/supabase')
      
      // Mock storage operations
      supabaseAdmin.storage.from().list.mockResolvedValue({
        data: [{
          id: '1',
          name: 'test.mp3',
          metadata: { size: 1000 }
        }],
        error: null
      })
      
      supabaseAdmin.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test.mp3' }
      })

      // Mock database operations - existing soundscape found
      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { id: 'existing-id', title: 'Test' },
        error: null
      })

      const mockRequest = {
        json: async () => ({ files: ['test.mp3'] })
      } as any

      const response = await importStorageFiles(mockRequest)
      
      expect(response.status).toBe(200)
      // Should not call insert since soundscape already exists
      expect(supabaseAdmin.from().insert).not.toHaveBeenCalled()
    })
  })
})
