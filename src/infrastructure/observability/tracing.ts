import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api'

/**
 * Tracing context for plugins
 */
export interface TracingContext {
  readonly traceId: string
  readonly spanId: string
  readonly createChildSpan: (name: string, attributes?: Record<string, unknown>) => SpanContext
  readonly addEvent: (name: string, attributes?: Record<string, unknown>) => void
}

/**
 * Span context for plugins
 */
export interface SpanContext {
  readonly spanId: string
  readonly addEvent: (name: string, attributes?: Record<string, unknown>) => void
  readonly setAttributes: (attributes: Record<string, unknown>) => void
  readonly end: () => void
}

/**
 * Correlation ID generator
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
}

/**
 * Distributed tracer for plugin system
 */
export class DistributedTracer {
  private tracer = trace.getTracer('familying-plugins', '1.0.0')

  /**
   * Trace plugin execution with automatic span management
   */
  async tracePluginExecution<T>(
    pluginId: string,
    operation: string,
    fn: () => Promise<T>,
    parentSpan?: Span
  ): Promise<T> {
    const span = this.tracer.startSpan(
      `plugin.${pluginId}.${operation}`,
      {
        attributes: {
          'plugin.id': pluginId,
          'plugin.operation': operation,
          'service.name': 'familying-plugin-system',
          'service.version': '1.0.0'
        }
      },
      parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined
    )

    try {
      // Add execution start event
      span.addEvent('plugin.execution.start', {
        'plugin.id': pluginId,
        'operation': operation,
        'timestamp': Date.now()
      })

      const result = await fn()
      
      span.setStatus({
        code: SpanStatusCode.OK,
        message: 'Operation completed successfully'
      })

      span.addEvent('plugin.execution.complete', {
        'plugin.id': pluginId,
        'operation': operation,
        'success': true,
        'timestamp': Date.now()
      })
      
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      
      span.recordException(error instanceof Error ? error : new Error(String(error)))
      
      span.addEvent('plugin.execution.error', {
        'plugin.id': pluginId,
        'operation': operation,
        'error.name': error instanceof Error ? error.name : 'Error',
        'error.message': error instanceof Error ? error.message : String(error),
        'timestamp': Date.now()
      })
      
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * Trace inter-plugin communication
   */
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
        'communication.direction': 'outbound',
        'service.name': 'familying-plugin-system'
      }
    })

    const correlationId = generateCorrelationId()
    
    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        span.addEvent('message.send.start', {
          'correlation.id': correlationId,
          'message.type': messageType,
          'timestamp': Date.now()
        })

        // Inject trace context into execution context
        const result = await fn()
        
        span.addEvent('message.send.complete', {
          'correlation.id': correlationId,
          'success': true,
          'timestamp': Date.now()
        })

        span.setStatus({
          code: SpanStatusCode.OK,
          message: 'Communication completed successfully'
        })
        
        return result
      } catch (error) {
        span.addEvent('message.send.error', {
          'correlation.id': correlationId,
          'error.name': error instanceof Error ? error.name : 'Error',
          'error.message': error instanceof Error ? error.message : String(error),
          'timestamp': Date.now()
        })

        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Communication failed'
        })

        span.recordException(error instanceof Error ? error : new Error(String(error)))
        throw error
      } finally {
        span.end()
      }
    })
  }

  /**
   * Create a child span for nested operations
   */
  createChildSpan(
    name: string,
    attributes?: Record<string, string | number | boolean>
  ): Span {
    return this.tracer.startSpan(name, {
      attributes: {
        'service.name': 'familying-plugin-system',
        ...attributes
      }
    })
  }

  /**
   * Create tracing context for plugins
   */
  createTracingContext(span: Span): TracingContext {
    const spanContext = span.spanContext()
    
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      createChildSpan: (name: string, attributes?: Record<string, unknown>) => {
        const childSpan = this.tracer.startSpan(name, {
          attributes: attributes as Record<string, string | number | boolean>
        }, trace.setSpan(context.active(), span))

        return {
          spanId: childSpan.spanContext().spanId,
          addEvent: (eventName: string, eventAttributes?: Record<string, unknown>) => {
            childSpan.addEvent(eventName, eventAttributes as Record<string, string | number | boolean>)
          },
          setAttributes: (spanAttributes: Record<string, unknown>) => {
            childSpan.setAttributes(spanAttributes as Record<string, string | number | boolean>)
          },
          end: () => childSpan.end()
        }
      },
      addEvent: (name: string, attributes?: Record<string, unknown>) => {
        span.addEvent(name, attributes as Record<string, string | number | boolean>)
      }
    }
  }

  /**
   * Trace service call with automatic context propagation
   */
  async traceServiceCall<T>(
    serviceName: string,
    methodName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const span = this.tracer.startSpan(`service.${serviceName}.${methodName}`, {
      attributes: {
        'service.name': serviceName,
        'service.method': methodName,
        'service.type': 'internal',
        ...metadata as Record<string, string | number | boolean>
      }
    })

    try {
      span.addEvent('service.call.start', {
        'service.name': serviceName,
        'method': methodName,
        'timestamp': Date.now()
      })

      const result = await fn()

      span.addEvent('service.call.complete', {
        'service.name': serviceName,
        'method': methodName,
        'success': true,
        'timestamp': Date.now()
      })

      span.setStatus({
        code: SpanStatusCode.OK,
        message: 'Service call completed successfully'
      })

      return result
    } catch (error) {
      span.addEvent('service.call.error', {
        'service.name': serviceName,
        'method': methodName,
        'error.name': error instanceof Error ? error.name : 'Error',
        'error.message': error instanceof Error ? error.message : String(error),
        'timestamp': Date.now()
      })

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Service call failed'
      })

      span.recordException(error instanceof Error ? error : new Error(String(error)))
      throw error
    } finally {
      span.end()
    }
  }

  /**
   * Get current active span
   */
  getCurrentSpan(): Span | undefined {
    return trace.getActiveSpan()
  }

  /**
   * Execute function within a specific span context
   */
  async withSpan<T>(span: Span, fn: () => Promise<T>): Promise<T> {
    return context.with(trace.setSpan(context.active(), span), fn)
  }

  /**
   * Create a manual span that needs to be managed by the caller
   */
  startSpan(
    name: string,
    attributes?: Record<string, string | number | boolean>,
    parentSpan?: Span
  ): Span {
    return this.tracer.startSpan(
      name,
      {
        attributes: {
          'service.name': 'familying-plugin-system',
          ...attributes
        }
      },
      parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined
    )
  }
}

/**
 * Plugin context with tracing capabilities
 */
export function createTracedPluginContext(
  baseContext: any,
  tracer: DistributedTracer,
  currentSpan?: Span
): any {
  const span = currentSpan || tracer.getCurrentSpan()
  
  if (!span) {
    return {
      ...baseContext,
      tracing: undefined
    }
  }

  return {
    ...baseContext,
    tracing: tracer.createTracingContext(span)
  }
}
