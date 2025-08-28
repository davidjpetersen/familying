/**
 * Performance optimization modules for the soundscapes plugin
 * 
 * This module provides:
 * - In-memory caching with LRU eviction
 * - Comprehensive pagination system
 * - Database query optimization and monitoring
 * - Health checks and performance monitoring
 * - Pre-optimized API handlers
 */

// Core performance modules
export * from './cache'
export * from './pagination'
export * from './query-optimization'
export * from './monitoring'

// Integration layer
export * from './integration'

// Re-export key types for convenience
export type { CacheConfig } from './cache'
export type { 
  PaginationParams, 
  PaginationMeta, 
  PaginatedResponse 
} from './pagination'
export type { 
  QueryPerformance, 
  QueryOptimization 
} from './query-optimization'
export type { 
  SystemHealth, 
  PerformanceMetrics, 
  HealthStatus,
  ComponentHealth 
} from './monitoring'

/**
 * Quick setup function for performance optimizations
 */
export function setupPerformanceOptimizations(config?: {
  caching?: {
    soundscapes?: { ttl: number; maxSize: number }
    storage?: { ttl: number; maxSize: number }
    categories?: { ttl: number; maxSize: number }
  }
  monitoring?: {
    enabled: boolean
    maxQueries: number
  }
}) {
  // Performance optimizations are automatically initialized when modules are imported
  console.log('Performance optimizations enabled:', {
    caching: !!config?.caching,
    monitoring: !!config?.monitoring,
    pagination: true,
    queryOptimization: true
  })
  
  return {
    caching: true,
    monitoring: true,
    pagination: true,
    queryOptimization: true
  }
}

/**
 * Performance optimization summary
 */
export const PERFORMANCE_FEATURES = {
  caching: {
    description: 'In-memory caching with configurable TTL and LRU eviction',
    modules: ['MemoryCache', 'withCache', 'Cache instances for soundscapes/storage/categories']
  },
  pagination: {
    description: 'Comprehensive pagination with offset-based and cursor-based approaches',
    modules: ['extractPaginationParams', 'createPaginatedResponse', 'applyPagination', 'SQL helpers']
  },
  queryOptimization: {
    description: 'Database query performance monitoring and optimization',
    modules: ['QueryMonitor', 'executeOptimizedQuery', 'BatchOperations', 'ConnectionManager']
  },
  monitoring: {
    description: 'Health checks and performance monitoring endpoints',
    modules: ['HealthCheckService', 'withPerformanceTracking', 'Health/metrics APIs']
  },
  integration: {
    description: 'Pre-optimized API handlers combining all performance features',
    modules: ['optimizedHandlers', 'Enhanced CRUD operations', 'Cache integration']
  }
} as const

export default {
  setupPerformanceOptimizations,
  PERFORMANCE_FEATURES
}
