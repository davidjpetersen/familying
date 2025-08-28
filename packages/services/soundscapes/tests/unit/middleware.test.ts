import {
  validateRequestBody,
  validateQueryParams,
  validateParams,
  createValidationErrorResponse
} from '../../src/validation/middleware'
import { CreateSoundscapeSchema, IdParamSchema } from '../../src/validation/schemas'

describe('Validation Middleware', () => {
  describe('validateRequestBody', () => {
    it('should validate valid request body', async () => {
      const validBody = {
        title: 'Test Sound',
        category: 'Nature',
        audio_url: 'https://example.com/audio.mp3'
      }

      const mockRequest = {
        json: async () => validBody
      } as any

      const result = await validateRequestBody(mockRequest, CreateSoundscapeSchema)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Sound')
      }
    })

    it('should return validation error for invalid body', async () => {
      const invalidBody = {
        title: '', // Invalid
        category: 'Nature',
        audio_url: 'not-a-url' // Invalid
      }

      const mockRequest = {
        json: async () => invalidBody
      } as any

      const result = await validateRequestBody(mockRequest, CreateSoundscapeSchema)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR')
        expect(result.error.details.length).toBeGreaterThan(0)
      }
    })

    it('should handle malformed JSON', async () => {
      const mockRequest = {
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON')
        }
      } as any

      const result = await validateRequestBody(mockRequest, CreateSoundscapeSchema)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR')
        expect(result.error.message).toBe('Invalid JSON in request body')
      }
    })
  })

  describe('validateQueryParams', () => {
    it('should validate query parameters', () => {
      const mockRequest = {
        url: 'https://example.com/api?limit=10&offset=20'
      } as any

      const schema = CreateSoundscapeSchema.pick({ sort_order: true }).extend({
        limit: CreateSoundscapeSchema.shape.sort_order,
        offset: CreateSoundscapeSchema.shape.sort_order
      })

      const result = validateQueryParams(mockRequest, schema)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(10)
        expect(result.data.offset).toBe(20)
      }
    })

    it('should handle boolean conversion', () => {
      const mockRequest = {
        url: 'https://example.com/api?is_published=true&another=false'
      } as any

      const schema = CreateSoundscapeSchema.pick({ is_published: true }).extend({
        another: CreateSoundscapeSchema.shape.is_published
      })

      const result = validateQueryParams(mockRequest, schema)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_published).toBe(true)
        expect(result.data.another).toBe(false)
      }
    })
  })

  describe('validateParams', () => {
    it('should validate URL parameters', () => {
      const params = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = validateParams(params, IdParamSchema)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(params.id)
      }
    })

    it('should return error for invalid params', () => {
      const params = {
        id: 'not-a-uuid'
      }

      const result = validateParams(params, IdParamSchema)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  describe('createValidationErrorResponse', () => {
    it('should create proper error response', () => {
      const validationError = {
        success: false as const,
        error: {
          code: 'VALIDATION_ERROR' as const,
          message: 'Test error',
          details: [{ field: 'test', message: 'Test field error' }],
          timestamp: new Date().toISOString(),
          requestId: 'test-id'
        }
      }

      const response = createValidationErrorResponse(validationError)
      
      expect(response.status).toBe(400)
    })
  })
})
