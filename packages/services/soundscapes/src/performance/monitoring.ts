import { NextRequest, NextResponse } from 'next/server'
import { QueryMonitor, ConnectionManager } from './query-optimization'
import { soundscapesCache, storageCache, categoriesCache } from './cache'

/**
 * Health check status levels
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy'
}

/**
 * Individual component health
 */
export interface ComponentHealth {
  name: string
  status: HealthStatus
  latency?: number
  details?: Record<string, any>
  lastChecked: string
}

/**
 * Overall system health
 */
export interface SystemHealth {
  status: HealthStatus
  timestamp: string
  uptime: number
  components: ComponentHealth[]
  performance: {
    avgResponseTime: number
    cacheHitRate: number
    errorRate: number
  }
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  requests: {
    total: number
    success: number
    errors: number
    avgDuration: number
  }
  database: {
    avgQueryTime: number
    slowQueries: number
    connectionPool: {
      active: number
      idle: number
      total: number
    }
  }
  cache: {
    hitRate: number
    size: number
    evictions: number
  }
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
  }
}

/**
 * Health check service
 */
export class HealthCheckService {
  private static startTime = Date.now()
  private static requestCount = 0
  private static errorCount = 0
  private static responseTimes: number[] = []

  /**
   * Record request metrics
   */
  static recordRequest(duration: number, isError: boolean = false): void {
    this.requestCount++
    if (isError) this.errorCount++
    
    this.responseTimes.push(duration)
    
    // Keep only last 1000 response times to prevent memory leak
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }
  }

  /**
   * Check database health
   */
  private static async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now()
    
    try {
      const health = await ConnectionManager.healthCheck()
      const latency = Date.now() - startTime
      
      return {
        name: 'database',
        status: health.healthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        latency: health.latency,
        details: {
          connected: health.healthy,
          queryLatency: health.latency
        },
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        name: 'database',
        status: HealthStatus.UNHEALTHY,
        latency: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        lastChecked: new Date().toISOString()
      }
    }
  }

  /**
   * Check cache health
   */
  private static checkCache(): ComponentHealth {
    try {
      const soundscapesStats = soundscapesCache.getStats()
      const storageStats = storageCache.getStats()
      const categoriesStats = categoriesCache.getStats()
      
      const totalHits = soundscapesStats.hitRate + storageStats.hitRate + categoriesStats.hitRate
      const avgHitRate = totalHits / 3
      
      const status = avgHitRate > 0.5 ? HealthStatus.HEALTHY : 
                    avgHitRate > 0.2 ? HealthStatus.DEGRADED : HealthStatus.UNHEALTHY
      
      return {
        name: 'cache',
        status,
        details: {
          soundscapes: soundscapesStats,
          storage: storageStats,
          categories: categoriesStats,
          avgHitRate
        },
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        name: 'cache',
        status: HealthStatus.UNHEALTHY,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        lastChecked: new Date().toISOString()
      }
    }
  }

  /**
   * Check memory health
   */
  private static checkMemory(): ComponentHealth {
    try {
      const memUsage = process.memoryUsage()
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024
      const usagePercent = (heapUsedMB / heapTotalMB) * 100
      
      const status = usagePercent < 70 ? HealthStatus.HEALTHY :
                    usagePercent < 85 ? HealthStatus.DEGRADED : HealthStatus.UNHEALTHY
      
      return {
        name: 'memory',
        status,
        details: {
          heapUsed: Math.round(heapUsedMB),
          heapTotal: Math.round(heapTotalMB),
          external: Math.round(memUsage.external / 1024 / 1024),
          usagePercent: Math.round(usagePercent)
        },
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        name: 'memory',
        status: HealthStatus.UNHEALTHY,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        lastChecked: new Date().toISOString()
      }
    }
  }

  /**
   * Get comprehensive system health
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const components = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkMemory()
    ])
    
    // Determine overall system status
    const hasUnhealthy = components.some(c => c.status === HealthStatus.UNHEALTHY)
    const hasDegraded = components.some(c => c.status === HealthStatus.DEGRADED)
    
    const overallStatus = hasUnhealthy ? HealthStatus.UNHEALTHY :
                         hasDegraded ? HealthStatus.DEGRADED : HealthStatus.HEALTHY
    
    // Calculate performance metrics
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0
    
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0
    
    const cacheStats = soundscapesCache.getStats()
    const cacheHitRate = cacheStats.hitRate || 0
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      components,
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100
      }
    }
  }

  /**
   * Get detailed performance metrics
   */
  static getPerformanceMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage()
    const queryStats = QueryMonitor.getStats()
    const cacheStats = soundscapesCache.getStats()
    
    return {
      requests: {
        total: this.requestCount,
        success: this.requestCount - this.errorCount,
        errors: this.errorCount,
        avgDuration: this.responseTimes.length > 0 
          ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
          : 0
      },
      database: {
        avgQueryTime: queryStats.avgDuration,
        slowQueries: queryStats.slowQueries.length,
        connectionPool: {
          active: 1, // Simplified for current implementation
          idle: 0,
          total: 1
        }
      },
      cache: {
        hitRate: cacheStats.hitRate,
        size: cacheStats.size,
        evictions: 0 // Would track this in production
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      }
    }
  }

  /**
   * Reset metrics (useful for testing)
   */
  static resetMetrics(): void {
    this.requestCount = 0
    this.errorCount = 0
    this.responseTimes = []
    QueryMonitor.clear()
  }
}

/**
 * Health check API endpoint
 */
export async function healthCheck(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const health = await HealthCheckService.getSystemHealth()
    const duration = Date.now() - startTime
    
    HealthCheckService.recordRequest(duration, false)
    
    const statusCode = health.status === HealthStatus.HEALTHY ? 200 :
                      health.status === HealthStatus.DEGRADED ? 200 : 503
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': duration.toString()
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    HealthCheckService.recordRequest(duration, true)
    
    return NextResponse.json({
      status: HealthStatus.UNHEALTHY,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}

/**
 * Performance metrics API endpoint
 */
export async function performanceMetrics(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const metrics = HealthCheckService.getPerformanceMetrics()
    const duration = Date.now() - startTime
    
    HealthCheckService.recordRequest(duration, false)
    
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Metrics-Generation-Duration': duration.toString()
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    HealthCheckService.recordRequest(duration, true)
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Metrics generation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceTracking<T>(handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse<T>>) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    const startTime = Date.now()
    
    try {
      const response = await handler(request, ...args)
      const duration = Date.now() - startTime
      
      HealthCheckService.recordRequest(duration, response.status >= 400)
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Timestamp', new Date().toISOString())
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      HealthCheckService.recordRequest(duration, true)
      
      throw error
    }
  }
}
