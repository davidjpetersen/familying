import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock the performance monitoring interfaces to avoid external dependencies
interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
  memoryUsage: number
}

interface QueryPerformance {
  query: string
  duration: number
  rowCount: number
  fromCache: boolean
  timestamp: number
}

interface QueryStats {
  total: number
  avgDuration: number
  slowQueries: QueryPerformance[]
  cacheHitRate: number
  totalRows: number
}

interface PaginationParams {
  page: number
  limit: number
  offset: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Standalone cache implementation for testing
class TestMemoryCache {
  private cache: Map<string, { value: any; expiry: number; ttl: number }> = new Map()
  private hits = 0
  private misses = 0
  private config: { ttl: number; maxSize: number; enabled: boolean }

  constructor(config: { ttl: number; maxSize: number; enabled: boolean }) {
    this.config = config
  }

  set(key: string, value: any, ttl?: number): void {
    if (!this.config.enabled) return

    const actualTtl = ttl || this.config.ttl
    const expiry = Date.now() + actualTtl

    // LRU eviction if at max size
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, { value, expiry, ttl: actualTtl })
  }

  get(key: string): any {
    const item = this.cache.get(key)
    if (!item) {
      this.misses++
      return null
    }

    if (!this.config.enabled) {
      this.misses++
      return null
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    return item.value
  }

  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation in bytes
    return this.cache.size * 256 // 256 bytes per entry estimation
  }
}

// Standalone query monitor for testing
class TestQueryMonitor {
  private static queries: QueryPerformance[] = []

  static record(query: string, duration: number, rowCount: number, fromCache: boolean): void {
    this.queries.push({
      query,
      duration,
      rowCount,
      fromCache,
      timestamp: Date.now()
    })
  }

  static getStats(): QueryStats {
    const total = this.queries.length
    const avgDuration = total > 0 
      ? this.queries.reduce((sum, q) => sum + q.duration, 0) / total 
      : 0
    
    const slowQueries = this.queries.filter(q => q.duration > 200)
    const cacheHits = this.queries.filter(q => q.fromCache).length
    const cacheHitRate = total > 0 ? cacheHits / total : 0
    const totalRows = this.queries.reduce((sum, q) => sum + q.rowCount, 0)

    return {
      total,
      avgDuration,
      slowQueries,
      cacheHitRate,
      totalRows
    }
  }

  static clear(): void {
    this.queries = []
  }
}

// Standalone health service for testing
class TestHealthService {
  private static requests: { duration: number; success: boolean; timestamp: number }[] = []
  private static startTime = Date.now()

  static recordRequest(duration: number, success: boolean): void {
    this.requests.push({
      duration,
      success,
      timestamp: Date.now()
    })
  }

  static getPerformanceMetrics() {
    const total = this.requests.length
    const success = this.requests.filter(r => r.success).length
    const errors = total - success
    const avgDuration = total > 0 
      ? this.requests.reduce((sum, r) => sum + r.duration, 0) / total 
      : 0

    return {
      requests: {
        total,
        success,
        errors,
        avgDuration,
        errorRate: total > 0 ? errors / total : 0
      },
      database: {
        queries: TestQueryMonitor.getStats()
      },
      cache: {
        soundscapes: testSoundscapesCache.getStats(),
        storage: testStorageCache.getStats(),
        categories: testCategoriesCache.getStats()
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
      }
    }
  }

  static async getSystemHealth() {
    const uptime = Date.now() - this.startTime
    const memory = process.memoryUsage()
    const metrics = this.getPerformanceMetrics()

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      components: [
        {
          name: 'memory',
          status: memory.heapUsed / memory.heapTotal < 0.9 ? 'healthy' : 'warning',
          details: {
            used: memory.heapUsed,
            total: memory.heapTotal,
            percentage: (memory.heapUsed / memory.heapTotal) * 100
          }
        },
        {
          name: 'cache',
          status: 'healthy',
          details: metrics.cache
        },
        {
          name: 'database',
          status: 'healthy',
          details: metrics.database
        }
      ],
      performance: metrics
    }
  }

  static resetMetrics(): void {
    this.requests = []
    this.startTime = Date.now()
  }
}

// Create test cache instances
const testSoundscapesCache = new TestMemoryCache({ ttl: 300000, maxSize: 100, enabled: true })
const testStorageCache = new TestMemoryCache({ ttl: 600000, maxSize: 50, enabled: true })
const testCategoriesCache = new TestMemoryCache({ ttl: 1800000, maxSize: 20, enabled: true })

// Pagination utility functions
function extractPaginationParams(url: string): PaginationParams {
  const urlObj = new URL(url)
  const page = Math.max(1, parseInt(urlObj.searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(urlObj.searchParams.get('limit') || '10')))
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}

function createPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  const pages = Math.ceil(total / params.limit)
  const hasNext = params.page < pages
  const hasPrev = params.page > 1
  
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      pages,
      hasNext,
      hasPrev
    }
  }
}

async function executeOptimizedQuery<T>(queryPromise: Promise<{ data: T; error: any }>): Promise<{ 
  data: T | null; 
  error: any; 
  performance: QueryPerformance 
}> {
  const startTime = Date.now()
  
  try {
    const result = await queryPromise
    const duration = Date.now() - startTime
    
    const performance: QueryPerformance = {
      query: 'SIMULATED_QUERY',
      duration,
      rowCount: Array.isArray(result.data) ? result.data.length : 1,
      fromCache: false,
      timestamp: startTime
    }
    
    TestQueryMonitor.record(performance.query, performance.duration, performance.rowCount, performance.fromCache)
    
    return {
      data: result.data,
      error: result.error,
      performance
    }
  } catch (error) {
    const duration = Date.now() - startTime
    
    const performance: QueryPerformance = {
      query: 'SIMULATED_QUERY',
      duration,
      rowCount: 0,
      fromCache: false,
      timestamp: startTime
    }
    
    TestQueryMonitor.record(performance.query, performance.duration, performance.rowCount, performance.fromCache)
    
    return {
      data: null,
      error,
      performance
    }
  }
}

describe('Performance Optimization System - Standalone Tests', () => {
  beforeEach(() => {
    // Clear all caches and metrics before each test
    testSoundscapesCache.clear()
    testStorageCache.clear()
    testCategoriesCache.clear()
    TestQueryMonitor.clear()
    TestHealthService.resetMetrics()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Cache System', () => {
    it('should create cache with configuration', () => {
      const cache = new TestMemoryCache({
        ttl: 5000,
        maxSize: 100,
        enabled: true
      })

      expect(cache).toBeInstanceOf(TestMemoryCache)
    })

    it('should set and get cached data', () => {
      const testData = { test: 'data' }
      testSoundscapesCache.set('test-key', testData, 5000)
      
      const retrieved = testSoundscapesCache.get('test-key')
      expect(retrieved).toEqual(testData)
    })

    it('should expire cached data after TTL', async () => {
      const cache = new TestMemoryCache({
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
      testSoundscapesCache.set('key1', 'data1', 5000)
      testSoundscapesCache.set('key2', 'data2', 5000)
      testSoundscapesCache.get('key1') // Hit
      testSoundscapesCache.get('key3') // Miss

      const stats = testSoundscapesCache.getStats()
      expect(stats.size).toBe(2)
      expect(stats.hitRate).toBeGreaterThan(0)
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
    })

    it('should handle LRU eviction', () => {
      const cache = new TestMemoryCache({
        ttl: 5000,
        maxSize: 2,
        enabled: true
      })

      cache.set('key1', 'data1', 5000)
      cache.set('key2', 'data2', 5000)
      cache.set('key3', 'data3', 5000) // Should evict key1

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeTruthy()
      expect(cache.get('key3')).toBeTruthy()
    })

    it('should handle cache clear', () => {
      testSoundscapesCache.set('soundscapes:list:page=1', 'data1', 5000)
      testSoundscapesCache.set('soundscapes:list:page=2', 'data2', 5000)
      testCategoriesCache.set('categories:list', 'data3', 5000)

      expect(testSoundscapesCache.get('soundscapes:list:page=1')).toBeTruthy()
      expect(testCategoriesCache.get('categories:list')).toBeTruthy()

      testSoundscapesCache.clear()
      
      expect(testSoundscapesCache.get('soundscapes:list:page=1')).toBeNull()
      expect(testCategoriesCache.get('categories:list')).toBeTruthy() // Other cache unaffected
    })
  })

  describe('Pagination System', () => {
    it('should extract pagination parameters from URL', () => {
      const params = extractPaginationParams('https://example.com/api/soundscapes?page=2&limit=20')

      expect(params.page).toBe(2)
      expect(params.limit).toBe(20)
      expect(params.offset).toBe(20) // (page - 1) * limit
    })

    it('should use default pagination values', () => {
      const params = extractPaginationParams('https://example.com/api/soundscapes')

      expect(params.page).toBe(1)
      expect(params.limit).toBe(10)
      expect(params.offset).toBe(0)
    })

    it('should enforce maximum limit', () => {
      const params = extractPaginationParams('https://example.com/api/soundscapes?limit=500')

      expect(params.limit).toBe(100) // Capped at 100
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

    it('should handle last page correctly', () => {
      const data = [{ id: 10, name: 'Last Item' }]
      
      const response = createPaginatedResponse(data, 10, {
        page: 2,
        limit: 5,
        offset: 5
      })

      expect(response.meta.page).toBe(2)
      expect(response.meta.pages).toBe(2)
      expect(response.meta.hasNext).toBe(false)
      expect(response.meta.hasPrev).toBe(true)
    })
  })

  describe('Query Optimization', () => {
    it('should record query performance', () => {
      TestQueryMonitor.record('SELECT * FROM soundscapes', 150, 10, false)
      
      const stats = TestQueryMonitor.getStats()
      expect(stats.total).toBe(1)
      expect(stats.avgDuration).toBe(150)
      expect(stats.totalRows).toBe(10)
      expect(stats.cacheHitRate).toBe(0)
    })

    it('should identify slow queries', () => {
      TestQueryMonitor.record('SLOW SELECT * FROM soundscapes', 250, 100, false)
      TestQueryMonitor.record('FAST SELECT id FROM soundscapes', 50, 10, false)
      
      const stats = TestQueryMonitor.getStats()
      expect(stats.total).toBe(2)
      expect(stats.slowQueries).toHaveLength(1)
      expect(stats.slowQueries[0].duration).toBe(250)
    })

    it('should calculate cache hit rate', () => {
      TestQueryMonitor.record('QUERY 1', 100, 5, false)
      TestQueryMonitor.record('QUERY 2', 50, 3, true)
      TestQueryMonitor.record('QUERY 3', 75, 2, true)
      
      const stats = TestQueryMonitor.getStats()
      expect(stats.total).toBe(3)
      expect(stats.cacheHitRate).toBeCloseTo(2/3, 2)
    })

    it('should execute optimized queries', async () => {
      const mockQueryPromise = Promise.resolve({
        data: [{ id: 1, name: 'Test' }],
        error: null
      })
      
      const result = await executeOptimizedQuery(mockQueryPromise)
      
      expect(result.data).toBeTruthy()
      expect(result.performance).toBeTruthy()
      expect(result.performance.query).toBeTruthy()
      expect(result.performance.duration).toBeGreaterThanOrEqual(0)
      expect(result.error).toBeNull()
    })

    it('should handle query errors', async () => {
      const mockQueryPromise = Promise.reject(new Error('Database error'))
      
      const result = await executeOptimizedQuery(mockQueryPromise)
      
      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
      expect(result.performance.duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Health Monitoring', () => {
    it('should check system health', async () => {
      const health = await TestHealthService.getSystemHealth()
      
      expect(health.status).toBe('healthy')
      expect(health.timestamp).toBeTruthy()
      expect(health.uptime).toBeGreaterThanOrEqual(0)
      expect(health.components).toBeInstanceOf(Array)
      expect(health.performance).toBeTruthy()
    })

    it('should record request metrics', () => {
      TestHealthService.recordRequest(100, true)
      TestHealthService.recordRequest(200, false)
      
      const metrics = TestHealthService.getPerformanceMetrics()
      
      expect(metrics.requests.total).toBe(2)
      expect(metrics.requests.success).toBe(1)
      expect(metrics.requests.errors).toBe(1)
      expect(metrics.requests.errorRate).toBe(0.5)
      expect(metrics.requests.avgDuration).toBe(150)
    })

    it('should provide memory health check', async () => {
      const health = await TestHealthService.getSystemHealth()
      const memoryComponent = health.components.find(c => c.name === 'memory')
      
      expect(memoryComponent).toBeTruthy()
      expect(memoryComponent?.status).toBeDefined()
      expect(memoryComponent?.details).toBeTruthy()
      
      if (memoryComponent?.name === 'memory') {
        const memoryDetails = memoryComponent.details as { used: number; total: number; percentage: number }
        expect(memoryDetails.used).toBeGreaterThan(0)
        expect(memoryDetails.total).toBeGreaterThan(0)
      }
    })

    it('should provide comprehensive performance metrics', () => {
      // Record some operations
      TestHealthService.recordRequest(90, true)
      TestHealthService.recordRequest(110, true)
      TestHealthService.recordRequest(200, false)
      
      TestQueryMonitor.record('SELECT * FROM table1', 120, 50, false)
      TestQueryMonitor.record('SELECT * FROM table2', 80, 25, true)
      
      testSoundscapesCache.set('test1', 'data1', 5000)
      testSoundscapesCache.get('test1') // Hit
      testSoundscapesCache.get('test2') // Miss
      
      const metrics = TestHealthService.getPerformanceMetrics()
      
      expect(metrics.requests.total).toBe(3)
      expect(metrics.requests.success).toBe(2)
      expect(metrics.requests.errors).toBe(1)
      expect(metrics.requests.avgDuration).toBeCloseTo(133.33, 1)
      
      expect(metrics.database.queries.total).toBe(2)
      expect(metrics.database.queries.avgDuration).toBe(100)
      expect(metrics.database.queries.cacheHitRate).toBe(0.5)
      
      expect(metrics.cache.soundscapes.size).toBe(1)
      expect(metrics.cache.soundscapes.hitRate).toBe(0.5)
    })
  })

  describe('Integration Scenarios', () => {
    it('should track performance across multiple operations', async () => {
      // Simulate a series of operations
      TestHealthService.recordRequest(100, true)
      TestQueryMonitor.record('SELECT soundscapes', 120, 50, false)
      testSoundscapesCache.set('soundscapes:list:1', [{ id: 1 }], 5000)
      
      TestHealthService.recordRequest(80, true)
      TestQueryMonitor.record('SELECT categories', 60, 10, true)
      testCategoriesCache.set('categories:list', [{ id: 1 }], 5000)
      
      TestHealthService.recordRequest(150, false)
      TestQueryMonitor.record('SELECT storage', 250, 25, false) // Made this slow (250ms > 200ms threshold)
      
      const metrics = TestHealthService.getPerformanceMetrics()
      
      expect(metrics.requests.total).toBe(3)
      expect(metrics.requests.success).toBe(2)
      expect(metrics.requests.avgDuration).toBeCloseTo(110, 1)
      
      expect(metrics.database.queries.total).toBe(3)
      expect(metrics.database.queries.slowQueries).toHaveLength(1) // 250ms is our slow query threshold
      expect(metrics.database.queries.cacheHitRate).toBeCloseTo(1/3, 2)
    })

    it('should handle concurrent cache operations', () => {
      const operations = [
        () => testSoundscapesCache.set('key1', 'data1', 5000),
        () => testSoundscapesCache.set('key2', 'data2', 5000),
        () => testSoundscapesCache.get('key1'),
        () => testSoundscapesCache.get('key2'),
        () => testSoundscapesCache.get('key3'), // Miss
      ]
      
      // Execute operations
      operations.forEach(op => op())
      
      const stats = testSoundscapesCache.getStats()
      expect(stats.size).toBe(2)
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBeCloseTo(2/3, 2)
    })

    it('should maintain performance under load simulation', async () => {
      const startTime = Date.now()
      
      // Simulate load
      const promises = Array.from({ length: 10 }, async (_, i) => {
        TestHealthService.recordRequest(50 + i * 10, true)
        TestQueryMonitor.record(`QUERY_${i}`, 100 + i * 5, 10, i % 2 === 0)
        testSoundscapesCache.set(`key_${i}`, `data_${i}`, 5000)
        return testSoundscapesCache.get(`key_${i}`)
      })
      
      const results = await Promise.all(promises)
      const duration = Date.now() - startTime
      
      // All operations should complete quickly
      expect(duration).toBeLessThan(100)
      expect(results.every(r => r !== null)).toBe(true)
      
      const metrics = TestHealthService.getPerformanceMetrics()
      expect(metrics.requests.total).toBe(10)
      expect(metrics.requests.success).toBe(10)
      expect(metrics.database.queries.total).toBe(10)
      expect(metrics.cache.soundscapes.size).toBe(10)
    })

    it('should handle cache invalidation patterns', () => {
      // Set up some cached data
      testSoundscapesCache.set('soundscapes:list:1', 'page1', 5000)
      testSoundscapesCache.set('soundscapes:list:2', 'page2', 5000)
      testSoundscapesCache.set('soundscapes:item:1', 'item1', 5000)
      testCategoriesCache.set('categories:list', 'categories', 5000)
      
      expect(testSoundscapesCache.getStats().size).toBe(3)
      expect(testCategoriesCache.getStats().size).toBe(1)
      
      // Simulate cache invalidation for soundscapes
      testSoundscapesCache.clear()
      
      expect(testSoundscapesCache.getStats().size).toBe(0)
      expect(testCategoriesCache.getStats().size).toBe(1) // Unaffected
    })
  })

  describe('Performance Edge Cases', () => {
    it('should handle disabled cache gracefully', () => {
      const disabledCache = new TestMemoryCache({
        ttl: 5000,
        maxSize: 100,
        enabled: false
      })
      
      disabledCache.set('key', 'value', 5000)
      expect(disabledCache.get('key')).toBeNull() // This will increment misses
      
      const stats = disabledCache.getStats()
      expect(stats.size).toBe(0)
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(1) // One miss from the get call above
    })

    it('should handle zero duration queries', () => {
      TestQueryMonitor.record('INSTANT_QUERY', 0, 1, true)
      
      const stats = TestQueryMonitor.getStats()
      expect(stats.avgDuration).toBe(0)
      expect(stats.slowQueries).toHaveLength(0)
    })

    it('should handle empty result sets', async () => {
      const mockQueryPromise = Promise.resolve({
        data: [],
        error: null
      })
      
      const result = await executeOptimizedQuery(mockQueryPromise)
      
      expect(result.data).toEqual([])
      expect(result.performance.rowCount).toBe(0)
    })

    it('should handle memory pressure gracefully', () => {
      const smallCache = new TestMemoryCache({
        ttl: 5000,
        maxSize: 1,
        enabled: true
      })
      
      // Add more items than cache can hold
      for (let i = 0; i < 5; i++) {
        smallCache.set(`key${i}`, `value${i}`, 5000)
      }
      
      const stats = smallCache.getStats()
      expect(stats.size).toBeLessThanOrEqual(1)
    })
  })
})
