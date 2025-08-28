/**
 * Security Headers and CORS Configuration for Soundscapes Plugin
 * Implements comprehensive security headers and CORS policies
 */

import { NextRequest, NextResponse } from 'next/server'

// CORS configuration interface
export interface CORSConfig {
  origins?: readonly string[] | string[] | '*'
  methods?: readonly string[] | string[]
  headers?: readonly string[] | string[]
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
}

// Security headers configuration
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string
  contentTypeOptions?: boolean
  referrerPolicy?: string
  strictTransportSecurity?: string
  permissionsPolicy?: string
  crossOriginEmbedderPolicy?: string
  crossOriginOpenerPolicy?: string
  crossOriginResourcePolicy?: string
}

// Default CORS configurations
export const CORSConfigs = {
  // Strict CORS for admin endpoints
  ADMIN_STRICT: {
    origins: ['http://localhost:3000', 'https://familying.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  
  // Relaxed CORS for public API
  PUBLIC_API: {
    origins: '*',
    methods: ['GET', 'POST'],
    headers: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 3600 // 1 hour
  },
  
  // Development CORS (more permissive)
  DEVELOPMENT: {
    origins: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 0 // No caching in development
  }
} as const

// Default security headers
export const SecurityHeaders = {
  // Content Security Policy - restricts resource loading
  contentSecurityPolicy: `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    media-src 'self' blob: data:;
    connect-src 'self' wss: https:;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),
  
  // Frame options - prevent clickjacking
  frameOptions: 'DENY',
  
  // Content type options - prevent MIME type sniffing
  contentTypeOptions: true,
  
  // Referrer policy - control referrer information
  referrerPolicy: 'strict-origin-when-cross-origin',
  
  // Strict Transport Security - enforce HTTPS
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  
  // Permissions Policy - control browser features
  permissionsPolicy: `
    geolocation=(),
    microphone=(),
    camera=(),
    payment=(),
    usb=(),
    magnetometer=(),
    gyroscope=(),
    speaker=(self),
    fullscreen=(self)
  `.replace(/\s+/g, ' ').trim(),
  
  // Cross-Origin policies
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin'
} as const

/**
 * Check if origin is allowed based on CORS configuration
 */
function isOriginAllowed(origin: string | null, allowedOrigins: readonly string[] | string[] | '*'): boolean {
  if (!origin) return false
  if (allowedOrigins === '*') return true
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin) || 
           allowedOrigins.some(allowed => {
             // Support wildcard subdomains like *.example.com
             if (allowed.startsWith('*.')) {
               const domain = allowed.slice(2)
               return origin.endsWith(`.${domain}`) || origin === domain
             }
             return allowed === origin
           })
  }
  return false
}

/**
 * Apply CORS headers to response
 */
export function applyCORSHeaders(
  response: NextResponse,
  request: NextRequest,
  config: CORSConfig = CORSConfigs.PUBLIC_API
): NextResponse {
  const origin = request.headers.get('origin')
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    if (config.origins && isOriginAllowed(origin, config.origins)) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
    } else if (config.origins === '*') {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }
    
    if (config.methods) {
      response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '))
    }
    
    if (config.headers) {
      response.headers.set('Access-Control-Allow-Headers', config.headers.join(', '))
    }
    
    if (config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    if (config.maxAge !== undefined) {
      response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
    }
    
    return new NextResponse(null, { 
      status: config.optionsSuccessStatus || 204,
      headers: response.headers
    })
  }
  
  // Handle actual requests
  if (config.origins && isOriginAllowed(origin, config.origins)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  } else if (config.origins === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }
  
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  // Add Vary header for origin
  const varyHeader = response.headers.get('Vary')
  if (varyHeader) {
    response.headers.set('Vary', `${varyHeader}, Origin`)
  } else {
    response.headers.set('Vary', 'Origin')
  }
  
  return response
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = SecurityHeaders
): NextResponse {
  // Content Security Policy
  if (config.contentSecurityPolicy) {
    response.headers.set('Content-Security-Policy', config.contentSecurityPolicy)
  }
  
  // X-Frame-Options
  if (config.frameOptions) {
    response.headers.set('X-Frame-Options', config.frameOptions)
  }
  
  // X-Content-Type-Options
  if (config.contentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }
  
  // Referrer-Policy
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', config.referrerPolicy)
  }
  
  // Strict-Transport-Security (only over HTTPS)
  if (config.strictTransportSecurity) {
    response.headers.set('Strict-Transport-Security', config.strictTransportSecurity)
  }
  
  // Permissions-Policy
  if (config.permissionsPolicy) {
    response.headers.set('Permissions-Policy', config.permissionsPolicy)
  }
  
  // Cross-Origin-Embedder-Policy
  if (config.crossOriginEmbedderPolicy) {
    response.headers.set('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy)
  }
  
  // Cross-Origin-Opener-Policy
  if (config.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy)
  }
  
  // Cross-Origin-Resource-Policy
  if (config.crossOriginResourcePolicy) {
    response.headers.set('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy)
  }
  
  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  
  return response
}

/**
 * Create a comprehensive security middleware
 */
export function createSecurityMiddleware(
  corsConfig: CORSConfig = CORSConfigs.PUBLIC_API,
  securityConfig: SecurityHeadersConfig = SecurityHeaders
) {
  return async function securityMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Handle preflight requests immediately
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 })
      return applyCORSHeaders(response, request, corsConfig)
    }
    
    try {
      // Execute the handler
      const response = await handler(request)
      
      // Apply CORS headers
      applyCORSHeaders(response, request, corsConfig)
      
      // Apply security headers
      applySecurityHeaders(response, securityConfig)
      
      return response
      
    } catch (error) {
      // Even for errors, apply security headers
      const errorResponse = new NextResponse(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
      
      applyCORSHeaders(errorResponse, request, corsConfig)
      applySecurityHeaders(errorResponse, securityConfig)
      
      return errorResponse
    }
  }
}

/**
 * Pre-configured security middleware for common use cases
 */
export const SecurityMiddleware = {
  // Strict security for admin endpoints
  admin: createSecurityMiddleware(CORSConfigs.ADMIN_STRICT, {
    ...SecurityHeaders,
    frameOptions: 'DENY',
    crossOriginResourcePolicy: 'same-origin'
  }),
  
  // Relaxed security for public API
  publicApi: createSecurityMiddleware(CORSConfigs.PUBLIC_API, {
    ...SecurityHeaders,
    frameOptions: 'SAMEORIGIN',
    crossOriginResourcePolicy: 'cross-origin'
  }),
  
  // Development-friendly configuration
  development: createSecurityMiddleware(CORSConfigs.DEVELOPMENT, {
    ...SecurityHeaders,
    contentSecurityPolicy: undefined, // Disable CSP in development
    strictTransportSecurity: undefined // No HTTPS requirement in development
  })
}

/**
 * Validate request against security policies
 */
export function validateSecurityPolicy(request: NextRequest): {
  isValid: boolean
  violations: string[]
} {
  const violations: string[] = []
  
  // Check for common security issues
  const userAgent = request.headers.get('user-agent')
  if (!userAgent) {
    violations.push('Missing User-Agent header')
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-rewrite-url', 'x-original-url']
  for (const header of suspiciousHeaders) {
    if (request.headers.get(header)) {
      violations.push(`Suspicious header detected: ${header}`)
    }
  }
  
  // Check content length for potential DoS
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    violations.push('Request content length exceeds limit')
  }
  
  // Check for SQL injection patterns in URL
  const url = request.url.toLowerCase()
  const sqlPatterns = ['union', 'select', 'insert', 'delete', 'drop', 'exec', 'script']
  for (const pattern of sqlPatterns) {
    if (url.includes(pattern)) {
      violations.push(`Potential SQL injection pattern detected: ${pattern}`)
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  }
}

/**
 * Get security context for monitoring
 */
export function getSecurityContext(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries())
  }
}
