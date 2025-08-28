import { NextResponse } from 'next/server'

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  ttl: number // Time to live in seconds
  maxSize: number // Maximum number of cached items
  enabled: boolean
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

/**
 * In-memory cache implementation with LRU eviction
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize: number
  private enabled: boolean

  constructor(config: CacheConfig) {
    this.maxSize = config.maxSize
    this.enabled = config.enabled
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    
    return `${prefix}:${sortedParams}`
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null

    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    // Update access metadata
    entry.accessCount++
    entry.lastAccessed = now
    
    return entry.data as T
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl: number): void {
    if (!this.enabled) return

    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now
    }

    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, entry)
  }

  /**
   * Remove specific entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values())
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      avgAccessCount: entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length || 0,
      oldestEntry: Math.min(...entries.map(entry => entry.timestamp)),
      newestEntry: Math.max(...entries.map(entry => entry.timestamp))
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Calculate cache hit rate (simplified - would need request tracking in production)
   */
  private calculateHitRate(): number {
    // This is a simplified implementation
    // In production, you'd track hits vs misses across requests
    const entries = Array.from(this.cache.values())
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    return totalAccess > 0 ? (totalAccess / this.cache.size) / 10 : 0 // Rough estimate
  }
}

/**
 * Default cache configurations for different data types
 */
export const CacheConfigs = {
  soundscapes: {
    list: { ttl: 300, maxSize: 50, enabled: true }, // 5 minutes
    detail: { ttl: 600, maxSize: 100, enabled: true }, // 10 minutes
    admin: { ttl: 60, maxSize: 20, enabled: true } // 1 minute (more dynamic)
  },
  storage: {
    files: { ttl: 900, maxSize: 30, enabled: true }, // 15 minutes
    metadata: { ttl: 1800, maxSize: 100, enabled: true } // 30 minutes
  },
  categories: {
    list: { ttl: 3600, maxSize: 10, enabled: true } // 1 hour (rarely changes)
  }
} as const

/**
 * Global cache instances
 */
export const soundscapesCache = new MemoryCache(CacheConfigs.soundscapes.list)
export const storageCache = new MemoryCache(CacheConfigs.storage.files)
export const categoriesCache = new MemoryCache(CacheConfigs.categories.list)

/**
 * Cache middleware wrapper for API responses
 */
export function withCache<T>(
  cache: MemoryCache,
  keyPrefix: string,
  ttl: number = 300
) {
  return function(
    handler: (...args: any[]) => Promise<NextResponse<T>>
  ) {
    return async (...args: any[]): Promise<NextResponse<T>> => {
      // Generate cache key from arguments
      const keyParams = args.reduce((acc, arg, index) => {
        if (arg && typeof arg === 'object' && arg.url) {
          // Extract query parameters from request
          const url = new URL(arg.url)
          const params = Object.fromEntries(url.searchParams.entries())
          return { ...acc, ...params, index }
        }
        return { ...acc, [`arg_${index}`]: arg }
      }, {})

      const cacheKey = cache.generateKey(keyPrefix, keyParams)
      
      // Try to get from cache first
      const cached = cache.get<T>(cacheKey)
      if (cached) {
        return NextResponse.json(cached, { 
          status: 200,
          headers: {
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey
          }
        })
      }

      // Execute handler and cache result
      try {
        const response = await handler(...args)
        
        if (response.status === 200) {
          const responseData = await response.json()
          cache.set(cacheKey, responseData, ttl)
          
          return NextResponse.json(responseData, {
            status: 200,
            headers: {
              'X-Cache': 'MISS',
              'X-Cache-Key': cacheKey
            }
          })
        }
        
        return response
      } catch (error) {
        // Don't cache errors
        throw error
      }
    }
  }
}

/**
 * Cache invalidation utilities
 */
export const CacheInvalidation = {
  /**
   * Invalidate soundscape-related caches when data changes
   */
  invalidateSoundscapes(id?: string): void {
    if (id) {
      // Invalidate specific soundscape caches
      soundscapesCache.delete(`soundscape:${id}`)
    }
    
    // Clear list caches as they may be affected
    const keys = Array.from(soundscapesCache['cache'].keys())
    keys.forEach(key => {
      if (key.startsWith('soundscapes:list') || key.startsWith('soundscapes:admin')) {
        soundscapesCache.delete(key)
      }
    })
  },

  /**
   * Invalidate storage-related caches
   */
  invalidateStorage(): void {
    storageCache.clear()
  },

  /**
   * Invalidate all caches
   */
  invalidateAll(): void {
    soundscapesCache.clear()
    storageCache.clear()
    categoriesCache.clear()
  }
}
