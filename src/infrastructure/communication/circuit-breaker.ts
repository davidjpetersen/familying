/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, blocking requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  readonly failureThreshold: number    // 5 failures triggers open
  readonly successThreshold: number    // 3 successes closes circuit
  readonly timeout: number            // 60 seconds before retry
  readonly monitoringPeriod: number   // Time window for failure counting
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  readonly state: CircuitState
  readonly failureCount: number
  readonly successCount: number
  readonly lastFailureTime?: number
  readonly totalRequests: number
  readonly totalFailures: number
}

/**
 * Circuit open error
 */
export class CircuitOpenError extends Error {
  constructor(serviceName: string) {
    super(`Circuit breaker is open for service: ${serviceName}`)
    this.name = 'CircuitOpenError'
  }
}

/**
 * Circuit breaker for service resilience
 */
export class CircuitBreaker {
  private state = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime?: number
  private successCount = 0
  private totalRequests = 0
  private totalFailures = 0
  private listeners: Array<(metrics: CircuitBreakerMetrics) => void> = []

  constructor(
    private readonly serviceName: string,
    private readonly config: CircuitBreakerConfig
  ) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
        this.notifyStateChange()
      } else {
        throw new CircuitOpenError(this.serviceName)
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

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures
    }
  }

  /**
   * Add state change listener
   */
  onStateChange(listener: (metrics: CircuitBreakerMetrics) => void): void {
    this.listeners.push(listener)
  }

  /**
   * Remove state change listener
   */
  removeStateChangeListener(listener: (metrics: CircuitBreakerMetrics) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Force circuit open (for testing/maintenance)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN
    this.notifyStateChange()
  }

  /**
   * Force circuit closed (for testing/maintenance)
   */
  forceClosed(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.notifyStateChange()
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED
        this.successCount = 0
        this.notifyStateChange()
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++
    this.totalFailures++
    this.lastFailureTime = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      // Go back to open on any failure in half-open state
      this.state = CircuitState.OPEN
      this.notifyStateChange()
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
      this.notifyStateChange()
    }
  }

  /**
   * Check if circuit should attempt to reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime
    return timeSinceLastFailure >= this.config.timeout
  }

  /**
   * Notify listeners of state change
   */
  private notifyStateChange(): void {
    const metrics = this.getMetrics()
    this.listeners.forEach(listener => {
      try {
        listener(metrics)
      } catch (error) {
        console.error('Circuit breaker listener error:', error)
      }
    })
  }
}

/**
 * Circuit breaker manager for multiple services
 */
export class CircuitBreakerManager {
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private defaultConfig: CircuitBreakerConfig

  constructor(defaultConfig?: Partial<CircuitBreakerConfig>) {
    this.defaultConfig = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000, // 60 seconds
      monitoringPeriod: 300000, // 5 minutes
      ...defaultConfig
    }
  }

  /**
   * Get or create circuit breaker for service
   */
  getCircuitBreaker(
    serviceName: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitConfig = { ...this.defaultConfig, ...config }
      const circuitBreaker = new CircuitBreaker(serviceName, circuitConfig)
      
      // Add logging for state changes
      circuitBreaker.onStateChange((metrics) => {
        console.log(`Circuit breaker for ${serviceName} changed to ${metrics.state}`, {
          failureCount: metrics.failureCount,
          totalRequests: metrics.totalRequests,
          totalFailures: metrics.totalFailures
        })
      })

      this.circuitBreakers.set(serviceName, circuitBreaker)
    }

    return this.circuitBreakers.get(serviceName)!
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Map<string, CircuitBreakerMetrics> {
    const metrics = new Map<string, CircuitBreakerMetrics>()
    
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      metrics.set(serviceName, circuitBreaker.getMetrics())
    }

    return metrics
  }

  /**
   * Get services by circuit state
   */
  getServicesByState(state: CircuitState): string[] {
    const services: string[] = []
    
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      if (circuitBreaker.getMetrics().state === state) {
        services.push(serviceName)
      }
    }

    return services
  }

  /**
   * Force all circuits to a specific state (for testing)
   */
  forceAllToState(state: CircuitState): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      if (state === CircuitState.OPEN) {
        circuitBreaker.forceOpen()
      } else if (state === CircuitState.CLOSED) {
        circuitBreaker.forceClosed()
      }
    }
  }
}

/**
 * Default circuit breaker configurations for different service types
 */
export const CIRCUIT_BREAKER_CONFIGS = {
  database: {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000, // 30 seconds
    monitoringPeriod: 60000 // 1 minute
  },
  externalApi: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60000, // 60 seconds
    monitoringPeriod: 300000 // 5 minutes
  },
  internalService: {
    failureThreshold: 10,
    successThreshold: 5,
    timeout: 120000, // 2 minutes
    monitoringPeriod: 600000 // 10 minutes
  }
} as const
