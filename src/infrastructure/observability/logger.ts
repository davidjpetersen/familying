/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * Log context interface
 */
export interface LogContext {
  readonly traceId?: string
  readonly spanId?: string
  readonly pluginId?: string
  readonly correlationId?: string
  readonly userId?: string
  readonly operation?: string
  readonly requestId?: string
  readonly sessionId?: string
}

/**
 * Log entry interface
 */
export interface LogEntry {
  readonly timestamp: string
  readonly level: LogLevel
  readonly message: string
  readonly context: LogContext
  readonly data?: any
  readonly service: string
  readonly version?: string
  readonly environment?: string
  readonly hostname?: string
}

/**
 * Log output interface
 */
export interface LogOutput {
  write(entry: LogEntry): void
  flush?(): Promise<void>
  close?(): Promise<void>
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  readonly level: LogLevel
  readonly outputs: LogOutput[]
  readonly enableConsole: boolean
  readonly enableStructured: boolean
  readonly sensitiveFields: string[]
  readonly maxDataSize: number
  readonly bufferSize?: number
}

/**
 * Console log output
 */
export class ConsoleLogOutput implements LogOutput {
  write(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const contextStr = this.formatContext(entry.context)
    const message = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message} ${contextStr}`
    
    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data)
        break
      case 'info':
        console.info(message, entry.data)
        break
      case 'warn':
        console.warn(message, entry.data)
        break
      case 'error':
      case 'fatal':
        console.error(message, entry.data)
        break
    }
  }

  private formatContext(context: LogContext): string {
    const parts: string[] = []
    
    if (context.pluginId) parts.push(`plugin=${context.pluginId}`)
    if (context.operation) parts.push(`op=${context.operation}`)
    if (context.traceId) parts.push(`trace=${context.traceId.substring(0, 8)}`)
    if (context.userId) parts.push(`user=${context.userId}`)
    
    return parts.length > 0 ? `[${parts.join(' ')}]` : ''
  }
}

/**
 * JSON log output for structured logging
 */
export class JsonLogOutput implements LogOutput {
  write(entry: LogEntry): void {
    console.log(JSON.stringify(entry))
  }
}

/**
 * File log output
 */
export class FileLogOutput implements LogOutput {
  private buffer: LogEntry[] = []
  private flushTimer?: NodeJS.Timeout

  constructor(
    private readonly filename: string,
    private readonly bufferSize: number = 100,
    private readonly flushInterval: number = 5000 // 5 seconds
  ) {
    this.scheduleFlush()
  }

  write(entry: LogEntry): void {
    this.buffer.push(entry)
    
    if (this.buffer.length >= this.bufferSize) {
      this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const entries = this.buffer.splice(0)
    const content = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n'
    
    try {
      // In a real implementation, you'd use fs.appendFile
      console.log(`Writing ${entries.length} log entries to ${this.filename}`)
    } catch (error) {
      console.error('Failed to write log entries:', error)
      // Put entries back in buffer for retry
      this.buffer.unshift(...entries)
    }
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    await this.flush()
  }

  private scheduleFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        console.error('Failed to flush log buffer:', error)
      })
    }, this.flushInterval)
  }
}

/**
 * Structured logger with correlation support
 */
export class StructuredLogger {
  private readonly sensitiveFields: Set<string>

  constructor(
    private readonly config: LoggingConfig,
    private readonly context: LogContext = {}
  ) {
    this.sensitiveFields = new Set(config.sensitiveFields)
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, context?: Partial<LogContext>): void {
    this.log('info', message, data, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, context?: Partial<LogContext>): void {
    this.log('warn', message, data, context)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof Error && 'cause' in error && { cause: error.cause })
    } : undefined

    this.log('error', message, errorData, context)
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, context?: Partial<LogContext>): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, data, context)
    }
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error, context?: Partial<LogContext>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined

    this.log('fatal', message, errorData, context)
  }

  /**
   * Create child logger with additional context
   */
  createChildLogger(context: Partial<LogContext>): StructuredLogger {
    return new StructuredLogger(this.config, { ...this.context, ...context })
  }

  /**
   * Create logger for specific plugin
   */
  forPlugin(pluginId: string, operation?: string): StructuredLogger {
    return this.createChildLogger({ pluginId, operation })
  }

  /**
   * Create logger with trace context
   */
  withTrace(traceId: string, spanId?: string): StructuredLogger {
    return this.createChildLogger({ traceId, spanId })
  }

  /**
   * Create logger with correlation ID
   */
  withCorrelation(correlationId: string): StructuredLogger {
    return this.createChildLogger({ correlationId })
  }

  /**
   * Create logger with user context
   */
  withUser(userId: string): StructuredLogger {
    return this.createChildLogger({ userId })
  }

  /**
   * Log performance metrics
   */
  performance(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
    context?: Partial<LogContext>
  ): void {
    this.info('Performance metric', {
      operation,
      duration,
      unit: 'ms',
      ...metadata
    }, context)
  }

  /**
   * Log audit event
   */
  audit(
    action: string,
    resource: string,
    outcome: 'success' | 'failure',
    metadata?: Record<string, unknown>,
    context?: Partial<LogContext>
  ): void {
    this.info('Audit event', {
      action,
      resource,
      outcome,
      ...metadata
    }, { ...context, operation: 'audit' })
  }

  /**
   * Main logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: any,
    additionalContext?: Partial<LogContext>
  ): void {
    if (!this.shouldLog(level)) return

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
      data: this.sanitizeData(data),
      service: 'familying-plugins',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      hostname: this.getHostname()
    }

    // Send to configured outputs
    this.config.outputs.forEach(output => {
      try {
        output.write(logEntry)
      } catch (error) {
        console.error('Failed to write to log output:', error)
      }
    })
  }

  /**
   * Check if message should be logged based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4
    }

    return levels[level] >= levels[this.config.level]
  }

  /**
   * Sanitize log data to remove sensitive information
   */
  private sanitizeData(data: any): any {
    if (!data) return data

    if (typeof data !== 'object') return data

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item))
    }

    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (this.sensitiveFields.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value)
      } else {
        sanitized[key] = value
      }
    }

    // Limit data size to prevent large log entries
    const stringified = JSON.stringify(sanitized)
    if (stringified.length > this.config.maxDataSize) {
      return {
        ...sanitized,
        _truncated: true,
        _originalSize: stringified.length,
        _maxSize: this.config.maxDataSize
      }
    }

    return sanitized
  }

  /**
   * Get hostname for log entries
   */
  private getHostname(): string {
    try {
      return require('os').hostname()
    } catch {
      return 'unknown'
    }
  }
}

/**
 * Logger factory for creating configured loggers
 */
export class LoggerFactory {
  private static instance: LoggerFactory
  private config: LoggingConfig

  private constructor() {
    this.config = this.createDefaultConfig()
  }

  static getInstance(): LoggerFactory {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new LoggerFactory()
    }
    return LoggerFactory.instance
  }

  /**
   * Configure the logger factory
   */
  configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Create a new logger instance
   */
  createLogger(context?: LogContext): StructuredLogger {
    return new StructuredLogger(this.config, context)
  }

  /**
   * Create logger for specific plugin
   */
  createPluginLogger(pluginId: string): StructuredLogger {
    return this.createLogger({ pluginId })
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config }
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): LoggingConfig {
    const outputs: LogOutput[] = []
    
    if (process.env.NODE_ENV === 'development') {
      outputs.push(new ConsoleLogOutput())
    } else {
      outputs.push(new JsonLogOutput())
    }

    return {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      outputs,
      enableConsole: true,
      enableStructured: true,
      sensitiveFields: [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'cookie',
        'session',
        'credit_card',
        'ssn',
        'social_security'
      ],
      maxDataSize: 10240 // 10KB
    }
  }
}

/**
 * Default logger instance
 */
export const logger = LoggerFactory.getInstance().createLogger()

/**
 * Create logger with context
 */
export function createLogger(context?: LogContext): StructuredLogger {
  return LoggerFactory.getInstance().createLogger(context)
}
