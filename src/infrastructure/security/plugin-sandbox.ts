import { VM } from 'vm2'
import { PluginContext, PluginExecutionResult, ExecutionMetrics } from '../../domain/types/plugin-types'

/**
 * Sandbox limits for plugin execution
 */
export interface SandboxLimits {
  readonly executionTimeout: number      // 60 seconds for internal operations
  readonly memoryLimit: number          // 512MB - more generous for internal use
  readonly maxFileDescriptors: number   // 200 max
  readonly maxNetworkRequests: number   // 1000 per minute - generous for internal
}

/**
 * Module execution error
 */
export class ModuleExecutionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
    this.name = 'ModuleExecutionError'
  }
}

/**
 * Internal plugin sandbox using VM2 for modularization
 * Note: VM2 is deprecated but acceptable for internal module isolation
 * TODO: Consider upgrading to isolated-vm for production security
 */
export class InternalPluginSandbox {
  private vm: VM
  private resourceMonitor: ResourceMonitor

  constructor(
    private readonly pluginId: string,
    private readonly limits: SandboxLimits
  ) {
    this.vm = new VM({
      timeout: limits.executionTimeout,
      sandbox: this.createModuleSandbox()
    })
    
    this.resourceMonitor = new ResourceMonitor(limits)
  }

  /**
   * Execute plugin code in sandbox
   */
  async executePlugin(
    pluginCode: string, 
    context: PluginContext
  ): Promise<PluginExecutionResult> {
    const startTime = Date.now()
    
    try {
      this.resourceMonitor.start()
      
      const result = await this.vm.run(`
        const context = ${JSON.stringify(context)};
        (async function() {
          ${pluginCode}
          return await register(context);
        })()
      `)

      const metrics: ExecutionMetrics = {
        executionTime: Date.now() - startTime,
        memoryUsed: process.memoryUsage().heapUsed,
        networkRequests: this.resourceMonitor.getNetworkRequestCount()
      }

      return PluginExecutionResult.success(result, metrics)
      
    } catch (error) {
      const metrics: ExecutionMetrics = {
        executionTime: Date.now() - startTime,
        memoryUsed: process.memoryUsage().heapUsed,
        networkRequests: this.resourceMonitor.getNetworkRequestCount()
      }

      if (error instanceof Error && error.name === 'VMError') {
        return PluginExecutionResult.failure(
          new ModuleExecutionError(error.message, error),
          metrics
        )
      }
      
      return PluginExecutionResult.failure(
        error instanceof Error ? error : new Error(String(error)),
        metrics
      )
    } finally {
      this.resourceMonitor.stop()
    }
  }

  /**
   * Create sandbox environment for modules
   */
  private createModuleSandbox(): any {
    return {
      console: console, // Full console access for internal debugging
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      fetch: this.createControlledFetch(),
      Buffer: Buffer,
      
      // Block only the most dangerous globals
      process: {
        env: process.env, // Allow env access for config
        // But block process.exit, process.kill, etc.
      },
      global: undefined,
      __dirname: undefined,
      __filename: undefined
    }
  }

  /**
   * Get allowed npm modules for plugins
   */
  private getAllowedModules(): string[] {
    return [
      'lodash',
      'date-fns',
      'validator',
      'uuid',
      'axios',          // Allow HTTP client
      'jsonwebtoken',   // Allow JWT handling
      'bcrypt',         // Allow password hashing
      '@prisma/client', // Allow database access
      'zod',            // Allow validation
      // Add your commonly used internal modules
    ]
  }

  /**
   * Create controlled fetch function
   */
  private createControlledFetch(): (url: string, options?: any) => Promise<Response> {
    return async (url: string, options?: any) => {
      this.resourceMonitor.incrementNetworkRequests()
      
      // Light validation for internal services
      if (!this.isInternalUrl(url)) {
        console.warn(`External URL accessed by plugin ${this.pluginId}: ${url}`)
      }
      
      return fetch(url, {
        ...options,
        timeout: 30000, // Generous timeout for internal services
        headers: {
          ...options?.headers,
          'X-Plugin-Id': this.pluginId,
          'X-Service': 'familying-internal'
        }
      })
    }
  }

  /**
   * Check if URL is internal
   */
  private isInternalUrl(url: string): boolean {
    const internalPatterns = [
      /^https?:\/\/localhost/,
      /^https?:\/\/.*\.familying\.internal/,
      /^https?:\/\/.*\.local/,
      // Add your internal domain patterns
    ]
    
    return internalPatterns.some(pattern => pattern.test(url))
  }

  /**
   * Create mock modules for testing
   */
  private createMockModules(): Record<string, any> {
    return {
      // Mock sensitive modules if needed
    }
  }
}

/**
 * Resource monitor for tracking plugin resource usage
 */
export class ResourceMonitor {
  private startTime: number = 0
  private memoryCheckInterval: NodeJS.Timeout | null = null
  private networkRequestCount: number = 0

  constructor(private limits: SandboxLimits) {}

  start(): void {
    this.startTime = Date.now()
    this.networkRequestCount = 0
    this.startMemoryMonitoring()
  }

  stop(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval)
      this.memoryCheckInterval = null
    }
  }

  incrementNetworkRequests(): void {
    this.networkRequestCount++
    
    if (this.networkRequestCount > this.limits.maxNetworkRequests) {
      console.warn(`Plugin network request limit exceeded: ${this.networkRequestCount}`)
      // Log warning but don't kill - this is internal code
    }
  }

  getNetworkRequestCount(): number {
    return this.networkRequestCount
  }

  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      const usage = process.memoryUsage()
      
      if (usage.heapUsed > this.limits.memoryLimit) {
        console.warn(`Plugin memory limit exceeded: ${usage.heapUsed / 1024 / 1024}MB`)
        // Log warning but don't kill - this is internal code
      }
    }, 1000) // Check every second
  }
}

/**
 * Default sandbox limits for internal modules
 */
export const DEFAULT_SANDBOX_LIMITS: SandboxLimits = {
  executionTimeout: 60000,        // 60 seconds
  memoryLimit: 512 * 1024 * 1024, // 512MB
  maxFileDescriptors: 200,
  maxNetworkRequests: 1000
}
