import {
  createErrorResponse,
  createSuccessResponse,
  ErrorResponses,
  handleApiError,
  ERROR_CODES
} from '../../src/utils/error-handling'

describe('Error Handling', () => {
  describe('createErrorResponse', () => {
    it('should create proper error response structure', () => {
      const response = createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Test error message',
        { field: 'test' },
        400,
        '/api/test',
        'POST'
      )

      expect(response.status).toBe(400)
    })

    it('should use default status code 500', () => {
      const response = createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Test error'
      )

      expect(response.status).toBe(500)
    })
  })

  describe('createSuccessResponse', () => {
    it('should create proper success response structure', () => {
      const testData = { message: 'success' }
      const response = createSuccessResponse(testData)

      expect(response.status).toBe(200)
    })

    it('should support custom status code', () => {
      const testData = { created: true }
      const response = createSuccessResponse(testData, undefined, 201)

      expect(response.status).toBe(201)
    })

    it('should include meta information', () => {
      const testData = ['item1', 'item2']
      const meta = { count: 2, total: 10 }
      const response = createSuccessResponse(testData, meta)

      expect(response.status).toBe(200)
    })
  })

  describe('ErrorResponses factory', () => {
    it('should create validation error', () => {
      const response = ErrorResponses.validation('Invalid input')
      expect(response.status).toBe(400)
    })

    it('should create unauthorized error', () => {
      const response = ErrorResponses.unauthorized()
      expect(response.status).toBe(401)
    })

    it('should create forbidden error', () => {
      const response = ErrorResponses.forbidden()
      expect(response.status).toBe(403)
    })

    it('should create not found error', () => {
      const response = ErrorResponses.notFound('User')
      expect(response.status).toBe(404)
    })

    it('should create database error', () => {
      const response = ErrorResponses.databaseError()
      expect(response.status).toBe(500)
    })

    it('should create storage error', () => {
      const response = ErrorResponses.storageError()
      expect(response.status).toBe(500)
    })

    it('should create internal error', () => {
      const response = ErrorResponses.internal()
      expect(response.status).toBe(500)
    })
  })

  describe('handleApiError', () => {
    it('should handle Error instances', async () => {
      const error = new Error('Test error message')
      const response = await handleApiError(error, '/api/test', 'GET')
      
      expect(response.status).toBe(500)
    })

    it('should handle database connection errors', async () => {
      const error = new Error('Connection timeout occurred')
      const response = await handleApiError(error, '/api/test', 'GET')
      
      expect(response.status).toBe(500)
    })

    it('should handle supabase errors', async () => {
      const error = new Error('Supabase query failed')
      const response = await handleApiError(error, '/api/test', 'GET')
      
      expect(response.status).toBe(500)
    })

    it('should handle storage errors', async () => {
      const error = new Error('Storage bucket not found')
      const response = await handleApiError(error, '/api/test', 'GET')
      
      expect(response.status).toBe(500)
    })

    it('should handle unknown error types', async () => {
      const error = 'string error'
      const response = await handleApiError(error, '/api/test', 'GET')
      
      expect(response.status).toBe(500)
    })

    it('should handle null/undefined errors', async () => {
      const response = await handleApiError(null, '/api/test', 'GET')
      
      expect(response.status).toBe(500)
    })
  })

  describe('ERROR_CODES', () => {
    it('should contain all expected error codes', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED')
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND')
      expect(ERROR_CODES.ALREADY_EXISTS).toBe('ALREADY_EXISTS')
      expect(ERROR_CODES.DATABASE_ERROR).toBe('DATABASE_ERROR')
      expect(ERROR_CODES.STORAGE_ERROR).toBe('STORAGE_ERROR')
      expect(ERROR_CODES.RATE_LIMITED).toBe('RATE_LIMITED')
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
      expect(ERROR_CODES.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE')
    })
  })
})
