import { ServiceEndpoint, EndpointDefinition, ServiceMetadata, RateLimit, JSONSchema } from '../../domain/types/plugin-types'
import { EventBus } from '../../domain/events/event-bus'
import { BaseDomainEvent } from '../../domain/events/domain-events'

/**
 * Service registration error
 */
export class ServiceRegistrationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
    this.name = 'ServiceRegistrationError'
  }
}

/**
 * Service unavailable error
 */
export class ServiceUnavailableError extends Error {
  constructor(serviceName: string) {
    super(`Service '${serviceName}' is currently unavailable`)
    this.name = 'ServiceUnavailableError'
  }
}

/**
 * Service registry events
 */
export class ServiceRegisteredEvent extends BaseDomainEvent {
  constructor(
    public readonly serviceName: string,
    public readonly pluginId: string
  ) {
    super(pluginId, 'ServiceRegistered')
  }
}

export class ServiceUnregisteredEvent extends BaseDomainEvent {
  constructor(
    public readonly serviceName: string,
    public readonly pluginId: string
  ) {
    super(pluginId, 'ServiceUnregistered')
  }
}

/**
 * Service registry for plugin discovery and communication
 */
export class ServiceRegistry {
  private services = new Map<string, ServiceEndpoint>()
  private subscribers = new Map<string, Set<string>>() // service -> plugin dependencies
  private healthCheckCache = new Map<string, { healthy: boolean; lastCheck: number }>()

  constructor(private readonly eventBus: EventBus) {}

  /**
   * Register a service endpoint
   */
  async registerService(endpoint: ServiceEndpoint): Promise<void> {
    // Validate endpoint definitions
    const validation = await this.validateEndpoint(endpoint)
    if (!validation.valid) {
      throw new ServiceRegistrationError(validation.error!)
    }

    this.services.set(endpoint.serviceName, endpoint)
    
    // Clear health check cache for this service
    this.healthCheckCache.delete(endpoint.serviceName)
    
    // Emit service registration event
    await this.eventBus.publish(
      new ServiceRegisteredEvent(endpoint.serviceName, endpoint.pluginId)
    )
  }

  /**
   * Unregister a service
   */
  async unregisterService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName)
    if (!service) {
      return
    }

    this.services.delete(serviceName)
    this.healthCheckCache.delete(serviceName)
    
    // Emit service unregistration event
    await this.eventBus.publish(
      new ServiceUnregisteredEvent(serviceName, service.pluginId)
    )
  }

  /**
   * Discover a service by name
   */
  async discoverService(serviceName: string): Promise<ServiceEndpoint | null> {
    const service = this.services.get(serviceName)
    
    if (!service) {
      return null
    }

    // Check service health before returning
    const isHealthy = await this.checkServiceHealth(service)
    if (!isHealthy) {
      throw new ServiceUnavailableError(serviceName)
    }

    return service
  }

  /**
   * Get all registered services
   */
  getAllServices(): ServiceEndpoint[] {
    return Array.from(this.services.values())
  }

  /**
   * Get services by plugin ID
   */
  getServicesByPlugin(pluginId: string): ServiceEndpoint[] {
    return Array.from(this.services.values())
      .filter(service => service.pluginId === pluginId)
  }

  /**
   * Subscribe to service availability notifications
   */
  async subscribeToService(
    subscriberPlugin: string,
    serviceName: string
  ): Promise<void> {
    const subscribers = this.subscribers.get(serviceName) || new Set()
    subscribers.add(subscriberPlugin)
    this.subscribers.set(serviceName, subscribers)

    // Notify service of new subscriber for quota management
    await this.notifyServiceSubscription(serviceName, subscriberPlugin)
  }

  /**
   * Unsubscribe from service notifications
   */
  async unsubscribeFromService(
    subscriberPlugin: string,
    serviceName: string
  ): Promise<void> {
    const subscribers = this.subscribers.get(serviceName)
    if (subscribers) {
      subscribers.delete(subscriberPlugin)
      if (subscribers.size === 0) {
        this.subscribers.delete(serviceName)
      }
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName)
    if (!service) {
      return false
    }

    return this.checkServiceHealth(service)
  }

  /**
   * Validate service endpoint definition
   */
  private async validateEndpoint(endpoint: ServiceEndpoint): Promise<{ valid: boolean; error?: string }> {
    // Check service name format
    if (!endpoint.serviceName || endpoint.serviceName.trim() === '') {
      return { valid: false, error: 'Service name cannot be empty' }
    }

    // Check for duplicate service names
    if (this.services.has(endpoint.serviceName)) {
      return { valid: false, error: `Service '${endpoint.serviceName}' already exists` }
    }

    // Validate version format (semantic versioning)
    if (!this.isValidSemVer(endpoint.version)) {
      return { valid: false, error: 'Invalid semantic version format' }
    }

    // Validate endpoints
    for (const endpointDef of endpoint.endpoints) {
      if (!this.isValidEndpoint(endpointDef)) {
        return { valid: false, error: `Invalid endpoint definition: ${endpointDef.path}` }
      }
    }

    return { valid: true }
  }

  /**
   * Check if service is healthy
   */
  private async checkServiceHealth(service: ServiceEndpoint): Promise<boolean> {
    const cacheKey = service.serviceName
    const cached = this.healthCheckCache.get(cacheKey)
    const now = Date.now()

    // Use cached result if less than 30 seconds old
    if (cached && (now - cached.lastCheck) < 30000) {
      return cached.healthy
    }

    try {
      const response = await fetch(`/plugins/${service.pluginId}${service.healthCheck}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      
      const healthy = response.ok
      this.healthCheckCache.set(cacheKey, { healthy, lastCheck: now })
      return healthy
    } catch (error) {
      console.warn(`Health check failed for service ${service.serviceName}:`, error)
      this.healthCheckCache.set(cacheKey, { healthy: false, lastCheck: now })
      return false
    }
  }

  /**
   * Notify service of new subscription
   */
  private async notifyServiceSubscription(
    serviceName: string,
    subscriberPlugin: string
  ): Promise<void> {
    // This could trigger quota adjustments or monitoring setup
    console.log(`Plugin ${subscriberPlugin} subscribed to service ${serviceName}`)
  }

  /**
   * Validate semantic version format
   */
  private isValidSemVer(version: string): boolean {
    const semVerRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/
    return semVerRegex.test(version)
  }

  /**
   * Validate endpoint definition
   */
  private isValidEndpoint(endpoint: EndpointDefinition): boolean {
    // Check required fields
    if (!endpoint.path || !endpoint.method) {
      return false
    }

    // Validate HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE']
    if (!validMethods.includes(endpoint.method)) {
      return false
    }

    // Validate path format
    if (!endpoint.path.startsWith('/')) {
      return false
    }

    return true
  }
}
