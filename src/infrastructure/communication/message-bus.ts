import { CircuitBreaker, CircuitBreakerManager } from './circuit-breaker'
import { BaseDomainEvent } from '../../domain/events/domain-events'

/**
 * Plugin message interface
 */
export interface PluginMessage {
  readonly id: string
  readonly from: string              // Source plugin ID
  readonly to: string               // Target plugin ID
  readonly type: string             // Message type
  readonly payload: any             // Message data
  readonly timestamp: number
  readonly correlationId?: string   // For request tracing
  readonly traceId?: string        // Distributed tracing
  readonly priority?: MessagePriority
  readonly ttl?: number            // Time to live in milliseconds
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Message handler interface
 */
export interface MessageHandler {
  handle(message: PluginMessage): Promise<void>
  canHandle(messageType: string): boolean
  getHandlerInfo(): MessageHandlerInfo
}

/**
 * Message handler information
 */
export interface MessageHandlerInfo {
  readonly handlerName: string
  readonly supportedMessageTypes: string[]
  readonly maxProcessingTime: number
}

/**
 * Message delivery result
 */
export interface MessageDeliveryResult {
  readonly success: boolean
  readonly messageId: string
  readonly deliveredAt: Date
  readonly processingTime: number
  readonly error?: Error
}

/**
 * Dead letter queue entry
 */
export interface DeadLetterEntry {
  readonly message: PluginMessage
  readonly error: Error
  readonly attemptCount: number
  readonly lastAttempt: Date
  readonly originalTimestamp: Date
}

/**
 * Plugin registry interface
 */
export interface PluginRegistry {
  getPlugin(pluginId: string): Promise<PluginInfo | null>
}

/**
 * Plugin information
 */
export interface PluginInfo {
  readonly id: string
  readonly name: string
  readonly permissions: PluginPermissions
}

/**
 * Plugin permissions
 */
export interface PluginPermissions {
  readonly communication: {
    readonly allowedTargets: string[]
    readonly allowedMessageTypes: string[]
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PermissionDeniedError'
  }
}

/**
 * Invalid plugin error
 */
export class InvalidPluginError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidPluginError'
  }
}

/**
 * Message timeout error
 */
export class MessageTimeoutError extends Error {
  constructor(messageId: string, timeout: number) {
    super(`Message ${messageId} timed out after ${timeout}ms`)
    this.name = 'MessageTimeoutError'
  }
}

/**
 * Message bus events
 */
export class MessageSentEvent extends BaseDomainEvent {
  constructor(
    public readonly message: PluginMessage
  ) {
    super(message.from, 'MessageSent')
  }
}

export class MessageDeliveredEvent extends BaseDomainEvent {
  constructor(
    public readonly message: PluginMessage,
    public readonly result: MessageDeliveryResult
  ) {
    super(message.to, 'MessageDelivered')
  }
}

export class MessageFailedEvent extends BaseDomainEvent {
  constructor(
    public readonly message: PluginMessage,
    public readonly error: Error
  ) {
    super(message.to, 'MessageFailed')
  }
}

/**
 * Inter-plugin message bus for async communication
 */
export class InterPluginMessageBus {
  private subscribers = new Map<string, MessageHandler[]>()
  private circuitBreakerManager: CircuitBreakerManager
  private deadLetterQueue: DeadLetterEntry[] = []
  private messageMetrics = new Map<string, MessageMetrics>()

  constructor(
    private readonly pluginRegistry: PluginRegistry,
    private readonly eventBus: any // EventBus type
  ) {
    this.circuitBreakerManager = new CircuitBreakerManager({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000 // 30 seconds
    })
  }

  /**
   * Publish a message to target plugin
   */
  async publish(message: PluginMessage): Promise<MessageDeliveryResult> {
    const startTime = Date.now()

    try {
      // Validate sender permissions
      await this.validateSenderPermissions(message.from, message.to, message.type)
      
      // Add tracing information
      const tracedMessage: PluginMessage = {
        ...message,
        id: message.id || this.generateMessageId(),
        timestamp: Date.now(),
        traceId: message.traceId || this.generateTraceId()
      }

      // Check TTL
      if (this.isMessageExpired(tracedMessage)) {
        throw new MessageTimeoutError(tracedMessage.id, tracedMessage.ttl!)
      }

      // Route message through circuit breaker
      const circuitBreaker = this.circuitBreakerManager.getCircuitBreaker(message.to)
      
      const result = await circuitBreaker.execute(async () => {
        return await this.deliverMessage(tracedMessage)
      })

      // Emit success event
      await this.eventBus.publish(new MessageSentEvent(tracedMessage))
      await this.eventBus.publish(new MessageDeliveredEvent(tracedMessage, result))

      // Update metrics
      this.updateMessageMetrics(message.type, Date.now() - startTime, true)

      return result

    } catch (error) {
      const processingTime = Date.now() - startTime
      const deliveryResult: MessageDeliveryResult = {
        success: false,
        messageId: message.id,
        deliveredAt: new Date(),
        processingTime,
        error: error instanceof Error ? error : new Error(String(error))
      }

      // Send to dead letter queue for retry
      await this.sendToDeadLetterQueue(message, deliveryResult.error!)

      // Emit failure event
      await this.eventBus.publish(new MessageFailedEvent(message, deliveryResult.error!))

      // Update metrics
      this.updateMessageMetrics(message.type, processingTime, false)

      return deliveryResult
    }
  }

  /**
   * Subscribe to messages of a specific type
   */
  async subscribe(
    pluginId: string,
    messageType: string,
    handler: MessageHandler
  ): Promise<void> {
    const key = `${pluginId}:${messageType}`
    const handlers = this.subscribers.get(key) || []
    handlers.push(handler)
    this.subscribers.set(key, handlers)

    console.log(`Plugin ${pluginId} subscribed to message type: ${messageType}`)
  }

  /**
   * Unsubscribe from messages
   */
  async unsubscribe(
    pluginId: string,
    messageType: string,
    handler: MessageHandler
  ): Promise<void> {
    const key = `${pluginId}:${messageType}`
    const handlers = this.subscribers.get(key) || []
    const index = handlers.indexOf(handler)
    
    if (index > -1) {
      handlers.splice(index, 1)
      if (handlers.length === 0) {
        this.subscribers.delete(key)
      } else {
        this.subscribers.set(key, handlers)
      }
    }
  }

  /**
   * Get dead letter queue entries
   */
  getDeadLetterQueue(): DeadLetterEntry[] {
    return [...this.deadLetterQueue]
  }

  /**
   * Retry messages from dead letter queue
   */
  async retryDeadLetterMessages(maxRetries: number = 10): Promise<void> {
    const messagesToRetry = this.deadLetterQueue.splice(0, maxRetries)
    
    for (const entry of messagesToRetry) {
      try {
        await this.publish(entry.message)
      } catch (error) {
        // Put back in dead letter queue with incremented attempt count
        this.deadLetterQueue.push({
          ...entry,
          attemptCount: entry.attemptCount + 1,
          lastAttempt: new Date()
        })
      }
    }
  }

  /**
   * Get message metrics
   */
  getMessageMetrics(): Map<string, MessageMetrics> {
    return new Map(this.messageMetrics)
  }

  /**
   * Deliver message to handlers
   */
  private async deliverMessage(message: PluginMessage): Promise<MessageDeliveryResult> {
    const key = `${message.to}:${message.type}`
    const handlers = this.subscribers.get(key) || []

    if (handlers.length === 0) {
      throw new Error(`No handlers found for message type ${message.type} on plugin ${message.to}`)
    }

    const startTime = Date.now()
    const results = await Promise.allSettled(
      handlers.map(handler => 
        this.executeWithTimeout(
          () => handler.handle(message),
          5000 // 5 second timeout
        )
      )
    )

    // Check if any handler succeeded
    const hasSuccess = results.some(result => result.status === 'fulfilled')
    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason)

    if (!hasSuccess && errors.length > 0) {
      throw new Error(`All handlers failed: ${errors.map(e => e.message).join(', ')}`)
    }

    return {
      success: true,
      messageId: message.id,
      deliveredAt: new Date(),
      processingTime: Date.now() - startTime
    }
  }

  /**
   * Validate sender permissions
   */
  private async validateSenderPermissions(
    from: string,
    to: string,
    messageType: string
  ): Promise<void> {
    const fromPlugin = await this.pluginRegistry.getPlugin(from)
    const toPlugin = await this.pluginRegistry.getPlugin(to)

    if (!fromPlugin || !toPlugin) {
      throw new InvalidPluginError('Plugin not found')
    }

    // Check if 'from' plugin has permission to message 'to' plugin
    const hasTargetPermission = fromPlugin.permissions.communication
      .allowedTargets.includes(to) || fromPlugin.permissions.communication
      .allowedTargets.includes('*')

    if (!hasTargetPermission) {
      throw new PermissionDeniedError(
        `Plugin ${from} cannot message plugin ${to}`
      )
    }

    // Check message type permission
    const hasTypePermission = fromPlugin.permissions.communication
      .allowedMessageTypes.includes(messageType) || fromPlugin.permissions.communication
      .allowedMessageTypes.includes('*')

    if (!hasTypePermission) {
      throw new PermissionDeniedError(
        `Plugin ${from} cannot send message type ${messageType}`
      )
    }
  }

  /**
   * Send message to dead letter queue
   */
  private async sendToDeadLetterQueue(
    message: PluginMessage,
    error: Error
  ): Promise<void> {
    const entry: DeadLetterEntry = {
      message,
      error,
      attemptCount: 1,
      lastAttempt: new Date(),
      originalTimestamp: new Date(message.timestamp)
    }

    this.deadLetterQueue.push(entry)

    // Limit dead letter queue size
    if (this.deadLetterQueue.length > 1000) {
      this.deadLetterQueue.shift()
    }

    console.warn(`Message ${message.id} sent to dead letter queue:`, error.message)
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ])
  }

  /**
   * Check if message has expired
   */
  private isMessageExpired(message: PluginMessage): boolean {
    if (!message.ttl) return false
    return Date.now() - message.timestamp > message.ttl
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }

  /**
   * Update message metrics
   */
  private updateMessageMetrics(
    messageType: string,
    processingTime: number,
    success: boolean
  ): void {
    const current = this.messageMetrics.get(messageType) || {
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0
    }

    const updated: MessageMetrics = {
      totalCount: current.totalCount + 1,
      successCount: current.successCount + (success ? 1 : 0),
      errorCount: current.errorCount + (success ? 0 : 1),
      totalProcessingTime: current.totalProcessingTime + processingTime,
      averageProcessingTime: (current.totalProcessingTime + processingTime) / (current.totalCount + 1)
    }

    this.messageMetrics.set(messageType, updated)
  }
}

/**
 * Message metrics interface
 */
interface MessageMetrics {
  totalCount: number
  successCount: number
  errorCount: number
  averageProcessingTime: number
  totalProcessingTime: number
}
