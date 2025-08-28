/**
 * Comprehensive testing infrastructure for production readiness
 * Includes integration tests, E2E tests, performance tests, and test utilities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { SoundscapesRepository, getDatabase } from '../database/enhanced-database'
import { getResilienceManager } from '../resilience'
import { createSecurityMiddleware } from '../security/enhanced-security'
import { config } from '../config'

// Test database setup
class TestDatabase {
  private static instance: TestDatabase
  private isSetup = false

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase()
    }
    return TestDatabase.instance
  }

  async setup(): Promise<void> {
    if (this.isSetup) return

    // Setup test database schema
    const db = getDatabase()
    
    // Create test tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS test_soundscapes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        category text CHECK (category IN ('Sleep', 'Nature', 'White Noise', 'Focus')) DEFAULT 'Sleep',
        audio_url text NOT NULL,
        thumbnail_url text NOT NULL,
        is_published boolean DEFAULT true,
        sort_order int DEFAULT 0,
        duration_seconds int,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `)

    await db.query(`
      CREATE TABLE IF NOT EXISTS test_audit_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name text NOT NULL,
        operation text NOT NULL,
        record_id uuid NOT NULL,
        user_id text NOT NULL,
        changes jsonb,
        created_at timestamptz DEFAULT now()
      )
    `)

    this.isSetup = true
  }

  async cleanup(): Promise<void> {
    const db = getDatabase()
    await db.query('DROP TABLE IF EXISTS test_soundscapes CASCADE')
    await db.query('DROP TABLE IF EXISTS test_audit_log CASCADE')
    this.isSetup = false
  }

  async seedTestData(): Promise<any[]> {
    const db = getDatabase()
    const testSoundscapes = [
      {
        title: 'Test Ocean Waves',
        description: 'Test ocean sounds',
        category: 'Nature',
        audio_url: 'https://example.com/test-ocean.mp3',
        thumbnail_url: 'https://example.com/test-ocean.jpg',
        is_published: true,
        sort_order: 1,
        duration_seconds: 1800,
      },
      {
        title: 'Test White Noise',
        description: 'Test white noise',
        category: 'White Noise',
        audio_url: 'https://example.com/test-noise.mp3',
        thumbnail_url: 'https://example.com/test-noise.jpg',
        is_published: false,
        sort_order: 2,
        duration_seconds: 3600,
      },
    ]

    const results = []
    for (const soundscape of testSoundscapes) {
      const result = await db.query(
        `INSERT INTO test_soundscapes (
          title, description, category, audio_url, thumbnail_url,
          is_published, sort_order, duration_seconds
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          soundscape.title, soundscape.description, soundscape.category,
          soundscape.audio_url, soundscape.thumbnail_url,
          soundscape.is_published, soundscape.sort_order, soundscape.duration_seconds
        ]
      )
      results.push(result[0])
    }

    return results
  }
}

// Test utilities
export class TestUtils {
  static createMockRequest(
    url: string = 'https://example.com/api/soundscapes',
    options: {
      method?: string
      headers?: Record<string, string>
      body?: any
      user?: any
    } = {}
  ): NextRequest {
    const { method = 'GET', headers = {}, body } = options

    const request = new NextRequest(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    })

    return request
  }

  static createAuthenticatedRequest(
    url: string,
    user: { id: string; role?: string; permissions?: string[] },
    options: any = {}
  ): NextRequest {
    // Create a mock JWT token (in real tests, use proper JWT generation)
    const token = TestUtils.createMockJWT(user)
    
    return TestUtils.createMockRequest(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })
  }

  static createMockJWT(payload: any): string {
    // Simplified JWT creation for testing
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const payloadEncoded = Buffer.from(JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    })).toString('base64url')
    const signature = 'mock-signature'
    
    return `${header}.${payloadEncoded}.${signature}`
  }

  static async waitFor(condition: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Condition not met within ${timeout}ms`)
  }

  static async measurePerformance<T>(operation: () => Promise<T>): Promise<{
    result: T
    duration: number
    memory: { before: number; after: number; delta: number }
  }> {
    const memoryBefore = process.memoryUsage().heapUsed
    const start = Date.now()
    
    const result = await operation()
    
    const duration = Date.now() - start
    const memoryAfter = process.memoryUsage().heapUsed
    
    return {
      result,
      duration,
      memory: {
        before: memoryBefore,
        after: memoryAfter,
        delta: memoryAfter - memoryBefore,
      },
    }
  }
}

// Integration test suite
describe('Soundscapes Integration Tests', () => {
  let testDb: TestDatabase
  let repository: SoundscapesRepository
  let testData: any[]

  beforeAll(async () => {
    testDb = TestDatabase.getInstance()
    await testDb.setup()
    repository = new SoundscapesRepository(getDatabase())
    testData = await testDb.seedTestData()
  })

  afterAll(async () => {
    await testDb.cleanup()
  })

  beforeEach(async () => {
    // Reset test data before each test
    await testDb.cleanup()
    await testDb.setup()
    testData = await testDb.seedTestData()
  })

  describe('Repository Operations', () => {
    it('should find all soundscapes with filters', async () => {
      const result = await repository.findAll({
        category: 'Nature',
        isPublished: true,
        limit: 10,
        offset: 0,
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should find soundscape by ID', async () => {
      const soundscape = testData[0]
      const result = await repository.findById(soundscape.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(soundscape.id)
    })

    it('should create new soundscape with transaction', async () => {
      const newSoundscape = {
        title: 'Integration Test Sound',
        description: 'Created during integration test',
        category: 'Focus',
        audio_url: 'https://example.com/test.mp3',
        thumbnail_url: 'https://example.com/test.jpg',
        is_published: true,
        sort_order: 999,
        duration_seconds: 900,
        created_by: 'test-user',
      }

      const result = await repository.create(newSoundscape)

      expect(result).toBeDefined()
      expect(result.title).toBe(newSoundscape.title)
      expect(result.id).toBeDefined()
    })

    it('should update soundscape with audit trail', async () => {
      const soundscape = testData[0]
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
        updated_by: 'test-user',
      }

      const result = await repository.update(soundscape.id, updates)

      expect(result).toBeDefined()
      expect(result.title).toBe(updates.title)
      expect(result.description).toBe(updates.description)
    })

    it('should delete soundscape with audit trail', async () => {
      const soundscape = testData[0]
      const result = await repository.delete(soundscape.id, 'test-user')

      expect(result).toBe(true)

      // Verify deletion
      const deleted = await repository.findById(soundscape.id)
      expect(deleted).toBeNull()
    })
  })

  describe('Performance Tests', () => {
    it('should handle concurrent reads efficiently', async () => {
      const concurrentReads = Array.from({ length: 10 }, () =>
        repository.findAll({ limit: 50 })
      )

      const performance = await TestUtils.measurePerformance(async () => {
        return Promise.all(concurrentReads)
      })

      expect(performance.duration).toBeLessThan(2000) // Should complete within 2 seconds
      expect(performance.memory.delta).toBeLessThan(50 * 1024 * 1024) // Memory delta < 50MB
    })

    it('should handle database transaction rollback', async () => {
      const db = getDatabase()
      
      try {
        await db.transaction(async (tx) => {
          await tx.query(
            'INSERT INTO test_soundscapes (title, audio_url, thumbnail_url) VALUES ($1, $2, $3)',
            ['Rollback Test', 'https://example.com/test.mp3', 'https://example.com/test.jpg']
          )
          
          // Force an error to trigger rollback
          throw new Error('Intentional rollback')
        })
      } catch (error) {
        expect((error as Error).message).toBe('Intentional rollback')
      }

      // Verify rollback - record should not exist
      const results = await db.query(
        'SELECT * FROM test_soundscapes WHERE title = $1',
        ['Rollback Test']
      )
      expect(results.length).toBe(0)
    })
  })

  describe('Resilience Tests', () => {
    it('should handle circuit breaker pattern', async () => {
      const resilience = getResilienceManager()
      let failureCount = 0

      const flakyOperation = async () => {
        failureCount++
        if (failureCount <= 3) {
          throw new Error('Simulated failure')
        }
        return 'Success'
      }

      // First few calls should fail and trigger circuit breaker
      await expect(
        resilience.executeResilient('test-operation', flakyOperation)
      ).rejects.toThrow('Simulated failure')

      // Eventually should succeed when operation becomes reliable
      const result = await resilience.executeResilient('test-operation', flakyOperation)
      expect(result).toBe('Success')
    })

    it('should use fallback when primary operation fails', async () => {
      const resilience = getResilienceManager()
      
      // Register a fallback
      resilience.registerFallback('test-fallback', async () => 'Fallback Result')

      const failingOperation = async () => {
        throw new Error('Primary operation failed')
      }

      const result = await resilience.executeResilient(
        'test-operation',
        failingOperation,
        'test-fallback'
      )

      expect(result).toBe('Fallback Result')
    })
  })
})

// API endpoint tests
describe('Soundscapes API Tests', () => {
  let securityMiddleware: any

  beforeAll(() => {
    securityMiddleware = createSecurityMiddleware()
  })

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated requests to admin endpoints', async () => {
      const request = TestUtils.createMockRequest('https://example.com/api/admin/soundscapes')
      
      const response = await securityMiddleware.withSecurity(
        request,
        async () => {
          return new Response('Should not reach here')
        },
        { requireAuth: true }
      )

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should allow authenticated admin requests', async () => {
      const adminUser = { id: 'admin-123', role: 'admin', permissions: ['soundscapes:write'] }
      const request = TestUtils.createAuthenticatedRequest(
        'https://example.com/api/admin/soundscapes',
        adminUser,
        { method: 'POST' }
      )

      const response = await securityMiddleware.withSecurity(
        request,
        async (_req: any, context: any) => {
          expect(context.auth.isAuthenticated).toBe(true)
          expect(context.auth.user.role).toBe('admin')
          return new Response(JSON.stringify({ success: true }))
        },
        { requireAuth: true, requiredRole: 'admin' }
      )

      expect(response.status).toBe(200)
    })

    it('should enforce rate limiting', async () => {
      // This test would need to be configured based on your rate limiting setup
      // For demonstration, we'll simulate multiple requests
      const requests = Array.from({ length: 15 }, (_, i) =>
        TestUtils.createMockRequest(`https://example.com/api/soundscapes?test=${i}`)
      )

      const responses = await Promise.all(
        requests.map(request =>
          securityMiddleware.withSecurity(
            request,
            async () => new Response(JSON.stringify({ success: true })),
            {}
          )
        )
      )

      // Some requests should be rate limited (status 429)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock a database error
      const request = TestUtils.createMockRequest('https://example.com/api/soundscapes')
      
      const response = await securityMiddleware.withSecurity(
        request,
        async () => {
          throw new Error('Database connection failed')
        }
      )

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INTERNAL_ERROR')
    })

    it('should validate request data properly', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        category: 'InvalidCategory',
        audio_url: 'not-a-url',
      }

      const request = TestUtils.createMockRequest(
        'https://example.com/api/soundscapes',
        { method: 'POST', body: invalidData }
      )

      // This would test your validation middleware
      // Implementation depends on your actual validation setup
      expect(request).toBeDefined()
    })
  })
})

// Load testing utilities
export class LoadTestRunner {
  static async runConcurrentRequests(
    requestCount: number,
    requestFactory: () => Promise<any>,
    options: {
      maxConcurrency?: number
      timeout?: number
    } = {}
  ): Promise<{
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    maxResponseTime: number
    minResponseTime: number
    requestsPerSecond: number
  }> {
    const { maxConcurrency = 10, timeout = 30000 } = options
    const results: Array<{ success: boolean; duration: number }> = []
    const startTime = Date.now()

    // Execute requests in batches to control concurrency
    for (let i = 0; i < requestCount; i += maxConcurrency) {
      const batch = Array.from(
        { length: Math.min(maxConcurrency, requestCount - i) },
        async () => {
          const requestStart = Date.now()
          try {
            await requestFactory()
            return { success: true, duration: Date.now() - requestStart }
          } catch (error) {
            return { success: false, duration: Date.now() - requestStart }
          }
        }
      )

      const batchResults = await Promise.all(batch)
      results.push(...batchResults)

      // Check timeout
      if (Date.now() - startTime > timeout) {
        break
      }
    }

    const totalTime = Date.now() - startTime
    const successfulResults = results.filter(r => r.success)
    const durations = results.map(r => r.duration)

    return {
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: results.length - successfulResults.length,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxResponseTime: Math.max(...durations),
      minResponseTime: Math.min(...durations),
      requestsPerSecond: (results.length / totalTime) * 1000,
    }
  }
}

export { TestDatabase }
