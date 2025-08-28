/**
 * Resilience and error recovery patterns for production readiness
 * Implements circuit breaker, retry logic, and graceful degradation
 */

import { config } from '../config'
import { getLogger } from '../observability/logging'

const logger = getLogger('resilience')

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

// Retry policy configuration
export interface RetryPolicy {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringWindow: number
  minimumRequests: number
}

// Circuit breaker implementation
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0
  private totalRequests = 0

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`)
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`)
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.successCount++
    this.totalRequests++

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED
      this.failureCount = 0
      logger.info(`Circuit breaker ${this.name} transitioned to CLOSED`)
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.totalRequests++
    this.lastFailureTime = Date.now()

    if (this.totalRequests >= this.config.minimumRequests &&
        this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
      logger.warn(`Circuit breaker ${this.name} transitioned to OPEN`, {
        failureCount: this.failureCount,
        totalRequests: this.totalRequests,
      })
    }
  }

  getState(): CircuitState {
    return this.state
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

// Retry mechanism with exponential backoff
export class RetryManager {
  constructor(public readonly policy: RetryPolicy) {}

  async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error
    let attempt = 0

    while (attempt < this.policy.maxAttempts) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt)
          logger.debug(`Retrying operation after ${delay}ms`, {
            context,
            attempt: attempt + 1,
            maxAttempts: this.policy.maxAttempts,
          })
          await this.delay(delay)
        }

        const result = await operation()
        
        if (attempt > 0) {
          logger.info(`Operation succeeded after ${attempt + 1} attempts`, {
            context,
            totalAttempts: attempt + 1,
          })
        }

        return result
      } catch (error) {
        lastError = error as Error
        attempt++

        if (!this.isRetryable(lastError)) {
          logger.debug(`Error is not retryable: ${lastError.message}`, { context })
          throw lastError
        }

        if (attempt >= this.policy.maxAttempts) {
          logger.error(`All ${this.policy.maxAttempts} retry attempts failed`, {
            context,
            lastError: lastError.message,
          })
          throw lastError
        }

        logger.warn(`Operation failed, will retry`, {
          context,
          attempt: attempt,
          error: lastError.message,
          nextAttemptIn: this.calculateDelay(attempt),
        })
      }
    }

    throw lastError!
  }

  private calculateDelay(attempt: number): number {
    const delay = this.policy.baseDelay * Math.pow(this.policy.backoffMultiplier, attempt - 1)
    return Math.min(delay, this.policy.maxDelay)
  }

  private isRetryable(error: Error): boolean {
    return this.policy.retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || 
      error.name.includes(retryableError)
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Fallback manager for graceful degradation
export class FallbackManager {
  private fallbacks = new Map<string, () => Promise<any>>()

  register<T>(key: string, fallback: () => Promise<T>): void {
    this.fallbacks.set(key, fallback)
  }

  async executeWithFallback<T>(
    key: string,
    primary: () => Promise<T>,
    fallbackKey?: string
  ): Promise<T> {
    try {
      return await primary()
    } catch (error) {
      logger.warn(`Primary operation failed, attempting fallback`, {
        key,
        error: (error as Error).message,
        fallbackKey: fallbackKey || key,
      })

      const fallback = this.fallbacks.get(fallbackKey || key)
      if (!fallback) {
        throw new Error(`No fallback registered for key: ${fallbackKey || key}`)
      }

      try {
        const result = await fallback()
        logger.info(`Fallback operation succeeded`, { key: fallbackKey || key })
        return result
      } catch (fallbackError) {
        logger.error(`Fallback operation also failed`, {
          key: fallbackKey || key,
          primaryError: (error as Error).message,
          fallbackError: (fallbackError as Error).message,
        })
        throw fallbackError
      }
    }
  }
}

// Comprehensive resilience manager
export class ResilienceManager {
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private retryManager: RetryManager
  private fallbackManager = new FallbackManager()

  constructor() {
    this.retryManager = new RetryManager({
      maxAttempts: config.database.retryAttempts,
      baseDelay: config.database.retryDelay,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'timeout',
        'connection',
        'network',
        'temporary',
      ],
    })

    this.setupDefaultFallbacks()
  }

  getCircuitBreaker(name: string): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringWindow: 300000, // 5 minutes
        minimumRequests: 10,
      }))
    }
    return this.circuitBreakers.get(name)!
  }

  async executeResilient<T>(
    name: string,
    operation: () => Promise<T>,
    fallbackKey?: string
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(name)

    return this.fallbackManager.executeWithFallback(
      fallbackKey || name,
      () => circuitBreaker.execute(() => this.retryManager.execute(operation, name)),
      fallbackKey
    )
  }

  registerFallback<T>(key: string, fallback: () => Promise<T>): void {
    this.fallbackManager.register(key, fallback)
  }

  private setupDefaultFallbacks(): void {
    // Default fallback for soundscapes listing
    this.fallbackManager.register('soundscapes:list', async () => {
      logger.info('Using cached fallback for soundscapes list')
      return []
    })

    // Default fallback for individual soundscape
    this.fallbackManager.register('soundscapes:get', async () => {
      logger.info('Using default fallback for soundscape')
      return null
    })

    // Default fallback for storage operations
    this.fallbackManager.register('storage:list', async () => {
      logger.info('Using cached fallback for storage list')
      return []
    })

    // Default fallback for categories
    this.fallbackManager.register('categories:list', async () => {
      logger.info('Using static fallback for categories')
      return ['Sleep', 'Nature', 'White Noise', 'Focus']
    })
  }

  getHealthStatus() {
    const circuitBreakerStats = Array.from(this.circuitBreakers.entries()).map(
      ([name, cb]) => ({
        name,
        ...cb.getStats(),
      })
    )

    return {
      circuitBreakers: circuitBreakerStats,
      retryPolicy: this.retryManager.policy,
      totalCircuitBreakers: this.circuitBreakers.size,
    }
  }
}

// Singleton resilience manager
let resilienceInstance: ResilienceManager | null = null

export function getResilienceManager(): ResilienceManager {
  if (!resilienceInstance) {
    resilienceInstance = new ResilienceManager()
  }
  return resilienceInstance
}

// Helper decorators for adding resilience to methods
export function withResilience(name: string, fallbackKey?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const resilience = getResilienceManager()

    descriptor.value = async function (...args: any[]) {
      return resilience.executeResilient(
        `${target.constructor.name}:${propertyKey}`,
        () => originalMethod.apply(this, args),
        fallbackKey
      )
    }

    return descriptor
  }
}

export default getResilienceManager
