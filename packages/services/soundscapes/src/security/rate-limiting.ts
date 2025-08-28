/**
 * Rate Limiting Middleware for Soundscapes Plugin
 * Implements sliding window rate limiting with Redis-like in-memory store
 */

import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '../utils/error-handling'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

interface RateLimitStore {
  hits: number
  resetTime: number
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitStore>()

// Default configurations for different endpoint types
export const RateLimitConfigs = {
  // Strict rate limiting for admin operations
  ADMIN_OPERATIONS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    skipSuccessfulRequests: false,
  },
  
  // Medium rate limiting for API endpoints
  API_ENDPOINTS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    skipSuccessfulRequests: false,
  },
  
  // Relaxed rate limiting for user operations
  USER_OPERATIONS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
    skipSuccessfulRequests: true,
  },
  
  // Very strict for sensitive operations
  SENSITIVE_OPERATIONS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
    skipSuccessfulRequests: false,
  }
} as const

/**
 * Default key generator - uses IP address and user agent
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Get IP from headers (NextRequest doesn't have direct ip property)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'anonymous'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a simple hash for user agent to avoid long keys
  const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 10)
  
  return `${ip}:${userAgentHash}`
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  
  for (const [key, store] of rateLimitStore.entries()) {
    if (store.resetTime <= now) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Create a rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(request)
    const now = Date.now()
    
    // Clean up expired entries periodically (every 100 requests)
    if (Math.random() < 0.01) {
      cleanupExpiredEntries()
    }
    
    let store = rateLimitStore.get(key)
    
    // Initialize or reset if window has expired
    if (!store || store.resetTime <= now) {
      store = {
        hits: 0,
        resetTime: now + config.windowMs
      }
      rateLimitStore.set(key, store)
    }
    
    // Check if rate limit is exceeded
    if (store.hits >= config.maxRequests) {
      const remainingTime = Math.ceil((store.resetTime - now) / 1000)
      
      const response = createErrorResponse(
        'RATE_LIMITED',
        'Too many requests',
        `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
        429,
        '/api/soundscapes/rate-limit'
      )
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', store.resetTime.toString())
      response.headers.set('Retry-After', remainingTime.toString())
      
      return response
    }
    
    // Increment hit count
    store.hits++
    
    try {
      // Execute the handler
      const response = await handler(request)
      
      // Add rate limit headers to successful responses
      const remaining = config.maxRequests - store.hits
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', store.resetTime.toString())
      
      // If configured to skip successful requests, decrement counter
      if (config.skipSuccessfulRequests && response.status < 400) {
        store.hits--
      }
      
      return response
      
    } catch (error) {
      // If configured to skip failed requests, decrement counter
      if (config.skipFailedRequests) {
        store.hits--
      }
      throw error
    }
  }
}

/**
 * Pre-configured rate limit middleware for common use cases
 */
export const RateLimitMiddleware = {
  admin: createRateLimit(RateLimitConfigs.ADMIN_OPERATIONS),
  api: createRateLimit(RateLimitConfigs.API_ENDPOINTS),
  user: createRateLimit(RateLimitConfigs.USER_OPERATIONS),
  sensitive: createRateLimit(RateLimitConfigs.SENSITIVE_OPERATIONS),
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(request: NextRequest, config: RateLimitConfig) {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(request)
  const store = rateLimitStore.get(key)
  const now = Date.now()
  
  if (!store || store.resetTime <= now) {
    return {
      hits: 0,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      isExceeded: false
    }
  }
  
  return {
    hits: store.hits,
    remaining: Math.max(0, config.maxRequests - store.hits),
    resetTime: store.resetTime,
    isExceeded: store.hits >= config.maxRequests
  }
}

/**
 * Clear rate limit for a specific key (useful for testing or admin override)
 */
export function clearRateLimit(request: NextRequest, config?: RateLimitConfig): boolean {
  const keyGenerator = config?.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(request)
  
  return rateLimitStore.delete(key)
}

/**
 * Get rate limit store statistics (for monitoring)
 */
export function getRateLimitStats() {
  const now = Date.now()
  let activeEntries = 0
  let expiredEntries = 0
  
  for (const [, store] of rateLimitStore.entries()) {
    if (store.resetTime > now) {
      activeEntries++
    } else {
      expiredEntries++
    }
  }
  
  return {
    totalEntries: rateLimitStore.size,
    activeEntries,
    expiredEntries,
    memoryUsage: rateLimitStore.size * 100, // Rough estimate in bytes
  }
}
