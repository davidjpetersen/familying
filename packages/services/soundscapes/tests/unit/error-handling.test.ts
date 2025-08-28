import { 
  createErrorResponse, 
  createSuccessResponse, 
  ErrorResponses, 
  handleApiError,
  withErrorHandling,
  ERROR_CODES 
} from '../../src/utils/error-handling'
import type { NextRequest } from 'next/server'

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

    it('should include meta information', async () => {
      const testData = ['item1', 'item2']
      const meta = { count: 2, total: 10 }
      const response = createSuccessResponse(testData, meta)

      expect(response.status).toBe(200)
      
      // Parse response body and assert envelope shape
      const responseBody = await response.json()
      expect(responseBody.data).toEqual(testData)
      expect(responseBody.meta).toEqual(meta)
      expect(responseBody.success).toBe(true)
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

    it('should create admin required error', () => {
      const response = ErrorResponses.adminRequired()
      expect(response.status).toBe(403)
    })

    it('should create already exists error', () => {
      const response = ErrorResponses.alreadyExists('Resource')
      expect(response.status).toBe(409)
    })

    it('should create rate limited error', () => {
      const response = ErrorResponses.rateLimited()
      expect(response.status).toBe(429)
    })

    it('should create service unavailable error', () => {
      const response = ErrorResponses.serviceUnavailable()
      expect(response.status).toBe(503)
    })
  })

  describe('withErrorHandling wrapper', () => {
    it('should convert thrown errors into standardized responses with requestId', async () => {
      const testError = new Error('Test error')
      const mockHandler = jest.fn().mockRejectedValue(testError)
      
      const mockRequest = {
        url: 'https://example.com/api/test',
        method: 'POST',
        headers: new Headers({ 'x-request-id': 'test-request-id' })
      } as NextRequest

      const wrappedHandler = withErrorHandling(mockHandler, '/api/test', 'POST')
      const response = await wrappedHandler(mockRequest)

      expect(response.status).toBe(500)
      const responseBody = await response.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe(ERROR_CODES.INTERNAL_ERROR)
      expect(responseBody.error.requestId).toBeDefined()
      expect(responseBody.error.path).toBe('/api/test')
      expect(responseBody.error.method).toBe('POST')
    })

    it('should handle non-error throws and normalize to standardized response', async () => {
      const mockHandler = jest.fn().mockRejectedValue('string error')
      
      const mockRequest = {
        url: 'https://example.com/api/test',
        method: 'GET'
      } as NextRequest

      const wrappedHandler = withErrorHandling(mockHandler, '/api/test', 'GET')
      const response = await wrappedHandler(mockRequest)

      expect(response.status).toBe(500)
      const responseBody = await response.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe(ERROR_CODES.INTERNAL_ERROR)
      expect(responseBody.error.requestId).toBeDefined()
    })

    it('should pass through successful responses unchanged', async () => {
      const successResponse = createSuccessResponse({ test: 'data' })
      const mockHandler = jest.fn().mockResolvedValue(successResponse)
      
      const mockRequest = {} as NextRequest
      const wrappedHandler = withErrorHandling(mockHandler)
      const response = await wrappedHandler(mockRequest)

      expect(response).toBe(successResponse)
      expect(response.status).toBe(200)
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
