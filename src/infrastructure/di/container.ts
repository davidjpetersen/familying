/**
 * Dependency injection container
 */
export interface ServiceFactory<T = any> {
  (): T
}

export class DependencyNotFoundError extends Error {
  constructor(token: string) {
    super(`Dependency not found: ${token}`)
    this.name = 'DependencyNotFoundError'
  }
}

export class CircularDependencyError extends Error {
  constructor(path: string[]) {
    super(`Circular dependency detected: ${path.join(' -> ')}`)
    this.name = 'CircularDependencyError'
  }
}

export class DIContainer {
  private services = new Map<string, any>()
  private factories = new Map<string, ServiceFactory>()
  private singletons = new Set<string>()
  private resolutionStack: string[] = []

  /**
   * Register a factory function for a service
   */
  register<T>(token: string, factory: ServiceFactory<T>, options?: { singleton?: boolean }): void {
    this.factories.set(token, factory)
    
    if (options?.singleton) {
      this.singletons.add(token)
    }
  }

  /**
   * Register a singleton instance
   */
  registerSingleton<T>(token: string, instance: T): void {
    this.services.set(token, instance)
    this.singletons.add(token)
  }

  /**
   * Resolve a service by token
   */
  resolve<T>(token: string): T {
    // Check for circular dependencies
    if (this.resolutionStack.includes(token)) {
      throw new CircularDependencyError([...this.resolutionStack, token])
    }

    // Return existing singleton instance
    if (this.services.has(token)) {
      return this.services.get(token)
    }

    // Get factory
    const factory = this.factories.get(token)
    if (!factory) {
      throw new DependencyNotFoundError(token)
    }

    // Add to resolution stack
    this.resolutionStack.push(token)

    try {
      const instance = factory()
      
      // Store if singleton
      if (this.singletons.has(token)) {
        this.services.set(token, instance)
      }

      return instance
    } finally {
      // Remove from resolution stack
      this.resolutionStack.pop()
    }
  }

  /**
   * Check if a service is registered
   */
  has(token: string): boolean {
    return this.services.has(token) || this.factories.has(token)
  }

  /**
   * Remove a service registration
   */
  unregister(token: string): void {
    this.services.delete(token)
    this.factories.delete(token)
    this.singletons.delete(token)
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear()
    this.factories.clear()
    this.singletons.clear()
    this.resolutionStack = []
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredTokens(): string[] {
    const tokens = new Set<string>()
    
    for (const token of this.services.keys()) {
      tokens.add(token)
    }
    
    for (const token of this.factories.keys()) {
      tokens.add(token)
    }
    
    return Array.from(tokens)
  }
}

/**
 * Service tokens for type safety
 */
export const ServiceTokens = {
  // Configuration
  CONFIG: 'config',
  
  // Logging
  LOGGER: 'logger',
  
  // Events
  EVENT_BUS: 'eventBus',
  
  // Repositories
  ADMIN_REPOSITORY: 'adminRepository',
  USER_REPOSITORY: 'userRepository',
  PLUGIN_REPOSITORY: 'pluginRepository',
  
  // Services
  ADMIN_SERVICE: 'adminService',
  PLUGIN_SERVICE: 'pluginService',
  USER_SERVICE: 'userService',
  
  // External Services
  CLERK_SERVICE: 'clerkService',
  SUPABASE_CLIENT: 'supabaseClient',
  SUPABASE_ADMIN_CLIENT: 'supabaseAdminClient',
  
  // Plugin System
  PLUGIN_MANAGER: 'pluginManager',
  PLUGIN_LOADER: 'pluginLoader',
  PLUGIN_VALIDATOR: 'pluginValidator',
  PLUGIN_EXECUTOR: 'pluginExecutor',
  
  // Mediator
  MEDIATOR: 'mediator'
} as const

export type ServiceToken = typeof ServiceTokens[keyof typeof ServiceTokens]
