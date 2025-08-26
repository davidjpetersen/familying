// Configuration
export * from './config/app-config'

// Dependency injection
export * from './di/container'

// Repository implementations
// Security & Sandboxing
export { 
  InternalPluginSandbox, 
  ResourceMonitor, 
  DEFAULT_SANDBOX_LIMITS,
  ModuleExecutionError,
  type SandboxLimits 
} from './security/plugin-sandbox'

// Communication & Service Mesh
export { 
  ServiceRegistry,
  ServiceRegisteredEvent,
  ServiceUnregisteredEvent,
  ServiceRegistrationError,
  ServiceUnavailableError 
} from './communication/service-registry'

export {
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitState,
  CircuitOpenError,
  CIRCUIT_BREAKER_CONFIGS,
  type CircuitBreakerConfig,
  type CircuitBreakerMetrics
} from './communication/circuit-breaker'

export {
  InterPluginMessageBus,
  MessageSentEvent,
  MessageDeliveredEvent,
  MessageFailedEvent,
  PermissionDeniedError,
  InvalidPluginError,
  MessageTimeoutError,
  type PluginMessage,
  type MessageHandler,
  type MessageDeliveryResult,
  type DeadLetterEntry,
  type MessagePriority
} from './communication/message-bus'

// Observability & Monitoring
export {
  DistributedTracer,
  generateCorrelationId,
  createTracedPluginContext,
  type TracingContext,
  type SpanContext
} from './observability/tracing'

export {
  PluginMetricsCollector,
  type PluginMetricsSummary,
  type ExecutionStats,
  type PerformanceThreshold
} from './observability/metrics'

export {
  StructuredLogger,
  LoggerFactory,
  ConsoleLogOutput,
  JsonLogOutput,
  FileLogOutput,
  logger,
  createLogger,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type LogOutput,
  type LoggingConfig
} from './observability/logger'

export {
  TracedPluginExecutor,
  PluginExecutorFactory,
  type PluginExecutionConfig,
  type PluginExecutionEnvironment,
  type EnhancedExecutionResult
} from './observability/traced-plugin-executor'

// Deployment & Versioning
export {
  PluginVersionManager,
  ValidationResult,
  PublishResult,
  UpgradePlan,
  VersionNotFoundError,
  type PluginVersion,
  type CompatibilityInfo,
  type PluginDependency,
  type PluginArtifact,
  type VersionConstraints,
  type PluginUpgrade,
  type MigrationStep,
  type DependencyConflict
} from './deployment/plugin-version-manager'

export {
  BlueGreenDeployer,
  DeploymentSlot,
  DeploymentResult,
  RollbackResult,
  DeploymentError,
  CanaryFailureError,
  type DeploymentEnvironment,
  type EnvironmentStatus,
  type LoadedPlugin,
  type RolloutStrategy,
  type ImmediateRolloutStrategy,
  type CanaryRolloutStrategy,
  type GradualRolloutStrategy,
  type DeploymentMetrics,
  type HealthCheckResult
} from './deployment/blue-green-deployer'

// Main Orchestrator
export {
  PluginSystemOrchestrator,
  PluginSystemFactory,
  type PluginSystemConfig
} from './plugin-system-orchestrator'

// Re-export domain types
export type {
  PluginContext,
  PluginExecutionResult,
  ServiceEndpoint,
  EndpointDefinition,
  ServiceMetadata,
  ExecutionMetrics
} from '../domain/types/plugin-types'
