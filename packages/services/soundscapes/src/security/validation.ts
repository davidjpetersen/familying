/**
 * Enhanced Input Validation and Sanitization for Soundscapes Plugin
 * Builds on Phase 1 validation with additional security measures
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createErrorResponse } from '../utils/error-handling'

// Security validation patterns
const SECURITY_PATTERNS = {
  // XSS prevention
  XSS_PATTERNS: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi
  ],
  
  // SQL injection patterns
  SQL_INJECTION_PATTERNS: [
    /(\b(select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(union\s+select)/gi,
    /('\s*(or|and)\s*')/gi,
    /(--|\#|\/\*)/gi
  ],
  
  // Path traversal patterns
  PATH_TRAVERSAL_PATTERNS: [
    /\.\.\//gi,
    /\.\.\\]/gi,
    /%2e%2e%2f/gi,
    /%2e%2e\\/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ],
  
  // Command injection patterns
  COMMAND_INJECTION_PATTERNS: [
    /[;&|`$(){}[\]]/g,
    /\b(bash|sh|cmd|powershell|eval|exec)\b/gi
  ],
  
  // File upload patterns (malicious extensions)
  MALICIOUS_EXTENSIONS: [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|aspx|jsp)$/gi
  ]
} as const

// Sanitization options
export interface SanitizationOptions {
  allowHtml?: boolean
  allowScripts?: boolean
  allowLinks?: boolean
  maxLength?: number
  trimWhitespace?: boolean
  convertToLowerCase?: boolean
  removeNullBytes?: boolean
  normalizeUnicode?: boolean
}

// Base validation schemas
const secureFilename = z.string()
  .min(1, 'Filename cannot be empty')
  .max(255, 'Filename too long')
  .refine(
    (filename) => !SECURITY_PATTERNS.PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(filename)),
    'Invalid characters in filename'
  )
  .refine(
    (filename) => !SECURITY_PATTERNS.MALICIOUS_EXTENSIONS.some(pattern => pattern.test(filename)),
    'File type not allowed'
  )
  .transform(sanitizeFilename)

const secureText = z.string()
  .max(10000, 'Text too long')
  .refine(
    (text) => !SECURITY_PATTERNS.XSS_PATTERNS.some(pattern => pattern.test(text)),
    'Invalid content detected'
  )
  .refine(
    (text) => !SECURITY_PATTERNS.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(text)),
    'Invalid content detected'
  )
  .transform((text) => sanitizeText(text, { allowHtml: false }))

// Enhanced validation schema with security checks
export const SecureValidationSchemas = {
  // Secure filename validation
  secureFilename,
  
  // Secure text input
  secureText,
  
  // Secure HTML input (for rich text)
  secureHtml: z.string()
    .max(50000, 'Content too long')
    .transform((html) => sanitizeHtml(html)),
  
  // Secure URL validation
  secureUrl: z.string()
    .url('Invalid URL format')
    .refine(
      (url) => {
        const allowedProtocols = ['http:', 'https:']
        try {
          const parsed = new URL(url)
          return allowedProtocols.includes(parsed.protocol)
        } catch {
          return false
        }
      },
      'Invalid URL protocol'
    )
    .refine(
      (url) => {
        try {
          const parsed = new URL(url)
          // Prevent localhost/private IPs in production
          const hostname = parsed.hostname
          const privateIpPatterns = [
            /^localhost$/i,
            /^127\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^::1$/,
            /^fc00:/i,
            /^fe80:/i
          ]
          
          // Allow localhost in development
          if (process.env.NODE_ENV === 'development') {
            return true
          }
          
          return !privateIpPatterns.some(pattern => pattern.test(hostname))
        } catch {
          return false
        }
      },
      'URL not allowed'
    ),
  
  // Secure JSON validation
  secureJson: z.string()
    .refine(
      (jsonStr) => {
        try {
          const parsed = JSON.parse(jsonStr)
          return validateJsonContent(parsed)
        } catch {
          return false
        }
      },
      'Invalid or unsafe JSON content'
    )
    .transform((jsonStr) => {
      const parsed = JSON.parse(jsonStr)
      return sanitizeJsonObject(parsed)
    }),
  
  // Enhanced storage import schema
  secureStorageImport: z.object({
    files: z.array(z.object({
      name: z.string().pipe(secureFilename),
      path: z.string().max(500).refine(
        (path) => !SECURITY_PATTERNS.PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(path)),
        'Invalid path'
      ),
      size: z.number().positive().max(500 * 1024 * 1024), // 500MB max
      type: z.string().optional(),
      metadata: z.record(z.unknown()).optional()
    })).max(1000, 'Too many files'), // Max 1000 files per import
    
    options: z.object({
      overwrite: z.boolean().default(false),
      validateContent: z.boolean().default(true),
      quarantine: z.boolean().default(false)
    }).optional()
  })
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace invalid characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase()
    .substring(0, 255) // Ensure max length
}

/**
 * Sanitize text content
 */
function sanitizeText(
  text: string,
  options: SanitizationOptions = {}
): string {
  let sanitized = text
  
  // Remove null bytes
  if (options.removeNullBytes !== false) {
    sanitized = sanitized.replace(/\0/g, '')
  }
  
  // Normalize unicode
  if (options.normalizeUnicode) {
    sanitized = sanitized.normalize('NFC')
  }
  
  // Remove XSS patterns if HTML not allowed
  if (!options.allowHtml) {
    SECURITY_PATTERNS.XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
  }
  
  // Remove script tags if scripts not allowed
  if (!options.allowScripts) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }
  
  // Trim whitespace
  if (options.trimWhitespace !== false) {
    sanitized = sanitized.trim()
  }
  
  // Convert to lowercase
  if (options.convertToLowerCase) {
    sanitized = sanitized.toLowerCase()
  }
  
  // Enforce max length
  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength)
  }
  
  return sanitized
}

/**
 * Sanitize HTML content (basic implementation)
 */
function sanitizeHtml(html: string): string {
  // This is a basic implementation. In production, use a library like DOMPurify
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  const allowedAttributes = ['class', 'id']
  
  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
  
  // Remove dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta']
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi')
    sanitized = sanitized.replace(regex, '')
  })
  
  return sanitized
}

/**
 * Validate JSON content for security issues
 */
function validateJsonContent(obj: any, depth = 0): boolean {
  // Prevent deep nesting (DoS protection)
  if (depth > 10) return false
  
  // Check for prototype pollution attempts
  if (obj && typeof obj === 'object') {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']
    if (dangerousKeys.some(key => key in obj)) return false
    
    // Recursively validate nested objects
    for (const value of Object.values(obj)) {
      if (!validateJsonContent(value, depth + 1)) return false
    }
  }
  
  return true
}

/**
 * Sanitize JSON object
 */
function sanitizeJsonObject(obj: any): any {
  if (obj === null || obj === undefined) return obj
  
  if (typeof obj === 'string') {
    return sanitizeText(obj, { allowHtml: false })
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeJsonObject(item))
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {}
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']
    
    for (const [key, value] of Object.entries(obj)) {
      if (!dangerousKeys.includes(key)) {
        const sanitizedKey = sanitizeText(key, { allowHtml: false })
        sanitized[sanitizedKey] = sanitizeJsonObject(value)
      }
    }
    
    return sanitized
  }
  
  return obj
}

/**
 * Security validation middleware
 */
export function createSecurityValidationMiddleware() {
  return async function securityValidationMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<any>
  ) {
    // Validate URL for security issues
    const url = new URL(request.url)
    
    // Check for path traversal in URL
    if (SECURITY_PATTERNS.PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid request path',
        'Path contains invalid characters',
        400,
        request.url
      )
    }
    
    // Validate query parameters
    for (const [key, value] of url.searchParams.entries()) {
      if (SECURITY_PATTERNS.XSS_PATTERNS.some(pattern => pattern.test(value))) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid query parameter',
          `Query parameter "${key}" contains invalid content`,
          400,
          request.url
        )
      }
    }
    
    // Validate headers for security issues
    const dangerousHeaders = ['x-forwarded-host', 'x-rewrite-url', 'x-original-url']
    for (const header of dangerousHeaders) {
      if (request.headers.get(header)) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid request header',
          `Header "${header}" not allowed`,
          400,
          request.url
        )
      }
    }
    
    // Validate content-type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type') || ''
      const allowedContentTypes = [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain'
      ]
      
      const isAllowedContentType = allowedContentTypes.some(type => 
        contentType.startsWith(type)
      )
      
      if (!isAllowedContentType) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid content type',
          `Content type "${contentType}" not allowed`,
          400,
          request.url
        )
      }
    }
    
    return handler(request)
  }
}

/**
 * File upload security validation
 */
export function validateFileUpload(file: {
  name: string
  type: string
  size: number
  content?: Buffer
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check filename
  if (SECURITY_PATTERNS.MALICIOUS_EXTENSIONS.some(pattern => pattern.test(file.name))) {
    errors.push('File type not allowed')
  }
  
  if (SECURITY_PATTERNS.PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(file.name))) {
    errors.push('Invalid filename')
  }
  
  // Check MIME type
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'audio/flac',
    'audio/aac',
    'application/json',
    'text/plain'
  ]
  
  if (!allowedMimeTypes.includes(file.type)) {
    errors.push('MIME type not allowed')
  }
  
  // Check file size (max 100MB)
  if (file.size > 100 * 1024 * 1024) {
    errors.push('File too large')
  }
  
  // Basic content validation if content provided
  if (file.content) {
    // Check for executable headers
    const executableHeaders = [
      Buffer.from([0x4D, 0x5A]), // PE executable
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
      Buffer.from([0xCF, 0xFA, 0xED, 0xFE]), // Mach-O executable
    ]
    
    for (const header of executableHeaders) {
      if (file.content.subarray(0, header.length).equals(header)) {
        errors.push('Executable file detected')
        break
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get validation summary for monitoring
 */
export function getValidationSummary(request: NextRequest) {
  const url = new URL(request.url)
  const securityIssues: string[] = []
  
  // Check for various security patterns
  if (SECURITY_PATTERNS.PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    securityIssues.push('path_traversal')
  }
  
  if (SECURITY_PATTERNS.XSS_PATTERNS.some(pattern => pattern.test(url.search))) {
    securityIssues.push('xss_attempt')
  }
  
  if (SECURITY_PATTERNS.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(url.search))) {
    securityIssues.push('sql_injection_attempt')
  }
  
  return {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    query: url.search,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    securityIssues,
    isSecure: securityIssues.length === 0
  }
}
