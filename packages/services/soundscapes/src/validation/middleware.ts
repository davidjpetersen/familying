import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

export interface ValidationError {
  success: false
  error: {
    code: 'VALIDATION_ERROR'
    message: string
    details: Array<{
      field: string
      message: string
    }>
    timestamp: string
    requestId: string
  }
}

export interface ValidationSuccess<T> {
  success: true
  data: T
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError

/**
 * Validates request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json()
    const result = schema.parse(body)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          })),
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      }
    }
    
    // Handle JSON parsing errors
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON in request body',
        details: [{ field: 'body', message: 'Malformed JSON' }],
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    
    // Convert string values to appropriate types for validation
    const processedParams = Object.entries(params).reduce((acc, [key, value]) => {
      // Handle boolean conversion
      if (value === 'true') acc[key] = true
      else if (value === 'false') acc[key] = false
      // Handle number conversion
      else if (!isNaN(Number(value)) && value !== '') acc[key] = Number(value)
      else acc[key] = value
      
      return acc
    }, {} as any)
    
    const result = schema.parse(processedParams)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          })),
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      }
    }
    
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Unknown validation error',
        details: [{ field: 'unknown', message: 'Validation failed' }],
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }
  }
}

/**
 * Validates URL parameters against a Zod schema
 */
export function validateParams<T>(
  params: any,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const result = schema.parse(params)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'URL parameter validation failed',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          })),
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      }
    }
    
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Unknown validation error',
        details: [{ field: 'unknown', message: 'Validation failed' }],
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }
  }
}

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(validation: ValidationError): NextResponse {
  return NextResponse.json(validation, { status: 400 })
}
