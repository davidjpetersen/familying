import { DomainEvent } from './domain-events'

/**
 * Event handler interface
 */
export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>
}

/**
 * Event bus interface
 */
export interface EventBus {
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void
  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void
  publish<T extends DomainEvent>(event: T): Promise<void>
  publishAll<T extends DomainEvent>(events: T[]): Promise<void>
}

/**
 * In-memory event bus implementation
 */
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, EventHandler<any>[]>()
  private readonly logger: Console

  constructor(logger: Console = console) {
    this.logger = logger
  }

  subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: EventHandler<T>
  ): void {
    const existing = this.handlers.get(eventType) || []
    this.handlers.set(eventType, [...existing, handler])
  }

  unsubscribe<T extends DomainEvent>(
    eventType: string, 
    handler: EventHandler<T>
  ): void {
    const existing = this.handlers.get(eventType) || []
    const filtered = existing.filter(h => h !== handler)
    
    if (filtered.length === 0) {
      this.handlers.delete(eventType)
    } else {
      this.handlers.set(eventType, filtered)
    }
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || []
    
    if (handlers.length === 0) {
      return
    }

    // Execute all handlers in parallel
    const promises = handlers.map(handler => 
      this.executeHandler(handler, event)
    )

    await Promise.allSettled(promises)
  }

  async publishAll<T extends DomainEvent>(events: T[]): Promise<void> {
    const promises = events.map(event => this.publish(event))
    await Promise.allSettled(promises)
  }

  private async executeHandler<T extends DomainEvent>(
    handler: EventHandler<T>, 
    event: T
  ): Promise<void> {
    try {
      await handler.handle(event)
    } catch (error) {
      this.logger.error('Event handler failed', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      // Don't rethrow - we don't want one handler failure to affect others
    }
  }

  // For testing purposes
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0
  }

  clear(): void {
    this.handlers.clear()
  }
}
