import { metrics } from '@opentelemetry/api'

/**
 * Plugin metrics summary interface
 */
export interface PluginMetricsSummary {
  readonly totalExecutions: number
  readonly totalErrors: number
  readonly averageExecutionTime: number
  readonly activePluginCount: number
  readonly topErrorPlugins: Array<{ pluginId: string; errorCount: number }>
  readonly slowestOperations: Array<{ operation: string; averageTime: number }>
  readonly messageStats: {
    readonly totalMessages: number
    readonly averageLatency: number
    readonly errorRate: number
  }
}

/**
 * Execution statistics
 */
export interface ExecutionStats {
  readonly pluginId: string
  readonly operation: string
  readonly totalExecutions: number
  readonly successfulExecutions: number
  readonly failedExecutions: number
  readonly averageExecutionTime: number
  readonly lastExecutionTime?: Date
}

/**
 * Performance threshold
 */
export interface PerformanceThreshold {
  readonly metric: string
  readonly threshold: number
  readonly operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
}

/**
 * Plugin metrics collector using OpenTelemetry
 */
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

  private serviceCallsTotal = this.meter.createCounter('service_calls_total', {
    description: 'Total service calls between plugins'
  })

  // Histograms
  private executionDuration = this.meter.createHistogram('plugin_execution_duration_ms', {
    description: 'Plugin execution duration in milliseconds',
    unit: 'ms'
  })

  private messagingLatency = this.meter.createHistogram('inter_plugin_latency_ms', {
    description: 'Inter-plugin communication latency',
    unit: 'ms'
  })

  private memoryUsage = this.meter.createHistogram('plugin_memory_usage_bytes', {
    description: 'Plugin memory usage in bytes',
    unit: 'bytes'
  })

  // Gauges (using UpDownCounter as approximation)
  private activePlugins = this.meter.createUpDownCounter('active_plugins', {
    description: 'Number of currently active plugins'
  })

  private queueDepth = this.meter.createUpDownCounter('message_queue_depth', {
    description: 'Current message queue depth'
  })

  // In-memory stats for aggregation
  private executionStats = new Map<string, ExecutionStats>()
  private messageStats = {
    totalMessages: 0,
    totalLatency: 0,
    totalErrors: 0
  }

  /**
   * Record plugin execution metrics
   */
  recordPluginExecution(
    pluginId: string,
    operation: string,
    duration: number,
    memoryUsed: number,
    success: boolean,
    errorType?: string
  ): void {
    const labels = { 
      plugin_id: pluginId, 
      operation,
      success: success.toString()
    }

    // Update counters
    this.pluginExecutions.add(1, labels)
    
    if (!success) {
      this.pluginErrors.add(1, { 
        ...labels, 
        error_type: errorType || 'unknown' 
      })
    }

    // Update histograms
    this.executionDuration.record(duration, labels)
    this.memoryUsage.record(memoryUsed, labels)

    // Update internal stats
    this.updateExecutionStats(pluginId, operation, duration, success)
  }

  /**
   * Record inter-plugin message metrics
   */
  recordInterPluginMessage(
    fromPlugin: string,
    toPlugin: string,
    messageType: string,
    latency: number,
    success: boolean = true
  ): void {
    const labels = {
      from_plugin: fromPlugin,
      to_plugin: toPlugin,
      message_type: messageType,
      success: success.toString()
    }

    this.interPluginMessages.add(1, labels)
    this.messagingLatency.record(latency, labels)

    // Update internal message stats
    this.messageStats.totalMessages++
    this.messageStats.totalLatency += latency
    if (!success) {
      this.messageStats.totalErrors++
    }
  }

  /**
   * Record service call metrics
   */
  recordServiceCall(
    serviceName: string,
    methodName: string,
    duration: number,
    success: boolean,
    httpStatus?: number
  ): void {
    const labels = {
      service_name: serviceName,
      method: methodName,
      success: success.toString(),
      ...(httpStatus && { http_status: httpStatus.toString() })
    }

    this.serviceCallsTotal.add(1, labels)
    this.executionDuration.record(duration, labels)
  }

  /**
   * Record plugin state change
   */
  recordPluginStateChange(pluginId: string, state: 'active' | 'inactive'): void {
    const change = state === 'active' ? 1 : -1
    this.activePlugins.add(change, { plugin_id: pluginId })
  }

  /**
   * Record message queue depth change
   */
  recordQueueDepthChange(change: number, queueType: string = 'default'): void {
    this.queueDepth.add(change, { queue_type: queueType })
  }

  /**
   * Get comprehensive metrics summary
   */
  async getMetricsSummary(): Promise<PluginMetricsSummary> {
    const topErrorPlugins = this.getTopErrorPlugins(5)
    const slowestOperations = this.getSlowestOperations(5)

    return {
      totalExecutions: this.getTotalExecutions(),
      totalErrors: this.getTotalErrors(),
      averageExecutionTime: this.getAverageExecutionTime(),
      activePluginCount: this.getActivePluginCount(),
      topErrorPlugins,
      slowestOperations,
      messageStats: {
        totalMessages: this.messageStats.totalMessages,
        averageLatency: this.messageStats.totalMessages > 0 
          ? this.messageStats.totalLatency / this.messageStats.totalMessages 
          : 0,
        errorRate: this.messageStats.totalMessages > 0 
          ? this.messageStats.totalErrors / this.messageStats.totalMessages 
          : 0
      }
    }
  }

  /**
   * Get execution statistics for specific plugin
   */
  getPluginStats(pluginId: string): ExecutionStats[] {
    return Array.from(this.executionStats.values())
      .filter(stat => stat.pluginId === pluginId)
  }

  /**
   * Get all execution statistics
   */
  getAllExecutionStats(): ExecutionStats[] {
    return Array.from(this.executionStats.values())
  }

  /**
   * Check performance thresholds
   */
  checkPerformanceThresholds(thresholds: PerformanceThreshold[]): Array<{
    threshold: PerformanceThreshold
    currentValue: number
    violated: boolean
  }> {
    const results: Array<{
      threshold: PerformanceThreshold
      currentValue: number
      violated: boolean
    }> = []

    for (const threshold of thresholds) {
      const currentValue = this.getMetricValue(threshold.metric)
      const violated = this.evaluateThreshold(currentValue, threshold)
      
      results.push({
        threshold,
        currentValue,
        violated
      })
    }

    return results
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.executionStats.clear()
    this.messageStats = {
      totalMessages: 0,
      totalLatency: 0,
      totalErrors: 0
    }
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStats(
    pluginId: string,
    operation: string,
    duration: number,
    success: boolean
  ): void {
    const key = `${pluginId}:${operation}`
    const existing = this.executionStats.get(key) || {
      pluginId,
      operation,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    }

    const newTotalExecutions = existing.totalExecutions + 1
    const newAverageTime = (
      (existing.averageExecutionTime * existing.totalExecutions) + duration
    ) / newTotalExecutions

    const updated: ExecutionStats = {
      ...existing,
      totalExecutions: newTotalExecutions,
      successfulExecutions: existing.successfulExecutions + (success ? 1 : 0),
      failedExecutions: existing.failedExecutions + (success ? 0 : 1),
      averageExecutionTime: newAverageTime,
      lastExecutionTime: new Date()
    }

    this.executionStats.set(key, updated)
  }

  /**
   * Get top error plugins
   */
  private getTopErrorPlugins(limit: number): Array<{ pluginId: string; errorCount: number }> {
    const errorCounts = new Map<string, number>()

    for (const stat of this.executionStats.values()) {
      const currentCount = errorCounts.get(stat.pluginId) || 0
      errorCounts.set(stat.pluginId, currentCount + stat.failedExecutions)
    }

    return Array.from(errorCounts.entries())
      .map(([pluginId, errorCount]) => ({ pluginId, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, limit)
  }

  /**
   * Get slowest operations
   */
  private getSlowestOperations(limit: number): Array<{ operation: string; averageTime: number }> {
    return Array.from(this.executionStats.values())
      .map(stat => ({
        operation: `${stat.pluginId}:${stat.operation}`,
        averageTime: stat.averageExecutionTime
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit)
  }

  /**
   * Get total executions across all plugins
   */
  private getTotalExecutions(): number {
    return Array.from(this.executionStats.values())
      .reduce((sum, stat) => sum + stat.totalExecutions, 0)
  }

  /**
   * Get total errors across all plugins
   */
  private getTotalErrors(): number {
    return Array.from(this.executionStats.values())
      .reduce((sum, stat) => sum + stat.failedExecutions, 0)
  }

  /**
   * Get average execution time across all operations
   */
  private getAverageExecutionTime(): number {
    const stats = Array.from(this.executionStats.values())
    if (stats.length === 0) return 0

    const totalTime = stats.reduce((sum, stat) => 
      sum + (stat.averageExecutionTime * stat.totalExecutions), 0)
    const totalExecutions = this.getTotalExecutions()

    return totalExecutions > 0 ? totalTime / totalExecutions : 0
  }

  /**
   * Get active plugin count (simplified implementation)
   */
  private getActivePluginCount(): number {
    // This would typically come from the actual plugin registry
    // For now, return count of plugins that have recent activity
    const recentThreshold = Date.now() - (5 * 60 * 1000) // 5 minutes ago
    
    return Array.from(this.executionStats.values())
      .filter(stat => stat.lastExecutionTime && stat.lastExecutionTime.getTime() > recentThreshold)
      .map(stat => stat.pluginId)
      .filter((pluginId, index, array) => array.indexOf(pluginId) === index) // unique
      .length
  }

  /**
   * Get metric value by name
   */
  private getMetricValue(metricName: string): number {
    switch (metricName) {
      case 'averageExecutionTime':
        return this.getAverageExecutionTime()
      case 'totalErrors':
        return this.getTotalErrors()
      case 'totalExecutions':
        return this.getTotalExecutions()
      case 'activePluginCount':
        return this.getActivePluginCount()
      case 'errorRate':
        const total = this.getTotalExecutions()
        return total > 0 ? this.getTotalErrors() / total : 0
      case 'averageMessageLatency':
        return this.messageStats.totalMessages > 0 
          ? this.messageStats.totalLatency / this.messageStats.totalMessages 
          : 0
      default:
        return 0
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(value: number, threshold: PerformanceThreshold): boolean {
    switch (threshold.operator) {
      case 'gt':
        return value > threshold.threshold
      case 'gte':
        return value >= threshold.threshold
      case 'lt':
        return value < threshold.threshold
      case 'lte':
        return value <= threshold.threshold
      case 'eq':
        return value === threshold.threshold
      default:
        return false
    }
  }
}
