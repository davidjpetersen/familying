/**
 * Security - Rate Limiting Tests
 */

import { NextRequest } from 'next/server'
import { 
  createRateLimit, 
  RateLimitConfigs, 
  getRateLimitStatus,
  clearRateLimit,
  getRateLimitStats
} from '../../../src/security/rate-limiting'

// Mock NextRequest
function createMockRequest(options: {
  ip?: string
  userAgent?: string
  url?: string
  method?: string
} = {}): NextRequest {
  const url = options.url || 'http://localhost:3000/api/test'
  
  const headers = new Headers()
  if (options.ip) headers.set('x-forwarded-for', options.ip)
  if (options.userAgent) headers.set('user-agent', options.userAgent)
  
  return {
    url,
    method: options.method || 'GET',
    headers,
    nextUrl: new URL(url)
  } as NextRequest
}

// Mock handler
const mockHandler = jest.fn().mockResolvedValue(
  new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
)

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Clear all rate limit data by creating a mock clear function
    // Since we can't directly access the internal store, we'll use a different approach
    jest.resetModules()
  })

  describe('createRateLimit', () => {
    it('should allow requests within limit', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 5
      })
      
      const request = createMockRequest({ ip: '192.168.1.1' })
      
      // Should allow first request
      const response = await rateLimit(request, mockHandler)
      
      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith(request)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')
    })

    it('should block requests when limit exceeded', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      })
      
      const request = createMockRequest({ ip: '192.168.1.2' })
      
      // Make requests up to limit
      await rateLimit(request, mockHandler)
      await rateLimit(request, mockHandler)
      
      // Next request should be blocked
      const response = await rateLimit(request, mockHandler)
      
      expect(response.status).toBe(429)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.has('Retry-After')).toBe(true)
      
      const responseBody = await response.json()
      expect(responseBody.success).toBe(false)
      expect(responseBody.error.code).toBe('RATE_LIMITED')
    })

    it('should differentiate between different IPs', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      })
      
      // Use unique IPs to avoid interference with other tests
      const request1 = createMockRequest({ ip: '10.0.0.1' })
      const request2 = createMockRequest({ ip: '10.0.0.2' })
      
      // First IP makes request
      const response1 = await rateLimit(request1, mockHandler)
      expect(response1.status).toBe(200)
      
      // Second IP should be allowed (different key)
      const response2 = await rateLimit(request2, mockHandler)
      expect(response2.status).toBe(200)
      
      // First IP tries again, should be blocked
      const response3 = await rateLimit(request1, mockHandler)
      expect(response3.status).toBe(429)
    })

    it('should reset after window expires', async () => {
      const rateLimit = createRateLimit({
        windowMs: 100, // 100ms window
        maxRequests: 1
      })
      
      const request = createMockRequest({ ip: '192.168.1.3' })
      
      // Make request to hit limit
      await rateLimit(request, mockHandler)
      
      // Second request should be blocked
      const blockedResponse = await rateLimit(request, mockHandler)
      expect(blockedResponse.status).toBe(429)
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be allowed again
      const allowedResponse = await rateLimit(request, mockHandler)
      expect(allowedResponse.status).toBe(200)
    })

    it('should handle custom key generator', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: () => 'custom-key'
      })
      
      const request1 = createMockRequest({ ip: '192.168.1.1' })
      const request2 = createMockRequest({ ip: '192.168.1.2' })
      
      // Both requests use same custom key
      await rateLimit(request1, mockHandler)
      
      const response = await rateLimit(request2, mockHandler)
      expect(response.status).toBe(429) // Should be blocked despite different IPs
    })
  })

  describe('Rate Limit Configurations', () => {
    it('should have admin operations config', () => {
      expect(RateLimitConfigs.ADMIN_OPERATIONS).toEqual({
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        skipSuccessfulRequests: false
      })
    })

    it('should have API endpoints config', () => {
      expect(RateLimitConfigs.API_ENDPOINTS).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 60,
        skipSuccessfulRequests: false
      })
    })

    it('should have user operations config', () => {
      expect(RateLimitConfigs.USER_OPERATIONS).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 120,
        skipSuccessfulRequests: true
      })
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return current status', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 5
      }
      
      const request = createMockRequest({ ip: '192.168.1.4' })
      
      // Initial status
      const initialStatus = getRateLimitStatus(request, config)
      expect(initialStatus.hits).toBe(0)
      expect(initialStatus.remaining).toBe(5)
      expect(initialStatus.isExceeded).toBe(false)
      
      // Make some requests
      const rateLimit = createRateLimit(config)
      await rateLimit(request, mockHandler)
      await rateLimit(request, mockHandler)
      
      const afterRequests = getRateLimitStatus(request, config)
      expect(afterRequests.hits).toBe(2)
      expect(afterRequests.remaining).toBe(3)
      expect(afterRequests.isExceeded).toBe(false)
    })
  })

  describe('getRateLimitStats', () => {
    it('should return statistics', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })
      
      // Make some requests
      await rateLimit(createMockRequest({ ip: '192.168.1.5' }), mockHandler)
      await rateLimit(createMockRequest({ ip: '192.168.1.6' }), mockHandler)
      
      const stats = getRateLimitStats()
      
      expect(stats.totalEntries).toBeGreaterThan(0)
      expect(stats.activeEntries).toBeGreaterThan(0)
      expect(typeof stats.memoryUsage).toBe('number')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing IP address', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      })
      
      const request = createMockRequest() // No IP
      const response = await rateLimit(request, mockHandler)
      
      expect(response.status).toBe(200)
    })

    it('should handle missing user agent', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      })
      
      const request = createMockRequest({ ip: '192.168.1.7' }) // No user agent
      const response = await rateLimit(request, mockHandler)
      
      expect(response.status).toBe(200)
    })

    it('should handle handler errors', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      })
      
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'))
      const request = createMockRequest({ ip: '192.168.1.8' })
      
      await expect(rateLimit(request, errorHandler)).rejects.toThrow('Handler error')
    })

    it('should skip successful requests when configured', async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        skipSuccessfulRequests: true
      })
      
      const request = createMockRequest({ ip: '192.168.1.9' })
      
      // Make successful request
      await rateLimit(request, mockHandler)
      
      // Should still be allowed (counter was decremented)
      const response = await rateLimit(request, mockHandler)
      expect(response.status).toBe(200)
    })
  })
})
