/**
 * Enhanced logging system for production readiness
 * Provides structured logging, correlation IDs, and observability
 */

import { config } from '../config'

// Log levels enum
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Structured log entry interface
export interface LogEntry {
  timestamp: string
  level: string
  message: string
  correlationId?: string
  userId?: string
  operation?: string
  component: string
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    duration: number
    memory?: number
    query?: string
  }
}

// Logger interface
export interface Logger {
  error(message: string, metadata?: any): void
  warn(message: string, metadata?: any): void
  info(message: string, metadata?: any): void
  debug(message: string, metadata?: any): void
  
  // Specialized logging methods
  logError(error: Error, context?: any): void
  logPerformance(operation: string, duration: number, metadata?: any): void
  logSecurity(event: string, metadata?: any): void
  logDatabase(query: string, duration: number, metadata?: any): void
  
  // Context management
  withContext(context: Partial<LogEntry>): Logger
  child(metadata: Record<string, any>): Logger
}

// Context manager for correlation tracking
class LogContext {
  private static contexts = new Map<string, Partial<LogEntry>>()
  
  static set(correlationId: string, context: Partial<LogEntry>): void {
    this.contexts.set(correlationId, context)
  }
  
  static get(correlationId: string): Partial<LogEntry> | undefined {
    return this.contexts.get(correlationId)
  }
  
  static clear(correlationId: string): void {
    this.contexts.delete(correlationId)
  }
  
  static cleanup(): void {
    // Clean up old contexts (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000
    for (const [id, context] of this.contexts.entries()) {
      if (context.timestamp && new Date(context.timestamp).getTime() < oneHourAgo) {
        this.contexts.delete(id)
      }
    }
  }
}

// Enhanced logger implementation
export class SoundscapesLogger implements Logger {
  private context: Partial<LogEntry>
  private component: string

  constructor(component: string = 'soundscapes', context: Partial<LogEntry> = {}) {
    this.component = component
    this.context = context
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    const configLevel = this.getLogLevel(config.logging.level)
    
    if (level > configLevel) {
      return // Skip if below configured log level
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      component: this.component,
      ...this.context,
      ...(metadata && { metadata }),
    }

    // Add correlation context if available
    if (this.context.correlationId) {
      const correlationContext = LogContext.get(this.context.correlationId)
      if (correlationContext) {
        Object.assign(entry, correlationContext)
      }
    }

    if (config.logging.structured) {
      this.outputStructured(entry)
    } else {
      this.outputSimple(level, message, metadata)
    }

    // Send to external monitoring if configured
    this.sendToMonitoring(entry)
  }

  private getLogLevel(levelStr: string): LogLevel {
    switch (levelStr.toLowerCase()) {
      case 'error': return LogLevel.ERROR
      case 'warn': return LogLevel.WARN
      case 'info': return LogLevel.INFO
      case 'debug': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }

  private outputStructured(entry: LogEntry): void {
    const output = JSON.stringify(entry)
    
    switch (entry.level) {
      case 'ERROR':
        console.error(output)
        break
      case 'WARN':
        console.warn(output)
        break
      case 'DEBUG':
        console.debug(output)
        break
      default:
        console.log(output)
    }
  }

  private outputSimple(level: LogLevel, message: string, metadata?: any): void {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${LogLevel[level]}] [${this.component}]`
    const output = metadata ? `${prefix} ${message} ${JSON.stringify(metadata)}` : `${prefix} ${message}`
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(output)
        break
      case LogLevel.WARN:
        console.warn(output)
        break
      case LogLevel.DEBUG:
        console.debug(output)
        break
      default:
        console.log(output)
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // In production, send to monitoring service (e.g., DataDog, New Relic, etc.)
    if (config.isProduction && config.monitoring.enabled) {
      // TODO: Implement external monitoring integration
      // Example: datadog.log(entry) or newrelic.recordCustomEvent(entry)
    }
  }

  // Public interface methods
  error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata)
  }

  warn(message: string, metadata?: any): void {
    this.log(LogLevel.WARN, message, metadata)
  }

  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata)
  }

  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  logError(error: Error, context?: any): void {
    const errorEntry: any = {
      name: error.name,
      message: error.message,
    }
    
    if (config.logging.includeStackTrace) {
      errorEntry.stack = error.stack
    }
    
    if (error.cause) {
      errorEntry.code = String(error.cause)
    }
    
    const entry = {
      error: errorEntry,
      ...(context && { metadata: context }),
    }
    
    this.log(LogLevel.ERROR, `Error occurred: ${error.message}`, entry)
  }

  logPerformance(operation: string, duration: number, metadata?: any): void {
    const performanceData = {
      performance: {
        duration,
        memory: process.memoryUsage().heapUsed,
        ...(metadata?.query && { query: metadata.query }),
      },
      operation,
      ...(metadata && { metadata }),
    }

    const level = duration > config.monitoring.slowQueryThreshold 
      ? LogLevel.WARN 
      : LogLevel.INFO

    this.log(level, `Operation ${operation} completed in ${duration}ms`, performanceData)
  }

  logSecurity(event: string, metadata?: any): void {
    this.log(LogLevel.WARN, `Security event: ${event}`, {
      security: true,
      event,
      ...(metadata && { metadata }),
    })
  }

  logDatabase(query: string, duration: number, metadata?: any): void {
    this.logPerformance('database_query', duration, {
      query: query.substring(0, 200), // Truncate long queries
      ...(metadata && { metadata }),
    })
  }

  withContext(context: Partial<LogEntry>): Logger {
    return new SoundscapesLogger(this.component, { ...this.context, ...context })
  }

  child(metadata: Record<string, any>): Logger {
    return new SoundscapesLogger(this.component, {
      ...this.context,
      metadata: { ...this.context.metadata, ...metadata },
    })
  }
}

// Global logger instance
let globalLogger: Logger | null = null

export function getLogger(component: string = 'soundscapes'): Logger {
  return new SoundscapesLogger(component)
}

export function setGlobalLogger(logger: Logger): void {
  globalLogger = logger
}

export function logger(): Logger {
  if (!globalLogger) {
    globalLogger = new SoundscapesLogger()
  }
  return globalLogger
}

// Utility functions for request correlation
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function setRequestContext(correlationId: string, userId?: string, operation?: string): void {
  LogContext.set(correlationId, {
    correlationId,
    userId,
    operation,
    timestamp: new Date().toISOString(),
  })
}

export function clearRequestContext(correlationId: string): void {
  LogContext.clear(correlationId)
}

// Cleanup task for memory management
setInterval(() => {
  LogContext.cleanup()
}, 3600000) // Run every hour

export default logger
