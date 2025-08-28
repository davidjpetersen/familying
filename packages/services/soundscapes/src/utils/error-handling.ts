import { NextResponse } from 'next/server'

// Standard error codes
export const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Authentication/Authorization errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_FAILED: 'QUERY_FAILED',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Internal errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const

export type ErrorCode = keyof typeof ERROR_CODES

// Standard error response structure
export interface ApiErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: any
    timestamp: string
    requestId: string
    path?: string
    method?: string
  }
}

// Success response structure
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasNext?: boolean
  }
}

// Union type for all API responses
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  statusCode: number = 500,
  path?: string,
  method?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      path,
      method
    }
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Error response factory functions for common errors
 */
export const ErrorResponses = {
  validation: (message: string, details?: any, path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.VALIDATION_ERROR, message, details, 400, path, method),

  unauthorized: (message: string = 'Authentication required', path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.UNAUTHORIZED, message, undefined, 401, path, method),

  forbidden: (message: string = 'Insufficient permissions', path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.FORBIDDEN, message, undefined, 403, path, method),

  adminRequired: (message: string = 'Admin access required', path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.ADMIN_REQUIRED, message, undefined, 403, path, method),

  notFound: (resource: string = 'Resource', path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.NOT_FOUND, `${resource} not found`, undefined, 404, path, method),

  alreadyExists: (resource: string = 'Resource', path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.ALREADY_EXISTS, `${resource} already exists`, undefined, 409, path, method),

  databaseError: (message: string = 'Database operation failed', details?: any, path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.DATABASE_ERROR, message, details, 500, path, method),

  storageError: (message: string = 'Storage operation failed', details?: any, path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.STORAGE_ERROR, message, details, 500, path, method),

  rateLimited: (message: string = 'Rate limit exceeded', path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.RATE_LIMITED, message, undefined, 429, path, method),

  internal: (message: string = 'Internal server error', details?: any, path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.INTERNAL_ERROR, message, details, 500, path, method),

  serviceUnavailable: (message: string = 'Service temporarily unavailable', path?: string, method?: string) =>
    createErrorResponse(ERROR_CODES.SERVICE_UNAVAILABLE, message, undefined, 503, path, method)
}

/**
 * Centralized error handler for API routes
 */
export async function handleApiError(
  error: unknown,
  path?: string,
  method?: string
): Promise<NextResponse<ApiErrorResponse>> {
  console.error('API Error:', {
    error,
    path,
    method,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined
  })

  // Handle known error types
  if (error instanceof Error) {
    // Database connection errors
    if (error.message.includes('connect') || error.message.includes('timeout')) {
      return ErrorResponses.databaseError('Database connection failed', error.message, path, method)
    }
    
    // Supabase errors
    if (error.message.includes('supabase') || error.message.includes('postgres')) {
      return ErrorResponses.databaseError('Database operation failed', error.message, path, method)
    }
    
    // Storage errors
    if (error.message.includes('storage') || error.message.includes('bucket')) {
      return ErrorResponses.storageError('Storage operation failed', error.message, path, method)
    }
    
    // Generic error with message
    return ErrorResponses.internal(error.message, undefined, path, method)
  }

  // Unknown error type
  return ErrorResponses.internal('An unexpected error occurred', undefined, path, method)
}

/**
 * Middleware wrapper for error handling in API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>,
  path?: string,
  method?: string
) {
  return async (...args: T): Promise<NextResponse<R | ApiErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error, path, method)
    }
  }
}
