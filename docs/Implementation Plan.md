# Implementation Plan: The 5 Critical Gaps for Production Microservices

## Gap 1: Plugin Isolation & Security Sandboxing

### Strategic Overview

Transform your current shared-process plugin execution into isolated, secure sandboxes that prevent cascading failures and security breaches.

### 🔄 REVISED SECURITY ASSESSMENT: Internal Modularization Context

**For Internal Code Modularization: VM2 is Acceptable**

Since you're using plugins for internal microservice modularization (not untrusted third-party code), VM2 provides sufficient isolation for your needs:

#### Benefits for Internal Use

- **Fault Isolation**: Prevents one module from crashing others
- **Resource Limiting**: Controls memory/CPU usage per module
- **Development Velocity**: Simpler than containers for rapid iteration
- **Debugging**: Easier to debug than cross-process communication

#### Simplified VM2 Implementation (RECOMMENDED for Internal Use)

```typescript
// Infrastructure/security/plugin-sandbox.ts
import { VM } from 'vm2'
import { PluginContext, PluginExecutionResult } from '@/domain/plugins'

export class InternalPluginSandbox {
  private vm: VM
  private resourceMonitor: ResourceMonitor

  constructor(
    private readonly pluginId: string,
    private readonly limits: SandboxLimits
  ) {
    this.vm = new VM({
      timeout: limits.executionTimeout,
      sandbox: this.createModuleSandbox(),
      require: {
        external: this.getAllowedModules(),
        builtin: ['crypto', 'util', 'path', 'url'], // More permissive for internal use
        root: './node_modules',
        mock: this.createMockModules()
      }
    })
    
    this.resourceMonitor = new ResourceMonitor(limits)
  }

  async executePlugin(
    pluginCode: string, 
    context: PluginContext
  ): Promise<PluginExecutionResult> {
    try {
      this.resourceMonitor.start()
      
      const result = await this.vm.run(`
        (async function() {
          ${pluginCode}
          return await register(context);
        })()
      `, { context })

      return PluginExecutionResult.success(result)
      
    } catch (error) {
      if (error.name === 'VMError') {
        return PluginExecutionResult.failure(
          new ModuleExecutionError(error.message)
        )
      }
      throw error
    } finally {
      this.resourceMonitor.stop()
    }
  }

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
      // Add your commonly used internal modules
    ]
  }

  private createControlledFetch(): (url: string, options?: any) => Promise<Response> {
    return async (url: string, options?: any) => {
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

  private isInternalUrl(url: string): boolean {
    const internalPatterns = [
      /^https?:\/\/localhost/,
      /^https?:\/\/.*\.familying\.internal/,
      /^https?:\/\/.*\.local/,
      // Add your internal domain patterns
    ]
    
    return internalPatterns.some(pattern => pattern.test(url))
  }
}

export interface SandboxLimits {
  executionTimeout: number      // 60 seconds for internal operations
  memoryLimit: number          // 512MB - more generous for internal use
  maxFileDescriptors: number   // 200 max
  maxNetworkRequests: number   // 1000 per minute - generous for internal
}
```

#### Lightweight Resource Monitoring

```typescript
// Infrastructure/security/resource-monitor.ts
export class ResourceMonitor {
  private startTime: number
  private memoryCheckInterval: NodeJS.Timeout | null = null

  constructor(private limits: SandboxLimits) {}

  start(): void {
    this.startTime = Date.now()
    this.startMemoryMonitoring()
  }

  stop(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval)
      this.memoryCheckInterval = null
    }
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
```

#### When to Consider Upgrading to Containers

Upgrade to container isolation if you experience:

```typescript
// Infrastructure/security/upgrade-triggers.ts
export class IsolationUpgradeTriggers {
  shouldUpgradeToContainers(): boolean {
    return (
      this.hasFrequentModuleCrashes() ||
      this.hasMemoryLeakIssues() ||
      this.needsStrictResourceLimits() ||
      this.hasComplexDependencyConflicts() ||
      this.needsNetworkIsolation()
    )
  }

  private hasFrequentModuleCrashes(): boolean {
    // Monitor crash rates and decide
    return this.getCrashRate() > 0.1 // 10% crash rate threshold
  }
}
```

### Alternative: Even Simpler Process-Based Approach

```typescript
// Infrastructure/security/simple-process-sandbox.ts
export class SimpleProcessSandbox {
  async executePlugin(
    pluginPath: string,
    context: PluginContext
  ): Promise<PluginExecutionResult> {
    // For internal code, simple child processes work well
    const child = spawn('node', [pluginPath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      timeout: 60000,
      env: {
        ...process.env,
        PLUGIN_CONTEXT: JSON.stringify(context)
      }
    })

    return new Promise((resolve, reject) => {
      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => stdout += data)
      child.stderr?.on('data', (data) => stderr += data)

      child.on('exit', (code) => {
        if (code === 0) {
          resolve(PluginExecutionResult.success(JSON.parse(stdout)))
        } else {
          resolve(PluginExecutionResult.failure(new Error(stderr)))
        }
      })

      child.on('error', reject)
    })
  }
}
```

// ...existing code for other gaps...
  }

  private createSeccompProfile(): SeccompProfile {
    return {
      defaultAction: 'SCMP_ACT_ERRNO',
      allowedSyscalls: [
        'read', 'write', 'open', 'close', 'stat', 'fstat',
        'mmap', 'munmap', 'brk', 'getpid', 'exit_group'
        // Explicitly block: execve, fork, clone, mount, etc.
      ]
    }
  }
}

```

### Additional Security Considerations

#### Multi-Layer Security Architecture

```typescript
// Infrastructure/security/security-layers.ts
export class SecurityLayers {
  // Layer 1: Input Validation
  async validatePluginArtifact(artifact: PluginArtifact): Promise<ValidationResult> {
    // Static analysis for malicious patterns
    // Code signature verification
    // Dependency vulnerability scanning
  }

  // Layer 2: Runtime Monitoring
  async monitorExecution(sandbox: Sandbox): Promise<void> {
    // Real-time behavior analysis
    // Anomaly detection
    // Resource usage monitoring
  }

  // Layer 3: Output Sanitization
  async sanitizeOutput(result: any): Promise<any> {
    // Remove potential XSS/injection vectors
    // Validate against output schema
    // Rate limit output size
  }
}
```

#### Enhanced Error Handling and Recovery

```typescript
// Infrastructure/security/security-incidents.ts
export class SecurityIncidentHandler {
  async handleSandboxBreach(
    pluginId: string,
    breachType: SecurityBreachType,
    evidence: SecurityEvidence
  ): Promise<void> {
    // Immediate containment
    await this.quarantinePlugin(pluginId)
    
    // Evidence collection
    await this.collectForensicData(evidence)
    
    // Automated response
    await this.triggerIncidentResponse(breachType)
    
    // Notification
    await this.notifySecurityTeam(pluginId, breachType)
  }
}
```

---

## Gap 2: Inter-Plugin Communication & Service Mesh

### Strategic Overview

Implement a service mesh that allows plugins to communicate safely while maintaining isolation and providing circuit breaker patterns for resilience.

### Technical Implementation Plan

#### Phase 2.1: Service Registry (Week 3)

```typescript
// Infrastructure/communication/service-registry.ts
export interface ServiceEndpoint {
  pluginId: string
  serviceName: string
  version: string
  endpoints: EndpointDefinition[]
  healthCheck: string
  metadata: ServiceMetadata
}

export interface EndpointDefinition {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  inputSchema: JSONSchema
  outputSchema: JSONSchema
  rateLimit?: RateLimit
}

export class ServiceRegistry {
  private services = new Map<string, ServiceEndpoint>()
  private subscribers = new Map<string, Set<string>>() // service -> plugin dependencies

  async registerService(endpoint: ServiceEndpoint): Promise<void> {
    // Validate endpoint definitions
    const validation = await this.validateEndpoint(endpoint)
    if (validation.isFailure()) {
      throw new ServiceRegistrationError(validation.error)
    }

    this.services.set(endpoint.serviceName, endpoint)
    
    // Emit service registration event
    await this.eventBus.publish(
      new ServiceRegisteredEvent(endpoint.serviceName, endpoint.pluginId)
    )
  }

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

  private async checkServiceHealth(service: ServiceEndpoint): Promise<boolean> {
    try {
      const response = await fetch(`/plugins/${service.pluginId}${service.healthCheck}`, {
        method: 'GET',
        timeout: 3000
      })
      return response.ok
    } catch {
      return false
    }
  }
}
```

#### Phase 2.2: Circuit Breaker Pattern (Week 3)

```typescript
// Infrastructure/communication/circuit-breaker.ts
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, blocking requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime?: number
  private successCount = 0

  constructor(
    private readonly serviceName: string,
    private readonly config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
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

  private onSuccess(): void {
    this.failureCount = 0
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED
        this.successCount = 0
      }
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime
    return timeSinceLastFailure >= this.config.timeout
  }
}

export interface CircuitBreakerConfig {
  failureThreshold: number    // 5 failures triggers open
  successThreshold: number    // 3 successes closes circuit
  timeout: number            // 60 seconds before retry
}
```

#### Phase 2.3: Message Bus for Async Communication (Week 4)

```typescript
// Infrastructure/communication/message-bus.ts
export interface PluginMessage {
  id: string
  from: string              // Source plugin ID
  to: string               // Target plugin ID
  type: string             // Message type
  payload: any             // Message data
  timestamp: number
  correlationId?: string   // For request tracing
}

export class InterPluginMessageBus {
  private subscribers = new Map<string, MessageHandler[]>()
  private circuitBreakers = new Map<string, CircuitBreaker>()

  async publish(message: PluginMessage): Promise<void> {
    // Validate sender permissions
    await this.validateSenderPermissions(message.from, message.to)
    
    // Add tracing information
    const tracedMessage = {
      ...message,
      traceId: generateTraceId(),
      timestamp: Date.now()
    }

    // Route message through circuit breaker
    const circuitBreaker = this.getCircuitBreaker(message.to)
    
    try {
      await circuitBreaker.execute(async () => {
        await this.deliverMessage(tracedMessage)
      })
    } catch (error) {
      // Send to dead letter queue for retry
      await this.sendToDeadLetterQueue(tracedMessage, error)
    }
  }

  async subscribe(
    pluginId: string,
    messageType: string,
    handler: MessageHandler
  ): Promise<void> {
    const key = `${pluginId}:${messageType}`
    const handlers = this.subscribers.get(key) || []
    handlers.push(handler)
    this.subscribers.set(key, handlers)
  }

  private async deliverMessage(message: PluginMessage): Promise<void> {
    const key = `${message.to}:${message.type}`
    const handlers = this.subscribers.get(key) || []

    // Execute handlers in parallel with timeout
    await Promise.allSettled(
      handlers.map(handler => 
        this.executeWithTimeout(
          () => handler.handle(message),
          5000 // 5 second timeout
        )
      )
    )
  }

  private async validateSenderPermissions(
    from: string,
    to: string
  ): Promise<void> {
    const fromPlugin = await this.pluginRegistry.getPlugin(from)
    const toPlugin = await this.pluginRegistry.getPlugin(to)

    if (!fromPlugin || !toPlugin) {
      throw new InvalidPluginError('Plugin not found')
    }

    // Check if 'from' plugin has permission to message 'to' plugin
    const hasPermission = fromPlugin.permissions.communication
      .allowedTargets.includes(to)

    if (!hasPermission) {
      throw new PermissionDeniedError(
        `Plugin ${from} cannot message plugin ${to}`
      )
    }
  }
}

export interface MessageHandler {
  handle(message: PluginMessage): Promise<void>
}
```

---

## Gap 3: Advanced Observability & Distributed Tracing

### Strategic Overview

Implement comprehensive observability that provides end-to-end visibility across all plugin interactions, with distributed tracing, metrics collection, and structured logging.

### Technical Implementation Plan

#### Phase 3.1: Distributed Tracing System (Week 4)

```typescript
// Infrastructure/observability/tracing.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api'

export class DistributedTracer {
  private tracer = trace.getTracer('familying-plugins', '1.0.0')

  async tracePluginExecution<T>(
    pluginId: string,
    operation: string,
    fn: () => Promise<T>,
    parentSpan?: any
  ): Promise<T> {
    const span = this.tracer.startSpan(
      `plugin.${pluginId}.${operation}`,
      {
        attributes: {
          'plugin.id': pluginId,
          'plugin.operation': operation,
          'service.name': 'familying-plugin-system'
        }
      },
      parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined
    )

    try {
      const result = await fn()
      
      span.setStatus({
        code: SpanStatusCode.OK,
        message: 'Operation completed successfully'
      })
      
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      })
      
      span.recordException(error)
      throw error
    } finally {
      span.end()
    }
  }

  async traceInterPluginCommunication<T>(
    fromPlugin: string,
    toPlugin: string,
    messageType: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.tracer.startSpan(`communication.${fromPlugin}->${toPlugin}`, {
      attributes: {
        'communication.from': fromPlugin,
        'communication.to': toPlugin,
        'communication.type': messageType,
        'communication.direction': 'outbound'
      }
    })

    const correlationId = generateCorrelationId()
    
    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        // Inject trace context into message
        const result = await fn()
        
        span.addEvent('message_sent', {
          'correlation.id': correlationId
        })
        
        return result
      } finally {
        span.end()
      }
    })
  }

  createChildSpan(
    name: string,
    attributes?: Record<string, string | number>
  ): any {
    return this.tracer.startSpan(name, {
      attributes: attributes || {}
    })
  }
}

// Plugin context enhancement with tracing
export interface TracedPluginContext extends PluginContext {
  tracing: {
    currentSpan: any
    createChildSpan: (name: string, attributes?: any) => any
    addEvent: (name: string, attributes?: any) => void
  }
}
```

#### Phase 3.2: Metrics Collection (Week 5)

```typescript
// Infrastructure/observability/metrics.ts
import { metrics } from '@opentelemetry/api'

export class PluginMetricsCollector {
  private meter = metrics.getMeter('familying-plugins', '1.0.0')
  
  // Counters
  private pluginExecutions = this.meter.createCounter('plugin_executions_total', {
    description: 'Total number of plugin executions'
  })
  
  private pluginErrors = this.meter.createCounter('plugin_errors_total', {
    description: 'Total number of plugin errors'
  })
  
  private interPluginMessages = this.meter.createCounter('inter_plugin_messages_total', {
    description: 'Total inter-plugin messages'
  })

  // Histograms
  private executionDuration = this.meter.createHistogram('plugin_execution_duration_ms', {
    description: 'Plugin execution duration in milliseconds'
  })

  private messagingLatency = this.meter.createHistogram('inter_plugin_latency_ms', {
    description: 'Inter-plugin communication latency'
  })

  // Gauges
  private activePlugins = this.meter.createUpDownCounter('active_plugins', {
    description: 'Number of currently active plugins'
  })

  recordPluginExecution(
    pluginId: string,
    operation: string,
    duration: number,
    success: boolean
  ): void {
    const labels = { plugin_id: pluginId, operation }

    this.pluginExecutions.add(1, labels)
    this.executionDuration.record(duration, labels)

    if (!success) {
      this.pluginErrors.add(1, labels)
    }
  }

  recordInterPluginMessage(
    fromPlugin: string,
    toPlugin: string,
    messageType: string,
    latency: number
  ): void {
    const labels = {
      from_plugin: fromPlugin,
      to_plugin: toPlugin,
      message_type: messageType
    }

    this.interPluginMessages.add(1, labels)
    this.messagingLatency.record(latency, labels)
  }

  recordPluginStateChange(pluginId: string, state: 'active' | 'inactive'): void {
    const change = state === 'active' ? 1 : -1
    this.activePlugins.add(change, { plugin_id: pluginId })
  }

  async getMetricsSummary(): Promise<PluginMetricsSummary> {
    // Aggregate metrics for dashboard display
    return {
      totalExecutions: await this.aggregateCounter(this.pluginExecutions),
      totalErrors: await this.aggregateCounter(this.pluginErrors),
      averageExecutionTime: await this.aggregateHistogram(this.executionDuration),
      activePluginCount: await this.aggregateGauge(this.activePlugins),
      topErrorPlugins: await this.getTopErrorPlugins(),
      slowestOperations: await this.getSlowestOperations()
    }
  }
}

export interface PluginMetricsSummary {
  totalExecutions: number
  totalErrors: number
  averageExecutionTime: number
  activePluginCount: number
  topErrorPlugins: Array<{ pluginId: string; errorCount: number }>
  slowestOperations: Array<{ operation: string; averageTime: number }>
}
```

#### Phase 3.3: Structured Logging with Correlation (Week 5)

```typescript
// Infrastructure/observability/logger.ts
export interface LogContext {
  traceId?: string
  spanId?: string
  pluginId?: string
  correlationId?: string
  userId?: string
  operation?: string
}

export class StructuredLogger {
  constructor(
    private config: LoggingConfig,
    private context: LogContext = {}
  ) {}

  info(message: string, data?: any, context?: Partial<LogContext>): void {
    this.log('info', message, data, context)
  }

  warn(message: string, data?: any, context?: Partial<LogContext>): void {
    this.log('warn', message, data, context)
  }

  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.log('error', message, { error: error?.stack }, context)
  }

  debug(message: string, data?: any, context?: Partial<LogContext>): void {
    if (this.config.level === 'debug') {
      this.log('debug', message, data, context)
    }
  }

  private log(
    level: string,
    message: string,
    data?: any,
    additionalContext?: Partial<LogContext>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
      data,
      service: 'familying-plugins'
    }

    // Filter sensitive data
    const sanitizedEntry = this.sanitizeLogEntry(logEntry)

    // Send to configured outputs
    this.config.outputs.forEach(output => {
      output.write(sanitizedEntry)
    })
  }

  createChildLogger(context: Partial<LogContext>): StructuredLogger {
    return new StructuredLogger(this.config, { ...this.context, ...context })
  }

  private sanitizeLogEntry(entry: any): any {
    // Remove sensitive fields like passwords, tokens, etc.
    const sensitive = ['password', 'token', 'secret', 'key']
    return this.deepOmit(entry, sensitive)
  }
}

// Usage in plugin execution
export class TracedPluginExecutor {
  constructor(
    private tracer: DistributedTracer,
    private metrics: PluginMetricsCollector,
    private logger: StructuredLogger
  ) {}

  async executePlugin(
    plugin: Plugin,
    context: PluginContext
  ): Promise<PluginExecutionResult> {
    const startTime = Date.now()
    const pluginLogger = this.logger.createChildLogger({
      pluginId: plugin.manifest.name,
      operation: 'execute'
    })

    return this.tracer.tracePluginExecution(
      plugin.manifest.name,
      'execute',
      async () => {
        pluginLogger.info('Starting plugin execution', {
          version: plugin.manifest.version
        })

        try {
          const result = await plugin.register(context)
          const duration = Date.now() - startTime

          this.metrics.recordPluginExecution(
            plugin.manifest.name,
            'execute',
            duration,
            true
          )

          pluginLogger.info('Plugin execution completed', {
            duration,
            success: true
          })

          return PluginExecutionResult.success(result)
        } catch (error) {
          const duration = Date.now() - startTime

          this.metrics.recordPluginExecution(
            plugin.manifest.name,
            'execute',
            duration,
            false
          )

          pluginLogger.error('Plugin execution failed', error, {
            duration,
            success: false
          })

          return PluginExecutionResult.failure(error)
        }
      }
    )
  }
}
```

---

## Gap 4: Plugin Versioning & Blue-Green Deployments

### Strategic Overview

Implement safe plugin deployment strategies with version management, gradual rollouts, and automated rollback capabilities.

### Technical Implementation Plan

#### Phase 4.1: Plugin Version Management (Week 6)

```typescript
// Domain/plugins/plugin-version.ts
export interface PluginVersion {
  version: string           // Semantic version (1.2.3)
  releaseNotes: string
  compatibility: CompatibilityInfo
  artifact: PluginArtifact
  metadata: VersionMetadata
}

export interface CompatibilityInfo {
  minimumSystemVersion: string
  requiredPlugins: PluginDependency[]
  breakingChanges: string[]
  deprecations: string[]
}

export interface PluginDependency {
  pluginName: string
  versionRange: string      // ^1.0.0, >=2.1.0 <3.0.0
  optional: boolean
}

export class PluginVersionManager {
  constructor(
    private repository: PluginVersionRepository,
    private validator: CompatibilityValidator
  ) {}

  async publishVersion(
    pluginName: string,
    version: PluginVersion
  ): Promise<PublishResult> {
    // Validate semantic versioning
    if (!this.isValidSemVer(version.version)) {
      return PublishResult.failure('Invalid semantic version')
    }

    // Check for version conflicts
    const existingVersion = await this.repository.getVersion(
      pluginName,
      version.version
    )
    if (existingVersion) {
      return PublishResult.failure('Version already exists')
    }

    // Validate compatibility
    const compatibilityCheck = await this.validator.validateCompatibility(
      pluginName,
      version
    )
    if (compatibilityCheck.isFailure()) {
      return PublishResult.failure(compatibilityCheck.error)
    }

    // Store version
    await this.repository.storeVersion(pluginName, version)

    // Emit version published event
    await this.eventBus.publish(
      new PluginVersionPublishedEvent(pluginName, version.version)
    )

    return PublishResult.success()
  }

  async getLatestCompatibleVersion(
    pluginName: string,
    constraints?: VersionConstraints
  ): Promise<PluginVersion | null> {
    const versions = await this.repository.getVersions(pluginName)
    
    return versions
      .filter(v => this.satisfiesConstraints(v, constraints))
      .sort((a, b) => this.compareVersions(a.version, b.version))
      .pop() || null
  }

  async planUpgrade(
    currentVersions: Map<string, string>,
    targetVersions: Map<string, string>
  ): Promise<UpgradePlan> {
    const plan = new UpgradePlan()

    for (const [pluginName, targetVersion] of targetVersions) {
      const currentVersion = currentVersions.get(pluginName)
      
      if (currentVersion !== targetVersion) {
        const upgrade = await this.planSingleUpgrade(
          pluginName,
          currentVersion,
          targetVersion
        )
        plan.addUpgrade(upgrade)
      }
    }

    // Check for dependency conflicts
    const conflicts = await this.detectDependencyConflicts(plan)
    if (conflicts.length > 0) {
      plan.addConflicts(conflicts)
    }

    return plan
  }

  private async planSingleUpgrade(
    pluginName: string,
    fromVersion: string | undefined,
    toVersion: string
  ): Promise<PluginUpgrade> {
    const targetVersionInfo = await this.repository.getVersion(
      pluginName,
      toVersion
    )

    if (!targetVersionInfo) {
      throw new VersionNotFoundError(pluginName, toVersion)
    }

    const migrationSteps: MigrationStep[] = []

    if (fromVersion) {
      // Find migration path
      migrationSteps.push(
        ...await this.findMigrationPath(pluginName, fromVersion, toVersion)
      )
    }

    return {
      pluginName,
      fromVersion,
      toVersion,
      migrationSteps,
      breakingChanges: targetVersionInfo.compatibility.breakingChanges,
      estimatedDowntime: this.estimateDowntime(migrationSteps)
    }
  }
}
```

#### Phase 4.2: Blue-Green Deployment System (Week 6)

```typescript
// Infrastructure/deployment/blue-green-deployer.ts
export enum DeploymentSlot {
  BLUE = 'blue',
  GREEN = 'green'
}

export interface DeploymentEnvironment {
  slot: DeploymentSlot
  plugins: Map<string, LoadedPlugin>
  status: 'active' | 'standby' | 'deploying' | 'failed'
  healthScore: number
}

export class BlueGreenDeployer {
  private environments: Map<DeploymentSlot, DeploymentEnvironment>
  private activeSlot: DeploymentSlot = DeploymentSlot.BLUE

  constructor(
    private pluginLoader: PluginLoader,
    private healthChecker: HealthChecker,
    private trafficController: TrafficController
  ) {
    this.environments = new Map([
      [DeploymentSlot.BLUE, this.createEnvironment(DeploymentSlot.BLUE)],
      [DeploymentSlot.GREEN, this.createEnvironment(DeploymentSlot.GREEN)]
    ])
  }

  async deployPlugin(
    pluginName: string,
    version: string,
    rolloutStrategy: RolloutStrategy = { type: 'immediate' }
  ): Promise<DeploymentResult> {
    const standbySlot = this.getStandbySlot()
    const standbyEnv = this.environments.get(standbySlot)!

    try {
      // Phase 1: Deploy to standby environment
      await this.deployToEnvironment(standbyEnv, pluginName, version)

      // Phase 2: Health check
      const healthCheck = await this.performHealthCheck(standbyEnv)
      if (!healthCheck.healthy) {
        throw new DeploymentError('Health check failed', healthCheck.issues)
      }

      // Phase 3: Execute rollout strategy
      switch (rolloutStrategy.type) {
        case 'immediate':
          await this.switchTrafficImmediate(standbySlot)
          break
        case 'canary':
          await this.executeCanaryDeployment(standbySlot, rolloutStrategy)
          break
        case 'gradual':
          await this.executeGradualRollout(standbySlot, rolloutStrategy)
          break
      }

      return DeploymentResult.success(standbySlot)

    } catch (error) {
      // Rollback on failure
      await this.rollbackEnvironment(standbyEnv)
      return DeploymentResult.failure(error.message)
    }
  }

  private async executeCanaryDeployment(
    newSlot: DeploymentSlot,
    strategy: CanaryRolloutStrategy
  ): Promise<void> {
    const canaryPercentages = strategy.percentages || [5, 10, 25, 50, 100]
    
    for (const percentage of canaryPercentages) {
      // Route percentage of traffic to new slot
      await this.trafficController.setTrafficSplit({
        [this.activeSlot]: 100 - percentage,
        [newSlot]: percentage
      })

      // Monitor for stability period
      await this.monitorStability(strategy.stabilityPeriod || 300) // 5 minutes

      // Check error rates and performance
      const metrics = await this.gatherCanaryMetrics(newSlot, percentage)
      if (!this.meetsCanaryThresholds(metrics, strategy.thresholds)) {
        throw new CanaryFailureError('Canary metrics exceeded thresholds')
      }
    }

    // Complete switch
    this.activeSlot = newSlot
  }

  private async executeGradualRollout(
    newSlot: DeploymentSlot,
    strategy: GradualRolloutStrategy
  ): Promise<void> {
    const totalUsers = await this.getUserCount()
    const batchSize = Math.ceil(totalUsers * (strategy.batchSizePercent / 100))
    
    let processedUsers = 0
    
    while (processedUsers < totalUsers) {
      const userBatch = await this.getNextUserBatch(batchSize, processedUsers)
      
      // Route this batch to new environment
      await this.trafficController.routeUsers(userBatch, newSlot)
      
      // Monitor batch performance
      await this.monitorBatchStability(
        userBatch,
        strategy.stabilityPeriod || 600 // 10 minutes
      )
      
      processedUsers += userBatch.length
    }

    this.activeSlot = newSlot
  }

  async rollback(reason: string): Promise<RollbackResult> {
    const previousSlot = this.activeSlot === DeploymentSlot.BLUE 
      ? DeploymentSlot.GREEN 
      : DeploymentSlot.BLUE

    try {
      // Immediate traffic switch
      await this.switchTrafficImmediate(previousSlot)

      // Log rollback event
      await this.eventBus.publish(
        new RollbackEvent(previousSlot, this.activeSlot, reason)
      )

      return RollbackResult.success(previousSlot)
    } catch (error) {
      return RollbackResult.failure('Rollback failed: ' + error.message)
    }
  }
}
```
