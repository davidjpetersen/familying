import { PluginEntity } from '../domain/entities/plugin'
import { PluginContext } from '../domain/types/plugin-types'
import { EventBus } from '../domain/events/event-bus'

// Infrastructure components
import { ServiceRegistry } from './communication/service-registry'
import { InterPluginMessageBus } from './communication/message-bus'
import { CircuitBreakerManager } from './communication/circuit-breaker'
import { DistributedTracer } from './observability/tracing'
import { PluginMetricsCollector } from './observability/metrics'
import { StructuredLogger, LoggerFactory } from './observability/logger'
import { TracedPluginExecutor, PluginExecutionEnvironment, EnhancedExecutionResult } from './observability/traced-plugin-executor'

/**
 * Plugin system configuration
 */
export interface PluginSystemConfig {
  readonly enableTracing: boolean
  readonly enableMetrics: boolean
  readonly enableLogging: boolean
  readonly enableSandboxing: boolean
  readonly environment: 'development' | 'staging' | 'production'
  readonly circuitBreaker: {
    readonly enabled: boolean
    readonly failureThreshold: number
    readonly timeout: number
  }
}

/**
 * Plugin registry interface for the system
 */
interface SystemPluginRegistry {
  getPlugin(pluginId: string): Promise<{ 
    id: string
    name: string
    permissions: {
      communication: {
        allowedTargets: string[]
        allowedMessageTypes: string[]
      }
    }
  } | null>
}

/**
 * Production-ready plugin system orchestrator
 */
export class PluginSystemOrchestrator {
  private readonly serviceRegistry: ServiceRegistry
  private readonly messageBus: InterPluginMessageBus
  private readonly circuitBreakerManager: CircuitBreakerManager
  private readonly tracer: DistributedTracer
  private readonly metrics: PluginMetricsCollector
  private readonly logger: StructuredLogger
  private readonly executor: TracedPluginExecutor
  private readonly systemRegistry: SystemPluginRegistry

  constructor(
    private readonly eventBus: EventBus,
    private readonly config: PluginSystemConfig = PluginSystemOrchestrator.getDefaultConfig()
  ) {
    // Initialize logger first
    this.logger = LoggerFactory.getInstance().createLogger({
      operation: 'plugin-system'
    })

    // Initialize observability components
    this.tracer = new DistributedTracer()
    this.metrics = new PluginMetricsCollector()

    // Initialize communication components
    this.serviceRegistry = new ServiceRegistry(eventBus)
    this.circuitBreakerManager = new CircuitBreakerManager({
      failureThreshold: config.circuitBreaker.failureThreshold,
      timeout: config.circuitBreaker.timeout
    })

    // Create a simple plugin registry implementation
    this.systemRegistry = this.createSystemRegistry()

    // Initialize message bus
    this.messageBus = new InterPluginMessageBus(this.systemRegistry, eventBus)

    // Create execution environment
    const environment: PluginExecutionEnvironment = {
      tracer: this.tracer,
      metrics: this.metrics,
      logger: this.logger,
      serviceRegistry: this.serviceRegistry,
      messageBus: this.messageBus
    }

    // Initialize executor
    this.executor = new TracedPluginExecutor(environment, {
      enableTracing: config.enableTracing,
      enableMetrics: config.enableMetrics,
      enableLogging: config.enableLogging
    })

    this.logger.info('Plugin system orchestrator initialized', {
      config,
      environment: config.environment
    })
  }

  /**
   * Execute a plugin with full production capabilities
   */
  async executePlugin<T = unknown>(
    plugin: PluginEntity,
    context: Omit<PluginContext, 'services' | 'tracing'>,
    pluginCode?: string
  ): Promise<EnhancedExecutionResult<T>> {
    this.logger.info('Executing plugin', {
      pluginId: plugin.name,
      version: plugin.version
    })

    try {
      return await this.executor.executePlugin<T>(plugin, context, pluginCode)
    } catch (error) {
      this.logger.error('Plugin execution failed at orchestrator level', 
        error instanceof Error ? error : new Error(String(error)), {
        pluginId: plugin.name
      })
      throw error
    }
  }

  /**
   * Register a service endpoint
   */
  async registerService(
    pluginId: string,
    serviceName: string,
    endpoints: any[]
  ): Promise<void> {
    const serviceEndpoint = {
      pluginId,
      serviceName,
      version: '1.0.0',
      endpoints,
      healthCheck: '/health',
      metadata: {
        description: `Service provided by plugin ${pluginId}`,
        tags: ['plugin-service'],
        owner: pluginId
      }
    }

    await this.serviceRegistry.registerService(serviceEndpoint)
    
    this.logger.info('Service registered', {
      pluginId,
      serviceName,
      endpointCount: endpoints.length
    })
  }

  /**
   * Send message between plugins
   */
  async sendMessage(
    fromPlugin: string,
    toPlugin: string,
    messageType: string,
    payload: any
  ): Promise<void> {
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromPlugin,
      to: toPlugin,
      type: messageType,
      payload,
      timestamp: Date.now()
    }

    const result = await this.messageBus.publish(message)
    
    if (!result.success) {
      this.logger.warn('Message delivery failed', {
        messageId: message.id,
        fromPlugin,
        toPlugin,
        error: result.error?.message
      })
    }
  }

  /**
   * Subscribe to messages
   */
  async subscribeToMessages(
    pluginId: string,
    messageType: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    const messageHandler = {
      handle: handler,
      canHandle: (type: string) => type === messageType,
      getHandlerInfo: () => ({
        handlerName: `${pluginId}-${messageType}-handler`,
        supportedMessageTypes: [messageType],
        maxProcessingTime: 5000
      })
    }

    await this.messageBus.subscribe(pluginId, messageType, messageHandler)
    
    this.logger.info('Plugin subscribed to messages', {
      pluginId,
      messageType
    })
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: { name: string; healthy: boolean }[]
    metrics: any
    circuitBreakers: any
  }> {
    const services = this.serviceRegistry.getAllServices()
    const serviceHealth = await Promise.all(
      services.map(async service => ({
        name: service.serviceName,
        healthy: await this.serviceRegistry.getServiceHealth(service.serviceName)
      }))
    )

    const metrics = await this.metrics.getMetricsSummary()
    const circuitBreakers = this.circuitBreakerManager.getAllMetrics()

    const unhealthyServices = serviceHealth.filter(s => !s.healthy).length
    const openCircuits = Array.from(circuitBreakers.values())
      .filter(cb => cb.state === 'OPEN').length

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (unhealthyServices > 0 || openCircuits > 0) {
      status = unhealthyServices > services.length / 2 ? 'unhealthy' : 'degraded'
    }

    return {
      status,
      services: serviceHealth,
      metrics,
      circuitBreakers: Object.fromEntries(circuitBreakers)
    }
  }

  /**
   * Get plugin metrics
   */
  getPluginMetrics(pluginId?: string): any {
    if (pluginId) {
      return this.metrics.getPluginStats(pluginId)
    }
    return this.metrics.getAllExecutionStats()
  }

  /**
   * Get dead letter queue entries
   */
  getDeadLetterQueue(): any[] {
    return this.messageBus.getDeadLetterQueue()
  }

  /**
   * Retry failed messages
   */
  async retryFailedMessages(maxRetries: number = 10): Promise<void> {
    await this.messageBus.retryDeadLetterMessages(maxRetries)
    this.logger.info('Retried failed messages', { maxRetries })
  }

  /**
   * Shutdown the plugin system gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down plugin system')

    try {
      // Flush any pending logs
      const loggerFactory = LoggerFactory.getInstance()
      const config = loggerFactory.getConfig()
      
      await Promise.all(
        config.outputs.map(async output => {
          if (output.flush) {
            await output.flush()
          }
          if (output.close) {
            await output.close()
          }
        })
      )

      this.logger.info('Plugin system shutdown complete')
    } catch (error) {
      console.error('Error during plugin system shutdown:', error)
    }
  }

  /**
   * Create default configuration
   */
  static getDefaultConfig(): PluginSystemConfig {
    return {
      enableTracing: true,
      enableMetrics: true,
      enableLogging: true,
      enableSandboxing: true,
      environment: (process.env.NODE_ENV as any) || 'development',
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 60000
      }
    }
  }

  /**
   * Create a production configuration
   */
  static getProductionConfig(): PluginSystemConfig {
    return {
      ...PluginSystemOrchestrator.getDefaultConfig(),
      environment: 'production',
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        timeout: 30000
      }
    }
  }

  /**
   * Create a development configuration
   */
  static getDevelopmentConfig(): PluginSystemConfig {
    return {
      ...PluginSystemOrchestrator.getDefaultConfig(),
      environment: 'development',
      circuitBreaker: {
        enabled: false,
        failureThreshold: 10,
        timeout: 120000
      }
    }
  }

  /**
   * Create simple system registry implementation
   */
  private createSystemRegistry(): SystemPluginRegistry {
    return {
      async getPlugin(pluginId: string) {
        // This would integrate with your actual plugin repository
        // For now, return a permissive default
        return {
          id: pluginId,
          name: pluginId,
          permissions: {
            communication: {
              allowedTargets: ['*'],
              allowedMessageTypes: ['*']
            }
          }
        }
      }
    }
  }
}

/**
 * Plugin system factory for different environments
 */
export class PluginSystemFactory {
  static create(
    eventBus: EventBus,
    config?: Partial<PluginSystemConfig>
  ): PluginSystemOrchestrator {
    const defaultConfig = PluginSystemOrchestrator.getDefaultConfig()
    return new PluginSystemOrchestrator(eventBus, { ...defaultConfig, ...config })
  }

  static createForProduction(eventBus: EventBus): PluginSystemOrchestrator {
    return new PluginSystemOrchestrator(eventBus, PluginSystemOrchestrator.getProductionConfig())
  }

  static createForDevelopment(eventBus: EventBus): PluginSystemOrchestrator {
    return new PluginSystemOrchestrator(eventBus, PluginSystemOrchestrator.getDevelopmentConfig())
  }
}
