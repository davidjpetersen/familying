import { PluginEntity } from '../entities/plugin'

/**
 * Plugin execution context provided to sandboxed plugins
 */
export interface PluginContext {
  readonly pluginId: string
  readonly environment: 'development' | 'staging' | 'production'
  readonly config: Record<string, unknown>
  readonly services: ServiceRegistry
  readonly tracing?: TracingContext
  readonly user?: UserContext
}

/**
 * User context for plugin execution
 */
export interface UserContext {
  readonly id: string
  readonly email?: string
  readonly roles: string[]
  readonly permissions: string[]
}

/**
 * Service registry interface for plugins
 */
export interface ServiceRegistry {
  discoverService(serviceName: string): Promise<ServiceEndpoint | null>
  callService<T>(serviceName: string, method: string, data?: unknown): Promise<T>
}

/**
 * Service endpoint definition
 */
export interface ServiceEndpoint {
  readonly pluginId: string
  readonly serviceName: string
  readonly version: string
  readonly endpoints: EndpointDefinition[]
  readonly healthCheck: string
  readonly metadata: ServiceMetadata
}

/**
 * API endpoint definition
 */
export interface EndpointDefinition {
  readonly path: string
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  readonly inputSchema: JSONSchema
  readonly outputSchema: JSONSchema
  readonly rateLimit?: RateLimit
}

/**
 * Service metadata
 */
export interface ServiceMetadata {
  readonly description: string
  readonly tags: string[]
  readonly owner: string
  readonly documentation?: string
}

/**
 * Rate limiting configuration
 */
export interface RateLimit {
  readonly requestsPerMinute: number
  readonly burstSize?: number
}

/**
 * JSON Schema definition
 */
export interface JSONSchema {
  readonly type: string
  readonly properties?: Record<string, JSONSchema>
  readonly required?: string[]
  readonly items?: JSONSchema
  readonly format?: string
  readonly pattern?: string
  readonly minimum?: number
  readonly maximum?: number
  readonly [key: string]: unknown
}

/**
 * Tracing context for observability
 */
export interface TracingContext {
  readonly traceId: string
  readonly spanId: string
  readonly createChildSpan: (name: string, attributes?: Record<string, unknown>) => SpanContext
  readonly addEvent: (name: string, attributes?: Record<string, unknown>) => void
}

/**
 * Span context for tracing
 */
export interface SpanContext {
  readonly spanId: string
  readonly addEvent: (name: string, attributes?: Record<string, unknown>) => void
  readonly setAttributes: (attributes: Record<string, unknown>) => void
  readonly end: () => void
}

/**
 * Plugin execution result
 */
export class PluginExecutionResult<T = unknown> {
  private constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly error?: Error,
    public readonly metrics?: ExecutionMetrics
  ) {}

  static success<T>(data: T, metrics?: ExecutionMetrics): PluginExecutionResult<T> {
    return new PluginExecutionResult(true, data, undefined, metrics)
  }

  static failure<T = unknown>(error: Error, metrics?: ExecutionMetrics): PluginExecutionResult<T> {
    return new PluginExecutionResult<T>(false, undefined, error, metrics)
  }

  isSuccess(): this is PluginExecutionResult<T> & { data: T } {
    return this.success
  }

  isFailure(): this is PluginExecutionResult<T> & { error: Error } {
    return !this.success
  }
}

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  readonly executionTime: number
  readonly memoryUsed: number
  readonly cpuTime?: number
  readonly networkRequests?: number
}

/**
 * Plugin artifact for deployment
 */
export interface PluginArtifact {
  readonly code: string
  readonly dependencies: string[]
  readonly checksum: string
  readonly metadata: ArtifactMetadata
}

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  readonly buildTime: Date
  readonly buildVersion: string
  readonly sourceCommit?: string
  readonly buildEnvironment: string
}

/**
 * Plugin permissions
 */
export interface PluginPermissions {
  readonly filesystem: FileSystemPermissions
  readonly network: NetworkPermissions
  readonly communication: CommunicationPermissions
  readonly database: DatabasePermissions
}

/**
 * File system permissions
 */
export interface FileSystemPermissions {
  readonly read: string[]
  readonly write: string[]
  readonly execute: string[]
}

/**
 * Network permissions
 */
export interface NetworkPermissions {
  readonly allowedHosts: string[]
  readonly blockedHosts: string[]
  readonly maxRequestsPerMinute: number
}

/**
 * Communication permissions
 */
export interface CommunicationPermissions {
  readonly allowedTargets: string[]
  readonly allowedMessageTypes: string[]
}

/**
 * Database permissions
 */
export interface DatabasePermissions {
  readonly read: string[]
  readonly write: string[]
  readonly admin: boolean
}
