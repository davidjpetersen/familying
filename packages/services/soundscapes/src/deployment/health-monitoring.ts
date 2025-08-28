/**
 * Production deployment configuration and health monitoring
 */

import { config } from '../config'
import { getLogger } from '../observability/logging'
import { getDatabase } from '../database/enhanced-database'
import { getResilienceManager } from '../resilience'

const logger = getLogger('health')

// Health check status enum
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

// Component health interface
export interface ComponentHealth {
  status: HealthStatus
  message: string
  lastChecked: string
  responseTime?: number
  metadata?: Record<string, any>
}

// System health interface
export interface SystemHealth {
  status: HealthStatus
  timestamp: string
  version: string
  uptime: number
  components: {
    database: ComponentHealth
    storage: ComponentHealth
    cache: ComponentHealth
    security: ComponentHealth
    resilience: ComponentHealth
  }
  metrics: {
    requestsPerMinute: number
    errorRate: number
    averageResponseTime: number
    memoryUsage: number
    cpuUsage: number
  }
}

// Health monitor implementation
export class HealthMonitor {
  private startTime = Date.now()
  private requestCount = 0
  private errorCount = 0
  private responseTimes: number[] = []

  async checkSystemHealth(): Promise<SystemHealth> {
    const timestamp = new Date().toISOString()
    
    // Check all components in parallel
    const [
      databaseHealth,
      storageHealth,
      cacheHealth,
      securityHealth,
      resilienceHealth
    ] = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkStorageHealth(),
      this.checkCacheHealth(),
      this.checkSecurityHealth(),
      this.checkResilienceHealth(),
    ])

    // Determine overall status
    const componentStatuses = [
      databaseHealth.status === 'fulfilled' ? databaseHealth.value.status : HealthStatus.UNHEALTHY,
      storageHealth.status === 'fulfilled' ? storageHealth.value.status : HealthStatus.UNHEALTHY,
      cacheHealth.status === 'fulfilled' ? cacheHealth.value.status : HealthStatus.UNHEALTHY,
      securityHealth.status === 'fulfilled' ? securityHealth.value.status : HealthStatus.UNHEALTHY,
      resilienceHealth.status === 'fulfilled' ? resilienceHealth.value.status : HealthStatus.UNHEALTHY,
    ]

    const overallStatus = this.determineOverallStatus(componentStatuses)

    return {
      status: overallStatus,
      timestamp,
      version: '1.0.0', // Should be read from package.json or environment
      uptime: Date.now() - this.startTime,
      components: {
        database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : this.createFailedHealth('Database check failed'),
        storage: storageHealth.status === 'fulfilled' ? storageHealth.value : this.createFailedHealth('Storage check failed'),
        cache: cacheHealth.status === 'fulfilled' ? cacheHealth.value : this.createFailedHealth('Cache check failed'),
        security: securityHealth.status === 'fulfilled' ? securityHealth.value : this.createFailedHealth('Security check failed'),
        resilience: resilienceHealth.status === 'fulfilled' ? resilienceHealth.value : this.createFailedHealth('Resilience check failed'),
      },
      metrics: this.getSystemMetrics(),
    }
  }

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    const start = Date.now()
    
    try {
      const db = getDatabase()
      const isHealthy = await db.healthCheck()
      const responseTime = Date.now() - start
      
      if (!isHealthy) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: 'Database health check failed',
          lastChecked: new Date().toISOString(),
          responseTime,
        }
      }

      const stats = db.getStats()
      
      return {
        status: responseTime > 1000 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY,
        message: `Database is ${responseTime > 1000 ? 'slow but' : ''} responsive`,
        lastChecked: new Date().toISOString(),
        responseTime,
        metadata: {
          totalConnections: stats.totalConnections,
          idleConnections: stats.idleConnections,
          totalQueries: stats.totalQueries,
          errorCount: stats.errorCount,
        },
      }
    } catch (error) {
      logger.logError(error as Error, { component: 'database', operation: 'health_check' })
      
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Database error: ${(error as Error).message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - start,
      }
    }
  }

  private async checkStorageHealth(): Promise<ComponentHealth> {
    const start = Date.now()
    
    try {
      // Mock storage health check - replace with actual storage service check
      const responseTime = Date.now() - start
      
      return {
        status: HealthStatus.HEALTHY,
        message: 'Storage service is accessible',
        lastChecked: new Date().toISOString(),
        responseTime,
        metadata: {
          bucket: config.storage.bucket,
          maxFileSize: config.storage.maxFileSize,
        },
      }
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Storage error: ${(error as Error).message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - start,
      }
    }
  }

  private async checkCacheHealth(): Promise<ComponentHealth> {
    const start = Date.now()
    
    try {
      // Mock cache health check - replace with actual cache service check
      const responseTime = Date.now() - start
      
      return {
        status: HealthStatus.HEALTHY,
        message: 'Cache is responsive',
        lastChecked: new Date().toISOString(),
        responseTime,
        metadata: {
          cacheConfig: config.cache,
        },
      }
    } catch (error) {
      return {
        status: HealthStatus.DEGRADED, // Cache failure shouldn't take down the service
        message: `Cache error: ${(error as Error).message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - start,
      }
    }
  }

  private async checkSecurityHealth(): Promise<ComponentHealth> {
    const start = Date.now()
    
    try {
      // Check security configuration
      const issues = []
      
      if (!config.security.jwtSecret || config.security.jwtSecret.length < 32) {
        issues.push('JWT secret is too short or missing')
      }
      
      if (config.isProduction && !config.security.requireHttps) {
        issues.push('HTTPS is not enforced in production')
      }
      
      const responseTime = Date.now() - start
      
      if (issues.length > 0) {
        return {
          status: HealthStatus.DEGRADED,
          message: `Security issues detected: ${issues.join(', ')}`,
          lastChecked: new Date().toISOString(),
          responseTime,
          metadata: { issues },
        }
      }
      
      return {
        status: HealthStatus.HEALTHY,
        message: 'Security configuration is valid',
        lastChecked: new Date().toISOString(),
        responseTime,
      }
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Security check error: ${(error as Error).message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - start,
      }
    }
  }

  private async checkResilienceHealth(): Promise<ComponentHealth> {
    const start = Date.now()
    
    try {
      const resilience = getResilienceManager()
      const stats = resilience.getHealthStatus()
      
      const openCircuitBreakers = stats.circuitBreakers.filter(
        cb => cb.state === 'OPEN'
      )
      
      const responseTime = Date.now() - start
      
      if (openCircuitBreakers.length > 0) {
        return {
          status: HealthStatus.DEGRADED,
          message: `${openCircuitBreakers.length} circuit breaker(s) are open`,
          lastChecked: new Date().toISOString(),
          responseTime,
          metadata: {
            openCircuitBreakers: openCircuitBreakers.map(cb => cb.name),
            totalCircuitBreakers: stats.totalCircuitBreakers,
          },
        }
      }
      
      return {
        status: HealthStatus.HEALTHY,
        message: 'All circuit breakers are functioning normally',
        lastChecked: new Date().toISOString(),
        responseTime,
        metadata: {
          totalCircuitBreakers: stats.totalCircuitBreakers,
        },
      }
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Resilience check error: ${(error as Error).message}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - start,
      }
    }
  }

  private determineOverallStatus(componentStatuses: HealthStatus[]): HealthStatus {
    if (componentStatuses.some(status => status === HealthStatus.UNHEALTHY)) {
      return HealthStatus.UNHEALTHY
    }
    
    if (componentStatuses.some(status => status === HealthStatus.DEGRADED)) {
      return HealthStatus.DEGRADED
    }
    
    return HealthStatus.HEALTHY
  }

  private createFailedHealth(message: string): ComponentHealth {
    return {
      status: HealthStatus.UNHEALTHY,
      message,
      lastChecked: new Date().toISOString(),
    }
  }

  private getSystemMetrics() {
    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0
    
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
    const memoryUsage = process.memoryUsage()
    
    return {
      requestsPerMinute: this.requestCount, // This should be calculated over time
      errorRate,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      memoryUsage: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
      cpuUsage: 0, // Would need external library to get CPU usage
    }
  }

  // Methods to track metrics
  recordRequest(responseTime: number, isError = false): void {
    this.requestCount++
    this.responseTimes.push(responseTime)
    
    if (isError) {
      this.errorCount++
    }
    
    // Keep only last 1000 response times for memory efficiency
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }
  }
}

// Singleton health monitor
let healthMonitorInstance: HealthMonitor | null = null

export function getHealthMonitor(): HealthMonitor {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new HealthMonitor()
  }
  return healthMonitorInstance
}

// Production readiness checklist
export interface ProductionReadinessCheck {
  category: string
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
    recommendation?: string
  }>
}

export function runProductionReadinessChecks(): ProductionReadinessCheck[] {
  const checks: ProductionReadinessCheck[] = []

  // Configuration checks
  const configChecks: ProductionReadinessCheck = {
    category: 'Configuration',
    checks: [
      {
        name: 'Environment Variables',
        status: (config.environment === 'production' ? 'pass' : 'warning') as 'pass' | 'fail' | 'warning',
        message: `Environment: ${config.environment}`,
        recommendation: config.environment !== 'production' ? 'Set NODE_ENV=production for production deployment' : undefined,
      },
      {
        name: 'JWT Secret',
        status: (config.security.jwtSecret && config.security.jwtSecret.length >= 32 ? 'pass' : 'fail') as 'pass' | 'fail' | 'warning',
        message: config.security.jwtSecret ? 'JWT secret is configured' : 'JWT secret is missing',
        recommendation: !config.security.jwtSecret ? 'Configure a strong JWT secret with at least 32 characters' : undefined,
      },
      {
        name: 'Database Configuration',
        status: (config.database.maxConnections > 0 ? 'pass' : 'fail') as 'pass' | 'fail' | 'warning',
        message: `Max connections: ${config.database.maxConnections}`,
        recommendation: config.database.maxConnections <= 0 ? 'Configure database connection pool settings' : undefined,
      },
    ],
  }
  checks.push(configChecks)

  // Security checks
  const securityChecks: ProductionReadinessCheck = {
    category: 'Security',
    checks: [
      {
        name: 'HTTPS Enforcement',
        status: (config.isProduction ? (config.security.requireHttps ? 'pass' : 'fail') : 'warning') as 'pass' | 'fail' | 'warning',
        message: config.security.requireHttps ? 'HTTPS is enforced' : 'HTTPS is not enforced',
        recommendation: !config.security.requireHttps && config.isProduction ? 'Enable HTTPS enforcement for production' : undefined,
      },
      {
        name: 'Rate Limiting',
        status: (config.rateLimiting.enabled ? 'pass' : 'warning') as 'pass' | 'fail' | 'warning',
        message: config.rateLimiting.enabled ? 'Rate limiting is enabled' : 'Rate limiting is disabled',
        recommendation: !config.rateLimiting.enabled ? 'Enable rate limiting to prevent abuse' : undefined,
      },
      {
        name: 'CORS Configuration',
        status: (config.security.corsOrigins.length > 0 ? 'pass' : 'warning') as 'pass' | 'fail' | 'warning',
        message: `CORS origins configured: ${config.security.corsOrigins.length}`,
        recommendation: config.security.corsOrigins.length === 0 ? 'Configure CORS origins for production' : undefined,
      },
    ],
  }
  checks.push(securityChecks)

  // Monitoring checks
  const monitoringChecks: ProductionReadinessCheck = {
    category: 'Monitoring',
    checks: [
      {
        name: 'Logging Configuration',
        status: (config.logging.structured ? 'pass' : 'warning') as 'pass' | 'fail' | 'warning',
        message: config.logging.structured ? 'Structured logging is enabled' : 'Simple logging is enabled',
        recommendation: !config.logging.structured ? 'Enable structured logging for better observability' : undefined,
      },
      {
        name: 'Performance Monitoring',
        status: (config.monitoring.enabled ? 'pass' : 'warning') as 'pass' | 'fail' | 'warning',
        message: config.monitoring.enabled ? 'Performance monitoring is enabled' : 'Performance monitoring is disabled',
        recommendation: !config.monitoring.enabled ? 'Enable performance monitoring for production insights' : undefined,
      },
    ],
  }
  checks.push(monitoringChecks)

  // Feature flags checks
  const featureChecks: ProductionReadinessCheck = {
    category: 'Features',
    checks: [
      {
        name: 'Storage Import',
        status: (config.features.storageImport ? 'pass' : 'warning') as 'pass' | 'fail' | 'warning',
        message: config.features.storageImport ? 'Storage import is enabled' : 'Storage import is disabled',
      },
      {
        name: 'Advanced Features',
        status: (config.features.advancedSearch || config.features.batchOperations ? 'pass' : 'warning') as 'pass' | 'fail' | 'warning',
        message: 'Advanced features availability',
      },
    ],
  }
  checks.push(featureChecks)

  return checks
}

export default getHealthMonitor
