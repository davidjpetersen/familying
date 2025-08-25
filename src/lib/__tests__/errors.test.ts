import {
  AppError,
  ErrorCode,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  PluginError,
  AdminError,
  createErrorResponse,
  isAppError,
  withRetry,
} from '../errors'

describe('Error Handling System', () => {
  describe('ErrorCode enum', () => {
    it('should have correct error codes', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED')
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR')
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
    })
  })

  describe('AppError base class', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError('Test error', ErrorCode.BAD_REQUEST, 400)
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe(ErrorCode.BAD_REQUEST)
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('AppError')
      expect(error.isOperational).toBe(true)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should be an instance of Error', () => {
      const error = new AppError('Test error', ErrorCode.BAD_REQUEST, 400)
      expect(error).toBeInstanceOf(Error)
    })

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test error', ErrorCode.BAD_REQUEST, 400, true, { field: 'test' })
      const json = error.toJSON()
      
      expect(json.name).toBe('AppError')
      expect(json.message).toBe('Test error')
      expect(json.code).toBe(ErrorCode.BAD_REQUEST)
      expect(json.statusCode).toBe(400)
      expect(json.details).toEqual({ field: 'test' })
      expect(typeof json.timestamp).toBe('string')
    })
  })

  describe('Specific error types', () => {
    it('should create ValidationError with correct defaults', () => {
      const error = new ValidationError('Invalid input', { field: 'email' })
      
      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ field: 'email' })
    })

    it('should create AuthenticationError with correct defaults', () => {
      const error = new AuthenticationError('Invalid token')
      
      expect(error.message).toBe('Invalid token')
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED)
      expect(error.statusCode).toBe(401)
    })

    it('should create AuthorizationError with correct defaults', () => {
      const error = new AuthorizationError('Insufficient permissions')
      
      expect(error.message).toBe('Insufficient permissions')
      expect(error.code).toBe(ErrorCode.FORBIDDEN)
      expect(error.statusCode).toBe(403)
    })

    it('should create NotFoundError with correct defaults', () => {
      const error = new NotFoundError('User')
      
      expect(error.message).toBe('User not found')
      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.statusCode).toBe(404)
    })

    it('should create DatabaseError with correct defaults', () => {
      const error = new DatabaseError('Database connection failed')
      
      expect(error.message).toBe('Database connection failed')
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR)
      expect(error.statusCode).toBe(500)
    })

    it('should create PluginError with correct code', () => {
      const error = new PluginError('Plugin failed', ErrorCode.PLUGIN_EXECUTION_ERROR)
      
      expect(error.message).toBe('Plugin failed')
      expect(error.code).toBe(ErrorCode.PLUGIN_EXECUTION_ERROR)
      expect(error.statusCode).toBe(500)
    })

    it('should create AdminError with custom status code', () => {
      const error = new AdminError('Admin operation failed', ErrorCode.INSUFFICIENT_PERMISSIONS, 403)
      
      expect(error.message).toBe('Admin operation failed')
      expect(error.code).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS)
      expect(error.statusCode).toBe(403)
    })
  })

  describe('isAppError utility', () => {
    it('should return true for AppError instances', () => {
      const error = new ValidationError('Test error')
      expect(isAppError(error)).toBe(true)
    })

    it('should return false for regular Error instances', () => {
      const error = new Error('Regular error')
      expect(isAppError(error)).toBe(false)
    })

    it('should return false for non-error objects', () => {
      expect(isAppError({})).toBe(false)
      expect(isAppError('string')).toBe(false)
      expect(isAppError(null)).toBe(false)
    })
  })

  describe('createErrorResponse', () => {
    it('should create proper error response for AppError', () => {
      const error = new ValidationError('Invalid email', { field: 'email' })
      const response = createErrorResponse(error)
      
      expect(response.statusCode).toBe(400)
      expect(response.error.message).toBe('Invalid email')
      expect(response.error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(response.error.details).toEqual({ field: 'email' })
      expect(typeof response.error.timestamp).toBe('string')
    })

    it('should create generic error response for unknown errors', () => {
      const error = new Error('Generic error')
      const response = createErrorResponse(error)
      
      expect(response.statusCode).toBe(500)
      expect(response.error.message).toBe('An unexpected error occurred')
      expect(response.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR)
      expect(typeof response.error.timestamp).toBe('string')
    })
  })

  describe('withRetry utility', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')
      
      const result = await withRetry(mockOperation, 3, 100)
      
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new DatabaseError('Connection failed'))
        .mockRejectedValueOnce(new DatabaseError('Connection failed'))
        .mockResolvedValue('success')
      
      const result = await withRetry(mockOperation, 3, 10)
      
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('should not retry on validation errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new ValidationError('Invalid input'))
      
      await expect(withRetry(mockOperation, 3, 10)).rejects.toThrow('Invalid input')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should exhaust retries and throw last error', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new DatabaseError('Connection failed'))
      
      await expect(withRetry(mockOperation, 2, 10)).rejects.toThrow('Connection failed')
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })
  })
})
