import { supabaseAdmin } from '../../../../../src/lib/supabase'

/**
 * Query performance monitoring
 */
export interface QueryPerformance {
  query: string
  duration: number
  rowCount?: number
  timestamp: number
  cacheHit?: boolean
}

/**
 * Query optimization strategies
 */
export interface QueryOptimization {
  useIndex?: string[]
  batchSize?: number
  selectFields?: string[]
  preloadRelations?: string[]
  cacheKey?: string
  ttl?: number
}

/**
 * Performance monitoring for database queries
 */
export class QueryMonitor {
  private static queries: QueryPerformance[] = []
  private static maxQueries = 1000

  /**
   * Record query performance
   */
  static record(query: string, duration: number, rowCount?: number, cacheHit?: boolean): void {
    const performance: QueryPerformance = {
      query,
      duration,
      rowCount,
      timestamp: Date.now(),
      cacheHit
    }

    this.queries.push(performance)

    // Keep only recent queries to prevent memory leak
    if (this.queries.length > this.maxQueries) {
      this.queries = this.queries.slice(-this.maxQueries)
    }
  }

  /**
   * Get query statistics
   */
  static getStats() {
    const recentQueries = this.queries.filter(q => Date.now() - q.timestamp < 300000) // Last 5 minutes
    
    if (recentQueries.length === 0) {
      return {
        total: 0,
        avgDuration: 0,
        maxDuration: 0,
        cacheHitRate: 0,
        slowQueries: []
      }
    }

    const durations = recentQueries.map(q => q.duration)
    const cacheHits = recentQueries.filter(q => q.cacheHit).length
    const slowQueries = recentQueries
      .filter(q => q.duration > 100) // Queries slower than 100ms
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    return {
      total: recentQueries.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      maxDuration: Math.max(...durations),
      cacheHitRate: recentQueries.length > 0 ? cacheHits / recentQueries.length : 0,
      slowQueries: slowQueries.map(q => ({
        query: q.query.substring(0, 100) + (q.query.length > 100 ? '...' : ''),
        duration: q.duration,
        timestamp: q.timestamp
      }))
    }
  }

  /**
   * Clear query history
   */
  static clear(): void {
    this.queries = []
  }
}

/**
 * Optimized query wrapper with performance monitoring
 */
export async function executeOptimizedQuery<T = any>(
  queryBuilder: any,
  optimization: QueryOptimization = {}
): Promise<{ data: T[] | null; error: any; count?: number; performance: QueryPerformance }> {
  const startTime = Date.now()
  let queryString = ''

  try {
    // Apply field selection optimization
    if (optimization.selectFields && optimization.selectFields.length > 0) {
      queryBuilder = queryBuilder.select(optimization.selectFields.join(','))
    }

    // Capture query string for monitoring (simplified)
    queryString = `${queryBuilder.constructor.name} query`

    // Execute query
    const result = await queryBuilder

    const duration = Date.now() - startTime
    const performance: QueryPerformance = {
      query: queryString,
      duration,
      rowCount: result.data?.length,
      timestamp: Date.now(),
      cacheHit: false
    }

    QueryMonitor.record(queryString, duration, result.data?.length, false)

    return {
      ...result,
      performance
    }

  } catch (error) {
    const duration = Date.now() - startTime
    const performance: QueryPerformance = {
      query: queryString,
      duration,
      timestamp: Date.now(),
      cacheHit: false
    }

    QueryMonitor.record(queryString, duration, 0, false)

    return {
      data: null,
      error,
      performance
    }
  }
}

/**
 * Batch operations for improved performance
 */
export class BatchOperations {
  /**
   * Batch insert with optimal batch size
   */
  static async batchInsert<T>(
    table: string,
    records: T[],
    batchSize: number = 100
  ): Promise<{ success: boolean; inserted: number; errors: any[] }> {
    const errors: any[] = []
    let inserted = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .insert(batch)

        if (error) {
          errors.push(error)
        } else {
          inserted += batch.length
        }
      } catch (error) {
        errors.push(error)
      }
    }

    return {
      success: errors.length === 0,
      inserted,
      errors
    }
  }

  /**
   * Batch update with optimal batch size
   */
  static async batchUpdate<T extends { id: string }>(
    table: string,
    records: T[],
    batchSize: number = 50
  ): Promise<{ success: boolean; updated: number; errors: any[] }> {
    const errors: any[] = []
    let updated = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      try {
        // Use upsert for batch updates
        const { error } = await supabaseAdmin
          .from(table)
          .upsert(batch, { onConflict: 'id' })

        if (error) {
          errors.push(error)
        } else {
          updated += batch.length
        }
      } catch (error) {
        errors.push(error)
      }
    }

    return {
      success: errors.length === 0,
      updated,
      errors
    }
  }

  /**
   * Batch delete with optimal batch size
   */
  static async batchDelete(
    table: string,
    ids: string[],
    batchSize: number = 100
  ): Promise<{ success: boolean; deleted: number; errors: any[] }> {
    const errors: any[] = []
    let deleted = 0

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .in('id', batch)

        if (error) {
          errors.push(error)
        } else {
          deleted += batch.length
        }
      } catch (error) {
        errors.push(error)
      }
    }

    return {
      success: errors.length === 0,
      deleted,
      errors
    }
  }
}

/**
 * Query optimization helpers
 */
export const QueryOptimizer = {
  /**
   * Optimize soundscape list queries
   */
  soundscapesList: {
    selectFields: [
      'id',
      'title', 
      'description',
      'category',
      'audio_url',
      'thumbnail_url',
      'is_published',
      'sort_order',
      'duration_seconds',
      'created_at',
      'updated_at'
    ],
    indexHints: ['category', 'is_published', 'sort_order'],
    cacheKey: 'soundscapes:list'
  },

  /**
   * Optimize soundscape detail queries
   */
  soundscapeDetail: {
    selectFields: [
      'id',
      'title',
      'description', 
      'category',
      'audio_url',
      'thumbnail_url',
      'is_published',
      'sort_order',
      'duration_seconds',
      'created_at',
      'updated_at'
    ],
    cacheKey: 'soundscape:detail'
  },

  /**
   * Optimize admin queries
   */
  adminList: {
    selectFields: [
      'id',
      'title',
      'category',
      'is_published',
      'sort_order',
      'created_at',
      'updated_at'
    ],
    indexHints: ['is_published', 'created_at'],
    cacheKey: 'admin:soundscapes'
  }
}

/**
 * Connection pool optimization for high-traffic scenarios
 */
export class ConnectionManager {
  private static connections = new Map<string, any>()
  private static maxConnections = 10
  private static connectionTimeout = 30000 // 30 seconds

  /**
   * Get optimized connection for specific operation type
   */
  static getConnection(type: 'read' | 'write' = 'read'): any {
    // In a real implementation, this would manage separate read/write connections
    // For now, we return the standard Supabase client
    return supabaseAdmin
  }

  /**
   * Health check for database connections
   */
  static async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now()
    
    try {
      const { error } = await supabaseAdmin
        .from('soundscapes')
        .select('id')
        .limit(1)

      const latency = Date.now() - startTime
      
      return {
        healthy: !error,
        latency
      }
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime
      }
    }
  }
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceMonitoring<T>(operationName: string) {
  return function(handler: (...args: any[]) => Promise<T>) {
    return async (...args: any[]): Promise<T> => {
      const startTime = Date.now()
      
      try {
        const result = await handler(...args)
        const duration = Date.now() - startTime
        
        QueryMonitor.record(operationName, duration, undefined, false)
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        QueryMonitor.record(`${operationName}:ERROR`, duration, undefined, false)
        throw error
      }
    }
  }
}

/**
 * Database index recommendations based on query patterns
 */
export const IndexRecommendations = {
  soundscapes: [
    'CREATE INDEX IF NOT EXISTS idx_soundscapes_category ON soundscapes(category)',
    'CREATE INDEX IF NOT EXISTS idx_soundscapes_published ON soundscapes(is_published)',
    'CREATE INDEX IF NOT EXISTS idx_soundscapes_sort_order ON soundscapes(sort_order)',
    'CREATE INDEX IF NOT EXISTS idx_soundscapes_created_at ON soundscapes(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_soundscapes_category_published ON soundscapes(category, is_published)',
    'CREATE INDEX IF NOT EXISTS idx_soundscapes_published_sort ON soundscapes(is_published, sort_order)',
  ],
  
  /**
   * Analyze query patterns and suggest new indexes
   */
  analyzeAndSuggest(): string[] {
    const stats = QueryMonitor.getStats()
    const suggestions: string[] = []
    
    // Analyze slow queries and suggest indexes
    stats.slowQueries.forEach(query => {
      if (query.query.includes('WHERE') && query.duration > 200) {
        suggestions.push(`Consider adding index for slow query: ${query.query}`)
      }
    })
    
    return suggestions
  }
}
