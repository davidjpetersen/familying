// Custom error classes for better error handling and type safety

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Admin errors
  ADMIN_NOT_FOUND = 'ADMIN_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ADMIN_ALREADY_EXISTS = 'ADMIN_ALREADY_EXISTS',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Plugin errors
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_LOAD_ERROR = 'PLUGIN_LOAD_ERROR',
  PLUGIN_EXECUTION_ERROR = 'PLUGIN_EXECUTION_ERROR',
  INVALID_PLUGIN_OPERATION = 'INVALID_PLUGIN_OPERATION',
  
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: Date
  public readonly details?: Record<string, any>

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date()
    this.details = details

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      details: this.details
    }
  }
}

// Specific error classes
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: Record<string, any>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, details)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, any>) {
    super(message, ErrorCode.FORBIDDEN, 403, true, details)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, details)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.DATABASE_ERROR, 500, true, details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: Record<string, any>) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, true, details)
  }
}

export class PluginError extends AppError {
  constructor(message: string, code: ErrorCode, details?: Record<string, any>) {
    super(message, code, 500, true, details)
  }
}

export class AdminError extends AppError {
  constructor(message: string, code: ErrorCode, statusCode: number = 403, details?: Record<string, any>) {
    super(message, code, statusCode, true, details)
  }
}

// Error handler utility functions
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function createErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      error: {
        message: error.message,
        code: error.code,
        timestamp: error.timestamp.toISOString(),
        details: error.details
      },
      statusCode: error.statusCode
    }
  }

  // Handle unknown errors
  console.error('Unhandled error:', error)
  return {
    error: {
      message: 'An unexpected error occurred',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString()
    },
    statusCode: 500
  }
}

// Async error wrapper for route handlers
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error('Async handler error:', error)
      throw error
    }
  }
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        break
      }

      // Don't retry on certain error types
      if (isAppError(error) && [
        ErrorCode.UNAUTHORIZED,
        ErrorCode.FORBIDDEN,
        ErrorCode.VALIDATION_ERROR,
        ErrorCode.NOT_FOUND
      ].includes(error.code)) {
        throw error
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
