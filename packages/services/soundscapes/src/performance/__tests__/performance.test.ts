import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { MemoryCache, soundscapesCache, storageCache, categoriesCache } from '../cache'
import { 
  extractPaginationParams, 
  createPaginatedResponse, 
  applyPagination,
  PaginationConfigs 
} from '../pagination'
import { QueryMonitor, executeOptimizedQuery, ConnectionManager } from '../query-optimization'
import { HealthCheckService, healthCheck, performanceMetrics } from '../monitoring'

// Mock Next.js request
function createMockRequest(url: string, options?: RequestInit & { signal?: AbortSignal }): NextRequest {
  return new NextRequest(url, options)
}

// Simple mock for supabase
const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        or: () => ({
          range: () => ({
            order: () => Promise.resolve({
              data: [{ id: 1, name: 'Test' }],
              error: null,
              count: 1
            })
          })
        })
      })
    })
  })
}

describe('Performance Optimization System', () => {
  beforeEach(() => {
    // Clear all caches before each test
    soundscapesCache.clear()
    storageCache.clear()
    categoriesCache.clear()
    QueryMonitor.clear()
    HealthCheckService.resetMetrics()
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Cache System', () => {
    it('should create cache with configuration', () => {
      const cache = new MemoryCache({
        ttl: 5000,
        maxSize: 100,
        enabled: true
      })

      expect(cache).toBeInstanceOf(MemoryCache)
    })

    it('should set and get cached data', () => {
      const cache = new MemoryCache({
        ttl: 5000,
        maxSize: 100,
        enabled: true
      })

      const testData = { test: 'data' }
      cache.set('test-key', testData, 5000)
      
      const retrieved = cache.get('test-key')
      expect(retrieved).toEqual(testData)
    })

    it('should expire cached data after TTL', async () => {
      const cache = new MemoryCache({
        ttl: 100, // 100ms
        maxSize: 100,
        enabled: true
      })

      cache.set('test-key', { test: 'data' }, 100)
      expect(cache.get('test-key')).toBeTruthy()
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(cache.get('test-key')).toBeNull()
    })

    it('should provide cache statistics', () => {
      const cache = new MemoryCache({
        ttl: 5000,
        maxSize: 100,
        enabled: true
      })

      cache.set('key1', 'data1', 5000)
      cache.set('key2', 'data2', 5000)
      cache.get('key1') // Hit
      cache.get('key3') // Miss

      const stats = cache.getStats()
      expect(stats.size).toBe(2)
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
    })

    it('should handle cache clear', () => {
      const cache = new MemoryCache({
        ttl: 5000,
        maxSize: 100,
        enabled: true
      })

      cache.set('soundscapes:list:page=1', 'data1', 5000)
      cache.set('soundscapes:list:page=2', 'data2', 5000)
      cache.set('categories:list', 'data3', 5000)

      expect(cache.get('soundscapes:list:page=1')).toBeTruthy()
      expect(cache.get('categories:list')).toBeTruthy()

      cache.clear()
      
      expect(cache.get('soundscapes:list:page=1')).toBeNull()
      expect(cache.get('categories:list')).toBeNull()
    })
  })

  describe('Pagination System', () => {
    it('should extract pagination parameters from request', () => {
      const request = createMockRequest('https://example.com/api/soundscapes?page=2&limit=20')
      const params = extractPaginationParams(request)

      expect(params.page).toBe(2)
      expect(params.limit).toBe(20)
      expect(params.offset).toBe(20) // (page - 1) * limit
    })

    it('should use default pagination values', () => {
      const request = createMockRequest('https://example.com/api/soundscapes')
      const params = extractPaginationParams(request)

      expect(params.limit).toBe(PaginationConfigs.soundscapes.defaultLimit)
      expect(params.offset).toBe(0)
    })

    it('should enforce maximum limit', () => {
      const request = createMockRequest('https://example.com/api/soundscapes?limit=500')
      const params = extractPaginationParams(request)

      expect(params.limit).toBe(PaginationConfigs.soundscapes.maxLimit)
    })

    it('should create paginated response', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
      
      const response = createPaginatedResponse(data, 10, {
        page: 1,
        limit: 5,
        offset: 0
      })

      expect(response.data).toEqual(data)
      expect(response.meta.total).toBe(10)
      expect(response.meta.page).toBe(1)
      expect(response.meta.pages).toBe(2)
      expect(response.meta.hasNext).toBe(true)
      expect(response.meta.hasPrev).toBe(false)
    })

    it('should apply pagination to query builder', () => {
      const mockQuery = {
        order: jest.fn(() => mockQuery),
        range: jest.fn(() => mockQuery)
      }

      const params = { page: 2, limit: 10, offset: 10 }
      applyPagination(mockQuery, params, 'created_at', 'desc')

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19)
    })
  })

  describe('Query Optimization', () => {
    it('should record query performance', () => {
      QueryMonitor.record('SELECT * FROM soundscapes', 150, 10, false)
      
      const stats = QueryMonitor.getStats()
      expect(stats.total).toBe(1)
      expect(stats.avgDuration).toBe(150)
    })

    it('should identify slow queries', () => {
      QueryMonitor.record('SLOW SELECT * FROM soundscapes', 250, 100, false)
      QueryMonitor.record('FAST SELECT id FROM soundscapes', 50, 10, false)
      
      const stats = QueryMonitor.getStats()
      expect(stats.slowQueries).toHaveLength(1)
      expect(stats.slowQueries[0].duration).toBe(250)
    })

    it('should execute optimized queries', async () => {
      const mockQueryBuilder = Promise.resolve({
        data: [{ id: 1, name: 'Test' }],
        error: null
      })
      
      const result = await executeOptimizedQuery(mockQueryBuilder)
      
      expect(result.data).toBeTruthy()
      expect(result.performance).toBeTruthy()
      expect(result.performance.query).toBeTruthy()
      expect(result.performance.duration).toBeGreaterThanOrEqual(0)
    })

    it('should handle query errors', async () => {
      const mockQueryBuilder = {
        then: () => Promise.reject(new Error('Database error'))
      }
      
      const result = await executeOptimizedQuery(mockQueryBuilder)
      
      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })
  })

  describe('Health Monitoring', () => {
    it('should check system health', async () => {
      const health = await HealthCheckService.getSystemHealth()
      
      expect(health.status).toBeDefined()
      expect(health.timestamp).toBeTruthy()
      expect(health.uptime).toBeGreaterThanOrEqual(0)
      expect(health.components).toBeInstanceOf(Array)
      expect(health.performance).toBeTruthy()
    })

    it('should record request metrics', () => {
      HealthCheckService.recordRequest(100, false)
      HealthCheckService.recordRequest(200, true)
      
      const metrics = HealthCheckService.getPerformanceMetrics()
      
      expect(metrics.requests.total).toBe(2)
      expect(metrics.requests.success).toBe(1)
      expect(metrics.requests.errors).toBe(1)
    })

    it('should provide memory health check', async () => {
      const health = await HealthCheckService.getSystemHealth()
      const memoryComponent = health.components.find(c => c.name === 'memory')
      
      expect(memoryComponent).toBeTruthy()
      expect(memoryComponent?.status).toBeDefined()
      expect(memoryComponent?.details).toBeTruthy()
    })

    it('should handle health check API endpoint', async () => {
      const request = createMockRequest('https://example.com/api/health')
      const response = await healthCheck(request)
      
      expect([200, 503]).toContain(response.status)
      
      const responseData = await response.json()
      expect(responseData.status).toBeDefined()
      expect(responseData.timestamp).toBeTruthy()
    })

    it('should handle performance metrics API endpoint', async () => {
      const request = createMockRequest('https://example.com/api/metrics')
      const response = await performanceMetrics(request)
      
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.requests).toBeTruthy()
      expect(responseData.database).toBeTruthy()
      expect(responseData.cache).toBeTruthy()
      expect(responseData.memory).toBeTruthy()
    })
  })

  describe('Performance Features', () => {
    it('should track performance across operations', () => {
      // Simulate multiple operations
      HealthCheckService.recordRequest(100, false)
      HealthCheckService.recordRequest(150, false)
      HealthCheckService.recordRequest(200, true)
      
      const metrics = HealthCheckService.getPerformanceMetrics()
      expect(metrics.requests.total).toBe(3)
      expect(metrics.requests.success).toBe(2)
      expect(metrics.requests.errors).toBe(1)
      expect(metrics.requests.avgDuration).toBeGreaterThan(0)
    })

    it('should maintain cache across operations', () => {
      // Simulate cache usage
      soundscapesCache.set('test:key1', { data: 'value1' }, 5000)
      storageCache.set('test:key2', { data: 'value2' }, 5000)
      
      expect(soundscapesCache.get('test:key1')).toBeTruthy()
      expect(storageCache.get('test:key2')).toBeTruthy()
      
      // Clear specific cache
      soundscapesCache.clear()
      
      expect(soundscapesCache.get('test:key1')).toBeNull()
      expect(storageCache.get('test:key2')).toBeTruthy()
    })

    it('should provide comprehensive statistics', () => {
      // Record some queries
      QueryMonitor.record('SELECT * FROM table1', 120, 50, false)
      QueryMonitor.record('SELECT * FROM table2', 80, 25, true)
      
      // Record some requests
      HealthCheckService.recordRequest(90, false)
      HealthCheckService.recordRequest(110, false)
      
      const queryStats = QueryMonitor.getStats()
      const perfMetrics = HealthCheckService.getPerformanceMetrics()
      
      expect(queryStats.total).toBe(2)
      expect(queryStats.avgDuration).toBe(100)
      expect(queryStats.cacheHitRate).toBe(0.5)
      
      expect(perfMetrics.requests.total).toBe(2)
      expect(perfMetrics.requests.avgDuration).toBe(100)
    })
  })
})
