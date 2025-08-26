import { PluginEntity } from '../../domain/entities/plugin'
import { PluginContext, PluginExecutionResult } from '../../domain/types/plugin-types'
import { InternalPluginSandbox, DEFAULT_SANDBOX_LIMITS } from '../security/plugin-sandbox'
import { DistributedTracer, createTracedPluginContext } from '../observability/tracing'
import { PluginMetricsCollector } from '../observability/metrics'
import { StructuredLogger } from '../observability/logger'
import { ServiceRegistry } from '../communication/service-registry'
import { InterPluginMessageBus } from '../communication/message-bus'

/**
 * Plugin execution configuration
 */
export interface PluginExecutionConfig {
  readonly enableTracing: boolean
  readonly enableMetrics: boolean
  readonly enableLogging: boolean
  readonly sandboxLimits?: typeof DEFAULT_SANDBOX_LIMITS
  readonly timeout?: number
}

/**
 * Plugin execution environment
 */
export interface PluginExecutionEnvironment {
  readonly tracer: DistributedTracer
  readonly metrics: PluginMetricsCollector
  readonly logger: StructuredLogger
  readonly serviceRegistry: ServiceRegistry
  readonly messageBus: InterPluginMessageBus
}

/**
 * Execution result with full observability data
 */
export interface EnhancedExecutionResult<T = unknown> extends PluginExecutionResult<T> {
  readonly traceId?: string
  readonly executionId: string
  readonly environment: string
  readonly observability: {
    readonly metricsRecorded: boolean
    readonly traceRecorded: boolean
    readonly logsGenerated: number
  }
}

/**
 * Traced plugin executor with full observability
 */
export class TracedPluginExecutor {
  constructor(
    private readonly environment: PluginExecutionEnvironment,
    private readonly config: PluginExecutionConfig = {
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      timeout: 60000
    }
  ) {}

  /**
   * Execute plugin with full observability and sandboxing
   */
  async executePlugin<T = unknown>(
    plugin: PluginEntity,
    baseContext: Omit<PluginContext, 'services' | 'tracing'>,
    pluginCode?: string
  ): Promise<EnhancedExecutionResult<T>> {
    const executionId = this.generateExecutionId()
    const startTime = Date.now()
    
    // Create plugin-specific logger
    const pluginLogger = this.environment.logger.forPlugin(
      plugin.name,
      'execute'
    )

    let traceId: string | undefined
    let logsGenerated = 0

    return this.environment.tracer.tracePluginExecution(
      plugin.name,
      'execute',
      async () => {
        const currentSpan = this.environment.tracer.getCurrentSpan()
        traceId = currentSpan?.spanContext().traceId

        pluginLogger.info('Starting plugin execution', {
          pluginId: plugin.name,
          version: plugin.version,
          executionId,
          config: this.config
        })
        logsGenerated++

        try {
          // Create enhanced context with services and tracing
          const enhancedContext = this.createEnhancedContext(
            baseContext,
            plugin.name,
            currentSpan
          )

          // Create sandbox for execution
          const sandbox = new InternalPluginSandbox(
            plugin.name,
            this.config.sandboxLimits || DEFAULT_SANDBOX_LIMITS
          )

          // Execute with timeout
          const result = await this.executeWithTimeout(
            () => sandbox.executePlugin(
              pluginCode || this.getPluginCode(plugin),
              enhancedContext
            ),
            this.config.timeout || 60000
          )

          const duration = Date.now() - startTime

          // Record success metrics
          if (this.config.enableMetrics) {
            this.environment.metrics.recordPluginExecution(
              plugin.name,
              'execute',
              duration,
              result.metrics?.memoryUsed || 0,
              result.isSuccess()
            )
          }

          pluginLogger.info('Plugin execution completed successfully', {
            duration,
            memoryUsed: result.metrics?.memoryUsed,
            networkRequests: result.metrics?.networkRequests,
            executionId
          })
          logsGenerated++

          return this.createEnhancedResult(
            result,
            executionId,
            traceId,
            logsGenerated
          ) as EnhancedExecutionResult<T>

        } catch (error) {
          const duration = Date.now() - startTime
          
          // Record error metrics
          if (this.config.enableMetrics) {
            this.environment.metrics.recordPluginExecution(
              plugin.name,
              'execute',
              duration,
              process.memoryUsage().heapUsed,
              false,
              error instanceof Error ? error.name : 'UnknownError'
            )
          }

          pluginLogger.error('Plugin execution failed', error instanceof Error ? error : new Error(String(error)))
          logsGenerated++

          const failureResult = PluginExecutionResult.failure<T>(
            error instanceof Error ? error : new Error(String(error))
          )

          return this.createEnhancedResult(
            failureResult,
            executionId,
            traceId,
            logsGenerated
          ) as EnhancedExecutionResult<T>
        }
      }
    ) as Promise<EnhancedExecutionResult<T>>
  }

  /**
   * Execute plugin method call
   */
  async executePluginMethod<T = unknown>(
    pluginId: string,
    methodName: string,
    args: unknown[] = [],
    context?: Partial<PluginContext>
  ): Promise<EnhancedExecutionResult<T>> {
    const executionId = this.generateExecutionId()
    const pluginLogger = this.environment.logger.forPlugin(pluginId, methodName)

    return this.environment.tracer.traceServiceCall(
      pluginId,
      methodName,
      async () => {
        pluginLogger.info('Executing plugin method', {
          method: methodName,
          args: args.length,
          executionId
        })

        // This would integrate with the actual plugin method execution
        // For now, we'll return a placeholder
        const result = PluginExecutionResult.success({
          methodName,
          args,
          executedAt: new Date()
        } as T)

        return this.createEnhancedResult(result, executionId, undefined, 1)
      }
    )
  }

  /**
   * Get plugin performance metrics
   */
  getPluginMetrics(pluginId: string) {
    return this.environment.metrics.getPluginStats(pluginId)
  }

  /**
   * Create enhanced plugin context with all services
   */
  private createEnhancedContext(
    baseContext: Omit<PluginContext, 'services' | 'tracing'>,
    pluginId: string,
    span?: any
  ): PluginContext {
    const contextWithServices = {
      ...baseContext,
      pluginId,
      services: {
        discoverService: (serviceName: string) => 
          this.environment.serviceRegistry.discoverService(serviceName),
        callService: async <T>(serviceName: string, method: string, data?: unknown): Promise<T> => {
          return this.environment.tracer.traceServiceCall(
            serviceName,
            method,
            async () => {
              // This would implement the actual service call
              throw new Error('Service calls not yet implemented')
            }
          )
        }
      }
    }

    // Add tracing context if enabled and span is available
    if (this.config.enableTracing && span) {
      return createTracedPluginContext(contextWithServices, this.environment.tracer, span)
    }

    return contextWithServices
  }

  /**
   * Create enhanced execution result
   */
  private createEnhancedResult<T>(
    baseResult: PluginExecutionResult<T>,
    executionId: string,
    traceId: string | undefined,
    logsGenerated: number
  ): EnhancedExecutionResult<T> {
    return {
      ...baseResult,
      executionId,
      traceId,
      environment: process.env.NODE_ENV || 'development',
      observability: {
        metricsRecorded: this.config.enableMetrics,
        traceRecorded: this.config.enableTracing && !!traceId,
        logsGenerated
      },
      isSuccess: baseResult.isSuccess.bind(baseResult),
      isFailure: baseResult.isFailure.bind(baseResult)
    }
  }

  /**
   * Execute with timeout protection
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Plugin execution timed out after ${timeout}ms`)), timeout)
      )
    ])
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get plugin code (placeholder - would integrate with plugin storage)
   */
  private getPluginCode(plugin: PluginEntity): string {
    // This would typically load the plugin code from storage
    // For now, return a placeholder
    return `
      async function register(context) {
        console.log('Plugin ${plugin.name} executed with context:', context);
        return {
          success: true,
          message: 'Plugin executed successfully',
          timestamp: new Date().toISOString()
        };
      }
    `
  }
}

/**
 * Plugin executor factory
 */
export class PluginExecutorFactory {
  static create(
    environment: PluginExecutionEnvironment,
    config?: Partial<PluginExecutionConfig>
  ): TracedPluginExecutor {
    const defaultConfig: PluginExecutionConfig = {
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      sandboxLimits: DEFAULT_SANDBOX_LIMITS,
      timeout: 60000
    }

    return new TracedPluginExecutor(environment, { ...defaultConfig, ...config })
  }

  static createForDevelopment(environment: PluginExecutionEnvironment): TracedPluginExecutor {
    return PluginExecutorFactory.create(environment, {
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      timeout: 120000 // Longer timeout for development
    })
  }

  static createForProduction(environment: PluginExecutionEnvironment): TracedPluginExecutor {
    return PluginExecutorFactory.create(environment, {
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      timeout: 30000 // Shorter timeout for production
    })
  }
}
