import type { PluginContext, PluginRoutes } from '../../../../src/lib/plugins/types'
import { NextResponse } from 'next/server'
import { createSecurityMiddleware } from './security/enhanced-security'
import { getResilienceManager } from './resilience'
import { SoundscapesRepository, getDatabase } from './database/enhanced-database'
import { getLogger, generateCorrelationId, setRequestContext } from './observability/logging'
import { getHealthMonitor, runProductionReadinessChecks } from './deployment/health-monitoring'
import { 
  CreateSoundscapeSchema, 
  UpdateSoundscapeSchema, 
  IdParamSchema 
} from './validation/schemas'
import { createSuccessResponse, handleApiError } from './utils/error-handling'
import { config } from './config'

// Define the Soundscape interface for TypeScript
export interface Soundscape {
  id: string
  title: string
  description?: string
  category: 'Sleep' | 'Nature' | 'White Noise' | 'Focus'
  audio_url: string
  thumbnail_url: string
  is_published: boolean
  sort_order: number
  duration_seconds?: number
  created_at: string
  updated_at: string
}

// Sample soundscapes data
const sampleSoundscapes: Soundscape[] = [
  {
    id: '1',
    title: 'Ocean Waves',
    description: 'Peaceful ocean sounds for deep relaxation',
    category: 'Nature',
    audio_url: 'https://www.soundjay.com/misc/sounds/ocean-wave-1.wav',
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    is_published: true,
    sort_order: 1,
    duration_seconds: 1800,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Forest Rain',
    description: 'Gentle rainfall in a peaceful forest',
    category: 'Nature',
    audio_url: 'https://www.soundjay.com/misc/sounds/rain-1.wav',
    thumbnail_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    is_published: true,
    sort_order: 2,
    duration_seconds: 2400,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'White Noise',
    description: 'Pure white noise for focus and concentration',
    category: 'White Noise',
    audio_url: 'https://www.soundjay.com/misc/sounds/white-noise-1.wav',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709414372-162cfbd45b3b?w=400&h=300&fit=crop',
    is_published: true,
    sort_order: 3,
    duration_seconds: 3600,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    title: 'Meditation Bells',
    description: 'Soft bells for meditation and mindfulness',
    category: 'Focus',
    audio_url: 'https://www.soundjay.com/misc/sounds/bell-1.wav',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    is_published: false,
    sort_order: 4,
    duration_seconds: 900,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export async function register(ctx: PluginContext): Promise<PluginRoutes> {
  const { logger: contextLogger, db } = ctx
  const logger = getLogger('soundscapes-plugin')
  const securityMiddleware = createSecurityMiddleware()
  const resilience = getResilienceManager()
  const repository = new SoundscapesRepository(getDatabase())

  logger.info('Registering soundscapes plugin with production features', {
    version: '1.0.0',
    environment: config.environment,
    features: config.features,
  })

  // Run production readiness checks
  if (config.isProduction) {
    const readinessChecks = runProductionReadinessChecks()
    const failures = readinessChecks.flatMap(category => 
      category.checks.filter(check => check.status === 'fail')
    )
    
    if (failures.length > 0) {
      logger.warn('Production readiness issues detected', {
        failures: failures.map(f => ({ name: f.name, message: f.message }))
      })
    } else {
      logger.info('All production readiness checks passed')
    }
  }

  return {
    user: {
      // User-facing soundscapes gallery
      'GET:/': async (request, context) => {
        const correlationId = generateCorrelationId()
        setRequestContext(correlationId, undefined, 'user:soundscapes:list')
        
        return securityMiddleware.withSecurity(
          request,
          async () => {
            return resilience.executeResilient(
              'soundscapes:user:list',
              async () => {
                const soundscapes = await repository.findAll({
                  isPublished: true,
                  limit: 50,
                  sortBy: 'sort_order',
                  sortOrder: 'asc'
                })
                
                return createSuccessResponse({
                  soundscapes,
                  total: soundscapes.length
                })
              },
              'soundscapes:list'
            )
          },
          { requireAuth: false }
        )
      }
    },
    admin: {
      // Admin soundscapes management with enhanced security and resilience
      'GET:/': async (request, context) => {
        return securityMiddleware.withSecurity(
          request,
          async () => {
            return createSuccessResponse({ message: 'Admin soundscapes interface' })
          },
          { requireAuth: true, requiredRole: 'admin' }
        )
      },
      
      'GET:/soundscapes': async (request, context) => {
        const correlationId = generateCorrelationId()
        setRequestContext(correlationId, context?.auth?.user?.id, 'admin:soundscapes:list')
        
        return securityMiddleware.withSecurity(
          request,
          async () => {
            return resilience.executeResilient(
              'soundscapes:admin:list',
              async () => {
                const url = new URL(request.url)
                const category = url.searchParams.get('category') || undefined
                const limit = parseInt(url.searchParams.get('limit') || '50')
                const offset = parseInt(url.searchParams.get('offset') || '0')
                
                const soundscapes = await repository.findAll({
                  category,
                  limit: Math.min(limit, 100), // Cap at 100
                  offset,
                  sortBy: 'sort_order',
                  sortOrder: 'asc'
                })
                
                return createSuccessResponse({
                  soundscapes,
                  pagination: {
                    limit,
                    offset,
                    total: soundscapes.length
                  }
                })
              }
            )
          },
          { requireAuth: true, requiredRole: 'admin' }
        )
      },
      
      'POST:/soundscapes': async (request, context) => {
        const correlationId = generateCorrelationId()
        setRequestContext(correlationId, context?.auth?.user?.id, 'admin:soundscapes:create')
        
        return securityMiddleware.withSecurity(
          request,
          async (req, ctx) => {
            return resilience.executeResilient(
              'soundscapes:admin:create',
              async () => {
                try {
                  const body = await req.json()
                  
                  // Validate input
                  const validationResult = CreateSoundscapeSchema.safeParse(body)
                  if (!validationResult.success) {
                    return NextResponse.json({
                      success: false,
                      error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details: validationResult.error.format()
                      }
                    }, { status: 400 })
                  }
                  
                  const soundscapeData = {
                    ...validationResult.data,
                    created_by: ctx.auth.user?.id || 'unknown'
                  }
                  
                  const newSoundscape = await repository.create(soundscapeData)
                  
                  logger.info('Soundscape created successfully', {
                    correlationId,
                    soundscapeId: newSoundscape.id,
                    title: newSoundscape.title,
                    createdBy: ctx.auth.user?.id
                  })
                  
                  return createSuccessResponse({
                    soundscape: newSoundscape,
                    message: 'Soundscape created successfully'
                  })
                } catch (error) {
                  return handleApiError(
                    error as Error,
                    '/admin/soundscapes',
                    'POST',
                    correlationId
                  )
                }
              }
            )
          },
          { requireAuth: true, requiredRole: 'admin', requiredPermissions: ['soundscapes:write'] }
        )
      },
      
      'PUT:/soundscapes/:id': async (request, context) => {
        const correlationId = generateCorrelationId()
        setRequestContext(correlationId, context?.auth?.user?.id, 'admin:soundscapes:update')
        
        return securityMiddleware.withSecurity(
          request,
          async (req, ctx) => {
            return resilience.executeResilient(
              'soundscapes:admin:update',
              async () => {
                try {
                  const id = context.params.path.split('/').pop()
                  
                  // Validate ID format
                  const idValidation = IdParamSchema.safeParse({ id })
                  if (!idValidation.success) {
                    return NextResponse.json({
                      success: false,
                      error: {
                        code: 'INVALID_INPUT',
                        message: 'Invalid soundscape ID format'
                      }
                    }, { status: 400 })
                  }
                  
                  const body = await req.json()
                  
                  // Validate input
                  const validationResult = UpdateSoundscapeSchema.safeParse(body)
                  if (!validationResult.success) {
                    return NextResponse.json({
                      success: false,
                      error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details: validationResult.error.format()
                      }
                    }, { status: 400 })
                  }
                  
                  const updateData = {
                    ...validationResult.data,
                    updated_by: ctx.auth.user?.id || 'unknown'
                  }
                  
                  const updatedSoundscape = await repository.update(id!, updateData)
                  
                  if (!updatedSoundscape) {
                    return NextResponse.json({
                      success: false,
                      error: {
                        code: 'NOT_FOUND',
                        message: 'Soundscape not found'
                      }
                    }, { status: 404 })
                  }
                  
                  logger.info('Soundscape updated successfully', {
                    correlationId,
                    soundscapeId: id,
                    updatedBy: ctx.auth.user?.id
                  })
                  
                  return createSuccessResponse({
                    soundscape: updatedSoundscape,
                    message: 'Soundscape updated successfully'
                  })
                } catch (error) {
                  return handleApiError(
                    error as Error,
                    `/admin/soundscapes/${context.params.path.split('/').pop()}`,
                    'PUT',
                    correlationId
                  )
                }
              }
            )
          },
          { requireAuth: true, requiredRole: 'admin', requiredPermissions: ['soundscapes:write'] }
        )
      },
      
      'DELETE:/soundscapes/:id': async (request, context) => {
        const correlationId = generateCorrelationId()
        setRequestContext(correlationId, context?.auth?.user?.id, 'admin:soundscapes:delete')
        
        return securityMiddleware.withSecurity(
          request,
          async (req, ctx) => {
            return resilience.executeResilient(
              'soundscapes:admin:delete',
              async () => {
                try {
                  const id = context.params.path.split('/').pop()
                  
                  // Validate ID format
                  const idValidation = IdParamSchema.safeParse({ id })
                  if (!idValidation.success) {
                    return NextResponse.json({
                      success: false,
                      error: {
                        code: 'INVALID_INPUT',
                        message: 'Invalid soundscape ID format'
                      }
                    }, { status: 400 })
                  }
                  
                  const deleted = await repository.delete(id!, ctx.auth.user?.id)
                  
                  if (!deleted) {
                    return NextResponse.json({
                      success: false,
                      error: {
                        code: 'NOT_FOUND',
                        message: 'Soundscape not found'
                      }
                    }, { status: 404 })
                  }
                  
                  logger.info('Soundscape deleted successfully', {
                    correlationId,
                    soundscapeId: id,
                    deletedBy: ctx.auth.user?.id
                  })
                  
                  return createSuccessResponse({
                    message: 'Soundscape deleted successfully'
                  })
                } catch (error) {
                  return handleApiError(
                    error as Error,
                    `/admin/soundscapes/${context.params.path.split('/').pop()}`,
                    'DELETE',
                    correlationId
                  )
                }
              }
            )
          },
          { requireAuth: true, requiredRole: 'admin', requiredPermissions: ['soundscapes:write'] }
        )
      },
      
      // Health check endpoint for monitoring
      'GET:/health': async (request, context) => {
        const correlationId = generateCorrelationId()
        
        return securityMiddleware.withSecurity(
          request,
          async () => {
            const healthMonitor = getHealthMonitor()
            const health = await healthMonitor.checkSystemHealth()
            
            const statusCode = health.status === 'healthy' ? 200 : 
                             health.status === 'degraded' ? 200 : 503
            
            return NextResponse.json(health, { status: statusCode })
          },
          { requireAuth: true, requiredRole: 'admin', skipRateLimit: true }
        )
      },
      
      // Production readiness check endpoint
      'GET:/readiness': async (request, context) => {
        return securityMiddleware.withSecurity(
          request,
          async () => {
            const checks = runProductionReadinessChecks()
            const hasFailures = checks.some(category => 
              category.checks.some(check => check.status === 'fail')
            )
            
            return NextResponse.json({
              ready: !hasFailures,
              checks,
              timestamp: new Date().toISOString()
            }, { status: hasFailures ? 500 : 200 })
          },
          { requireAuth: true, requiredRole: 'admin', skipRateLimit: true }
        )
      }
    },
    api: {
      // Public API endpoints with resilience and caching
      'GET:/soundscapes': async (request, context) => {
        const correlationId = generateCorrelationId()
        setRequestContext(correlationId, undefined, 'api:soundscapes:list')
        
        return securityMiddleware.withSecurity(
          request,
          async () => {
            return resilience.executeResilient(
              'soundscapes:api:list',
              async () => {
                const url = new URL(request.url)
                const category = url.searchParams.get('category') || undefined
                const limit = parseInt(url.searchParams.get('limit') || '20')
                const offset = parseInt(url.searchParams.get('offset') || '0')
                
                const soundscapes = await repository.findAll({
                  category,
                  isPublished: true,
                  limit: Math.min(limit, 50), // Cap at 50 for public API
                  offset,
                  sortBy: 'sort_order',
                  sortOrder: 'asc'
                })
                
                return createSuccessResponse({
                  soundscapes,
                  pagination: {
                    limit,
                    offset,
                    total: soundscapes.length,
                    hasMore: soundscapes.length === limit
                  }
                })
              },
              'soundscapes:list'
            )
          },
          { requireAuth: false }
        )
      },
      
      'GET:/soundscapes/:id': async (request, context) => {
        const correlationId = generateCorrelationId()
        setRequestContext(correlationId, undefined, 'api:soundscapes:get')
        
        return securityMiddleware.withSecurity(
          request,
          async () => {
            return resilience.executeResilient(
              'soundscapes:api:get',
              async () => {
                const id = context.params.path.split('/').pop()
                
                // Validate ID format
                const idValidation = IdParamSchema.safeParse({ id })
                if (!idValidation.success) {
                  return NextResponse.json({
                    success: false,
                    error: {
                      code: 'INVALID_INPUT',
                      message: 'Invalid soundscape ID format'
                    }
                  }, { status: 400 })
                }
                
                const soundscape = await repository.findById(id!)
                
                if (!soundscape || !soundscape.is_published) {
                  return NextResponse.json({
                    success: false,
                    error: {
                      code: 'NOT_FOUND',
                      message: 'Soundscape not found'
                    }
                  }, { status: 404 })
                }
                
                return createSuccessResponse({
                  soundscape
                })
              },
              'soundscapes:get'
            )
          },
          { requireAuth: false }
        )
      }
    }
  }
}

export async function deregister(ctx: PluginContext): Promise<void> {
  const { logger } = ctx
  logger.info('Deregistering soundscapes plugin')
}
