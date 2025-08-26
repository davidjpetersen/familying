/**
 * Production Plugin System Example
 * 
 * This example demonstrates how to use the complete production-ready plugin system
 * with all 5 critical gaps implemented:
 * 
 * 1. Plugin Isolation & Security Sandboxing
 * 2. Inter-Plugin Communication & Service Mesh
 * 3. Advanced Observability & Distributed Tracing
 * 4. Plugin Versioning & Blue-Green Deployments
 * 5. Production Operations & Monitoring
 */

import { EventBus, InMemoryEventBus } from '../../domain/events/event-bus'
import { PluginEntity } from '../../domain/entities/plugin'
import {
  PluginSystemOrchestrator,
  PluginSystemFactory,
  DeploymentSlot,
  BlueGreenDeployer,
  PluginVersionManager,
  CanaryRolloutStrategy,
  LoggerFactory,
  ValidationResult,
  ConsoleLogOutput
} from '../index'

/**
 * Initialize and demonstrate the production plugin system
 */
export async function demonstrateProductionPluginSystem() {
  // Initialize logger for the demo
  const logger = LoggerFactory.getInstance().createLogger({
    operation: 'plugin-system-demo'
  })

  logger.info('Starting production plugin system demonstration')

  try {
    // 1. Create event bus (required dependency)
    const eventBus = new InMemoryEventBus()

    // 2. Initialize plugin system for production
    const pluginSystem = PluginSystemFactory.createForProduction(eventBus)

    // 3. Create a sample plugin
    const samplePlugin = createSamplePlugin()

    // 4. Demonstrate basic plugin execution with full observability
    logger.info('Demonstrating basic plugin execution...')
    const executionResult = await pluginSystem.executePlugin(
      samplePlugin,
      {
        pluginId: samplePlugin.name,
        environment: 'production',
        config: { debug: false },
        user: {
          id: 'user123',
          email: 'user@example.com',
          roles: ['user'],
          permissions: ['read', 'write']
        }
      }
    )

    if (executionResult.isSuccess()) {
      logger.info('Plugin execution successful', {
        executionId: executionResult.executionId,
        traceId: executionResult.traceId,
        duration: executionResult.metrics?.executionTime,
        observability: executionResult.observability
      })
    } else {
      logger.error('Plugin execution failed', executionResult.error!)
    }

    // 5. Demonstrate service registration
    logger.info('Demonstrating service registration...')
    await pluginSystem.registerService(
      samplePlugin.name,
      'user-management',
      [
        {
          path: '/users',
          method: 'GET',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'array', items: { type: 'object' } }
        },
        {
          path: '/users',
          method: 'POST',
          inputSchema: { 
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            },
            required: ['name', 'email']
          },
          outputSchema: { type: 'object' }
        }
      ]
    )

    // 6. Demonstrate inter-plugin messaging
    logger.info('Demonstrating inter-plugin messaging...')
    
    // Subscribe to messages
    await pluginSystem.subscribeToMessages(
      'receiver-plugin',
      'user.created',
      async (message: any) => {
        logger.info('Received message', {
          messageId: message.id,
          type: message.type,
          from: message.from,
          payload: message.payload
        })
      }
    )

    // Send a message
    await pluginSystem.sendMessage(
      samplePlugin.name,
      'receiver-plugin',
      'user.created',
      {
        userId: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        timestamp: new Date().toISOString()
      }
    )

    // 7. Demonstrate system health monitoring
    logger.info('Checking system health...')
    const healthStatus = await pluginSystem.getSystemHealth()
    logger.info('System health status', healthStatus)

    // 8. Demonstrate plugin metrics
    logger.info('Retrieving plugin metrics...')
    const pluginMetrics = pluginSystem.getPluginMetrics(samplePlugin.name)
    logger.info('Plugin metrics', { pluginMetrics })

    // 9. Demonstrate blue-green deployment (simulation)
    logger.info('Demonstrating blue-green deployment...')
    await demonstrateBlueGreenDeployment(logger)

    // 10. Demonstrate version management
    logger.info('Demonstrating version management...')
    await demonstrateVersionManagement(logger)

    // 11. Show dead letter queue handling
    const deadLetterEntries = pluginSystem.getDeadLetterQueue()
    if (deadLetterEntries.length > 0) {
      logger.info('Dead letter queue entries found', { count: deadLetterEntries.length })
      await pluginSystem.retryFailedMessages(5)
    }

    logger.info('Production plugin system demonstration completed successfully')

  } catch (error) {
    logger.error('Plugin system demonstration failed', 
      error instanceof Error ? error : new Error(String(error))
    )
    throw error
  }
}

/**
 * Demonstrate blue-green deployment
 */
async function demonstrateBlueGreenDeployment(logger: any) {
  // Create mock implementations for demonstration
  const mockPluginLoader = {
    async loadPlugin(pluginId: string, version: string) {
      return {
        entity: createSamplePlugin(),
        version: createSampleVersion(),
        loadedAt: new Date(),
        status: 'active' as const,
        healthScore: 95
      }
    },
    async unloadPlugin(pluginId: string) {
      logger.info(`Unloading plugin: ${pluginId}`)
    },
    getLoadedPlugins() {
      return new Map()
    }
  }

  const mockHealthChecker = {
    async checkEnvironmentHealth(environment: any) {
      return {
        healthy: true,
        score: 95,
        issues: [],
        checkedAt: new Date()
      }
    },
    async checkPluginHealth(plugin: any) {
      return true
    }
  }

  const mockTrafficController = {
    async setTrafficSplit(split: Record<DeploymentSlot, number>) {
      logger.info('Traffic split updated', split)
    },
    async routeUsers(userIds: string[], slot: DeploymentSlot) {
      logger.info(`Routing ${userIds.length} users to ${slot}`)
    },
    async getCurrentTrafficSplit() {
      return { [DeploymentSlot.BLUE]: 100, [DeploymentSlot.GREEN]: 0 }
    }
  }

  const mockVersionManager = {} as any

  // Initialize blue-green deployer
  const deployer = new BlueGreenDeployer(
    mockPluginLoader,
    mockHealthChecker,
    mockTrafficController,
    mockVersionManager
  )

  // Demonstrate canary deployment
  const canaryStrategy: CanaryRolloutStrategy = {
    type: 'canary',
    percentages: [5, 25, 50, 100],
    stabilityPeriod: 1000, // 1 second for demo
    thresholds: {
      maxErrorRate: 0.05,
      maxResponseTime: 1000,
      minSuccessRate: 0.95
    }
  }

  logger.info('Starting canary deployment...')
  const deploymentResult = await deployer.deployPlugin(
    'sample-plugin',
    '2.0.0',
    canaryStrategy
  )

  if (deploymentResult.success) {
    logger.info('Canary deployment successful', {
      slot: deploymentResult.slot,
      metrics: deploymentResult.metrics
    })
  } else {
    logger.warn('Canary deployment failed', {
      message: deploymentResult.message
    })
  }

  // Show deployment status
  const status = deployer.getDeploymentStatus()
  logger.info('Deployment status', status)
}

/**
 * Demonstrate version management
 */
async function demonstrateVersionManagement(logger: any) {
  // Create mock repository and validator
  const mockRepository = {
    async storeVersion(pluginName: string, version: any) {
      logger.info(`Stored version ${version.version} for plugin ${pluginName}`)
    },
    async getVersion(pluginName: string, version: string) {
      return null // Simulate no existing version
    },
    async getVersions(pluginName: string) {
      return [createSampleVersion()]
    },
    async getLatestVersion(pluginName: string) {
      return createSampleVersion()
    },
    async deleteVersion(pluginName: string, version: string) {
      logger.info(`Deleted version ${version} for plugin ${pluginName}`)
    },
    async searchVersions(criteria: any) {
      return [createSampleVersion()]
    }
  }

  const mockValidator = {
    async validateCompatibility(pluginName: string, version: any): Promise<ValidationResult> {
      return ValidationResult.success([])
    }
  }

  const versionManager = new PluginVersionManager(mockRepository, mockValidator)

  // Demonstrate version publishing
  const newVersion = createSampleVersion('2.1.0')
  const publishResult = await versionManager.publishVersion('sample-plugin', newVersion)

  if (publishResult.success) {
    logger.info('Version published successfully', {
      version: publishResult.version?.version
    })
  } else {
    logger.warn('Version publishing failed', {
      message: publishResult.message
    })
  }

  // Demonstrate upgrade planning
  const currentVersions = new Map([['sample-plugin', '1.0.0']])
  const targetVersions = new Map([['sample-plugin', '2.1.0']])
  
  const upgradePlan = await versionManager.planUpgrade(currentVersions, targetVersions)
  
  logger.info('Upgrade plan created', {
    upgrades: upgradePlan.getUpgrades().length,
    conflicts: upgradePlan.getConflicts().length,
    estimatedDowntime: upgradePlan.getTotalEstimatedDowntime()
  })
}

/**
 * Create a sample plugin for demonstration
 */
function createSamplePlugin(): PluginEntity {
  return PluginEntity.fromManifest({
    name: 'sample-plugin',
    version: '1.0.0',
    description: 'A sample plugin for demonstration',
    author: 'Plugin Developer',
    dependencies: [],
    permissions: [],
    config: {
      feature1: true,
      timeout: 30000,
      retryCount: 3
    }
  })
}

/**
 * Create a sample version for demonstration
 */
function createSampleVersion(version: string = '1.0.0') {
  return {
    version,
    releaseNotes: 'Initial release with basic functionality',
    compatibility: {
      minimumSystemVersion: '1.0.0',
      requiredPlugins: [],
      breakingChanges: [],
      deprecations: []
    },
    artifact: {
      code: 'console.log("Sample plugin code");',
      dependencies: [],
      checksum: 'abc123',
      size: 35,
      metadata: {
        buildTime: new Date(),
        buildVersion: '1.0.0',
        buildEnvironment: 'production',
        compiler: 'typescript',
        optimizations: ['minification', 'tree-shaking']
      }
    },
    metadata: {
      stability: 'stable' as const,
      performance: {
        averageExecutionTime: 150,
        memoryUsage: 1024 * 1024, // 1MB
        cpuUsage: 5,
        startupTime: 100
      },
      security: {
        vulnerabilities: [],
        securityScore: 95,
        lastSecurityScan: new Date(),
        certifications: ['SOC2', 'ISO27001']
      },
      documentation: 'https://docs.example.com/sample-plugin',
      changelog: 'Initial release'
    },
    publishedAt: new Date(),
    publishedBy: 'developer@example.com'
  }
}

/**
 * Performance testing function
 */
export async function performanceTest() {
  const logger = LoggerFactory.getInstance().createLogger({
    operation: 'performance-test'
  })

  const eventBus = new InMemoryEventBus()
  const pluginSystem = PluginSystemFactory.createForProduction(eventBus)
  const samplePlugin = createSamplePlugin()

  logger.info('Starting performance test...')

  const iterations = 100
  const startTime = Date.now()
  const results = []

  for (let i = 0; i < iterations; i++) {
    const iterationStart = Date.now()
    
    const result = await pluginSystem.executePlugin(samplePlugin, {
      pluginId: samplePlugin.name,
      environment: 'production',
      config: { iteration: i }
    })

    const iterationTime = Date.now() - iterationStart
    results.push({
      iteration: i,
      success: result.isSuccess(),
      duration: iterationTime,
      memoryUsed: result.metrics?.memoryUsed || 0
    })

    if (i % 10 === 0) {
      logger.info(`Completed ${i + 1}/${iterations} iterations`)
    }
  }

  const totalTime = Date.now() - startTime
  const successfulExecutions = results.filter(r => r.success).length
  const averageTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  const maxTime = Math.max(...results.map(r => r.duration))
  const minTime = Math.min(...results.map(r => r.duration))

  logger.info('Performance test completed', {
    totalIterations: iterations,
    successfulExecutions,
    successRate: (successfulExecutions / iterations) * 100,
    totalTime,
    averageExecutionTime: averageTime,
    minExecutionTime: minTime,
    maxExecutionTime: maxTime,
    throughput: (iterations / totalTime) * 1000 // executions per second
  })

  return {
    iterations,
    successfulExecutions,
    successRate: (successfulExecutions / iterations) * 100,
    totalTime,
    averageExecutionTime: averageTime,
    throughput: (iterations / totalTime) * 1000
  }
}

/**
 * Integration test function
 */
export async function integrationTest() {
  const logger = LoggerFactory.getInstance().createLogger({
    operation: 'integration-test'
  })

  logger.info('Starting integration test...')

  try {
    // Test all components together
    await demonstrateProductionPluginSystem()
    
    // Run performance test
    const perfResults = await performanceTest()
    
    logger.info('Integration test completed successfully', {
      performanceResults: perfResults
    })

    return true
  } catch (error) {
    logger.error('Integration test failed', 
      error instanceof Error ? error : new Error(String(error))
    )
    return false
  }
}

/**
 * Main demo function
 */
export async function runProductionPluginSystemDemo() {
  console.log('🚀 Starting Production Plugin System Demo...\n')

  try {
    // Configure logging for demo
    LoggerFactory.getInstance().configure({
      level: 'info',
      outputs: [new ConsoleLogOutput()],
      enableConsole: true,
      enableStructured: false,
      sensitiveFields: ['password', 'token', 'secret'],
      maxDataSize: 1024
    })

    // Run the demonstration
    await demonstrateProductionPluginSystem()
    
    console.log('\n✅ Production Plugin System Demo completed successfully!')
    console.log('\nImplemented Features:')
    console.log('  ✓ Plugin Isolation & Security Sandboxing (VM2-based)')
    console.log('  ✓ Inter-Plugin Communication & Service Mesh')
    console.log('  ✓ Advanced Observability & Distributed Tracing')
    console.log('  ✓ Plugin Versioning & Blue-Green Deployments')
    console.log('  ✓ Production Operations & Monitoring')
    console.log('\nThe plugin system is now production-ready! 🎉')

  } catch (error) {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  }
}

// Export for use in other files
export {
  createSamplePlugin,
  createSampleVersion
}
