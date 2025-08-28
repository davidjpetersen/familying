/**
 * Security Module Index for Soundscapes Plugin
 * Exports all security components and provides integrated middleware
 */

// Re-export all security components
export * from './rate-limiting'
export * from './authentication'
export * from './headers'
export * from './permissions'
export * from './validation'

// Import types and main components
import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit, RateLimitConfigs } from './rate-limiting'
import { createAuthMiddleware, type AuthContext } from './authentication'
import { createSecurityMiddleware, CORSConfigs, SecurityHeaders } from './headers'
import { createPermissionMiddleware, type Permission } from './permissions'
import { createSecurityValidationMiddleware } from './validation'

// Security configuration interface
export interface SecurityConfig {
  rateLimit?: {
    enabled: boolean
    config?: keyof typeof RateLimitConfigs
    custom?: Parameters<typeof createRateLimit>[0]
  }
  authentication?: {
    enabled: boolean
    requireAuth?: boolean
    requiredRole?: string
    requiredPermissions?: Permission[]
  }
  cors?: {
    enabled: boolean
    config?: keyof typeof CORSConfigs
  }
  headers?: {
    enabled: boolean
  }
  validation?: {
    enabled: boolean
  }
}

// Default security configurations for different endpoint types
export const SecurityConfigs = {
  // Admin endpoints - maximum security
  ADMIN: {
    rateLimit: { enabled: true, config: 'ADMIN_OPERATIONS' as const },
    authentication: { 
      enabled: true, 
      requireAuth: true, 
      requiredRole: 'admin' 
    },
    cors: { enabled: true, config: 'ADMIN_STRICT' as const },
    headers: { enabled: true },
    validation: { enabled: true }
  },
  
  // API endpoints - balanced security
  API: {
    rateLimit: { enabled: true, config: 'API_ENDPOINTS' as const },
    authentication: { 
      enabled: true, 
      requireAuth: true 
    },
    cors: { enabled: true, config: 'PUBLIC_API' as const },
    headers: { enabled: true },
    validation: { enabled: true }
  },
  
  // Public endpoints - basic security
  PUBLIC: {
    rateLimit: { enabled: true, config: 'USER_OPERATIONS' as const },
    authentication: { enabled: false },
    cors: { enabled: true, config: 'PUBLIC_API' as const },
    headers: { enabled: true },
    validation: { enabled: true }
  },
  
  // Development - relaxed security
  DEVELOPMENT: {
    rateLimit: { enabled: false },
    authentication: { enabled: false },
    cors: { enabled: true, config: 'DEVELOPMENT' as const },
    headers: { enabled: false },
    validation: { enabled: true }
  }
} as const

/**
 * Create a comprehensive security middleware stack
 */
export function createSecurityStack(config: SecurityConfig) {
  // Build middleware stack
  const middlewareStack: Array<(
    request: NextRequest,
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
  ) => Promise<NextResponse>> = []
  
  // 1. Security validation (first layer)
  if (config.validation?.enabled) {
    middlewareStack.push(createSecurityValidationMiddleware())
  }
  
  // 2. Rate limiting
  if (config.rateLimit?.enabled) {
    const rateLimitConfig = config.rateLimit.custom || 
      (config.rateLimit.config ? RateLimitConfigs[config.rateLimit.config] : RateLimitConfigs.API_ENDPOINTS)
    
    middlewareStack.push(createRateLimit(rateLimitConfig))
  }
  
  // 3. Authentication
  let authMiddleware: any = null
  if (config.authentication?.enabled) {
    authMiddleware = createAuthMiddleware({
      requireAuth: config.authentication.requireAuth,
      requiredRole: config.authentication.requiredRole,
      requiredPermissions: config.authentication.requiredPermissions
    })
  }
  
  // 4. CORS and security headers
  if (config.cors?.enabled || config.headers?.enabled) {
    const corsConfig = config.cors?.config ? CORSConfigs[config.cors.config] : CORSConfigs.PUBLIC_API
    middlewareStack.push(createSecurityMiddleware(corsConfig, SecurityHeaders))
  }
  
  // Return the composed middleware
  return async function securityStackMiddleware(
    request: NextRequest,
    handler: (request: NextRequest, context?: AuthContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Execute validation and rate limiting middleware
    let currentHandler = handler
    
    // Apply non-auth middleware in reverse order
    for (let i = middlewareStack.length - 1; i >= 0; i--) {
      const middleware = middlewareStack[i]
      const previousHandler = currentHandler
      
      currentHandler = async (req: NextRequest) => {
        return middleware(req, previousHandler)
      }
    }
    
    // Apply authentication middleware if enabled
    if (authMiddleware) {
      const finalHandler = currentHandler
      return authMiddleware(request, async (req: NextRequest, authContext: AuthContext) => {
        return finalHandler(req)
      })
    } else {
      return currentHandler(request)
    }
  }
}

/**
 * Pre-configured security middleware for common use cases
 */
export const SecurityMiddleware = {
  // Admin endpoints
  admin: createSecurityStack(SecurityConfigs.ADMIN),
  
  // API endpoints
  api: createSecurityStack(SecurityConfigs.API),
  
  // Public endpoints
  public: createSecurityStack(SecurityConfigs.PUBLIC),
  
  // Development
  development: createSecurityStack(SecurityConfigs.DEVELOPMENT),
  
  // Custom security stack
  custom: (config: SecurityConfig) => createSecurityStack(config)
}

/**
 * Security monitoring and logging
 */
export interface SecurityEvent {
  type: 'rate_limit' | 'auth_failure' | 'permission_denied' | 'validation_error' | 'suspicious_activity'
  timestamp: string
  ip: string
  userAgent: string
  path: string
  method: string
  userId?: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

const securityEvents: SecurityEvent[] = []
const MAX_EVENTS = 1000 // Keep last 1000 events in memory

/**
 * Log security event
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString()
  }
  
  securityEvents.push(securityEvent)
  
  // Keep only recent events
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift()
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Security Event:', securityEvent)
  }
  
  // In production, integrate with logging service
  // Example: send to monitoring service, database, etc.
}

/**
 * Get security events for monitoring
 */
export function getSecurityEvents(filter?: {
  type?: SecurityEvent['type']
  severity?: SecurityEvent['severity']
  since?: string
  limit?: number
}): SecurityEvent[] {
  let filtered = securityEvents
  
  if (filter?.type) {
    filtered = filtered.filter(event => event.type === filter.type)
  }
  
  if (filter?.severity) {
    filtered = filtered.filter(event => event.severity === filter.severity)
  }
  
  if (filter?.since) {
    const sinceDate = new Date(filter.since)
    filtered = filtered.filter(event => new Date(event.timestamp) >= sinceDate)
  }
  
  if (filter?.limit) {
    filtered = filtered.slice(-filter.limit)
  }
  
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * Security health check
 */
export function getSecurityHealth() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  const recentEvents = securityEvents.filter(
    event => new Date(event.timestamp) >= oneHourAgo
  )
  
  const eventCounts = recentEvents.reduce((counts, event) => {
    counts[event.type] = (counts[event.type] || 0) + 1
    return counts
  }, {} as Record<string, number>)
  
  const severityCounts = recentEvents.reduce((counts, event) => {
    counts[event.severity] = (counts[event.severity] || 0) + 1
    return counts
  }, {} as Record<string, number>)
  
  // Calculate health score (0-100)
  let healthScore = 100
  
  // Deduct points for security events
  healthScore -= (severityCounts.critical || 0) * 20
  healthScore -= (severityCounts.high || 0) * 10
  healthScore -= (severityCounts.medium || 0) * 5
  healthScore -= (severityCounts.low || 0) * 1
  
  healthScore = Math.max(0, healthScore)
  
  return {
    healthScore,
    status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
    recentEvents: recentEvents.length,
    eventBreakdown: eventCounts,
    severityBreakdown: severityCounts,
    lastUpdate: now.toISOString()
  }
}

/**
 * Create security monitoring middleware
 */
export function createSecurityMonitoringMiddleware() {
  return async function securityMonitoringMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const path = new URL(request.url).pathname
    const method = request.method
    
    try {
      const response = await handler(request)
      
      // Log suspicious response codes
      if (response.status >= 400) {
        const severity = response.status >= 500 ? 'high' : 
                        response.status === 429 ? 'medium' : 'low'
        
        logSecurityEvent({
          type: response.status === 429 ? 'rate_limit' : 
                response.status === 401 ? 'auth_failure' :
                response.status === 403 ? 'permission_denied' : 'suspicious_activity',
          ip,
          userAgent,
          path,
          method,
          details: {
            statusCode: response.status,
            responseTime: Date.now() - startTime
          },
          severity
        })
      }
      
      return response
      
    } catch (error) {
      // Log errors as security events
      logSecurityEvent({
        type: 'suspicious_activity',
        ip,
        userAgent,
        path,
        method,
        details: {
          error: error instanceof Error ? error.message : String(error),
          responseTime: Date.now() - startTime
        },
        severity: 'high'
      })
      
      throw error
    }
  }
}

/**
 * Apply security to an API handler
 */
export function withSecurity(
  handler: (request: NextRequest, context?: AuthContext) => Promise<NextResponse>,
  config: SecurityConfig | keyof typeof SecurityConfigs = 'API'
) {
  const securityConfig = typeof config === 'string' ? SecurityConfigs[config] : config
  const securityStack = createSecurityStack(securityConfig)
  const monitoring = createSecurityMonitoringMiddleware()
  
  return async function securedHandler(request: NextRequest): Promise<NextResponse> {
    return monitoring(request, async (req) => {
      return securityStack(req, handler)
    })
  }
}
