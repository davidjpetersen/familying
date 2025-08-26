import { NextRequest, NextResponse } from 'next/server'
import type { AuthHelpers, DatabaseHelpers, Logger, RouteHandler } from '../../../../src/lib/plugins/types'

interface RouteDependencies {
  db: DatabaseHelpers
  logger: Logger
  auth: AuthHelpers
}

export function createApiRoutes({ db, logger, auth }: RouteDependencies): Record<string, RouteHandler> {
  return {
    // Get all published soundscapes for public access
    'GET:/soundscapes': async (request: NextRequest) => {
      try {
        const url = new URL(request.url)
        const category = url.searchParams.get('category')
        
        const operation = {
          table: 'soundscapes',
          operation: 'select' as const,
          columns: ['*'],
          where: {
            is_published: true,
            ...(category && { category })
          }
        }
        
        let data
        try {
          data = await db.query(operation, {
            orderBy: { column: 'sort_order', ascending: true }
          })
        } catch (dbError) {
          // If table doesn't exist, return sample data
          logger.warn('Soundscapes table not found, returning sample data')
          data = [
            {
              id: 'sample-1',
              title: 'Ocean Waves',
              description: 'Gentle ocean waves for relaxation',
              category: 'Sleep',
              audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              thumbnail_url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=300&h=200&fit=crop',
              is_published: true,
              sort_order: 1,
              duration_seconds: 3600,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'sample-2',
              title: 'Forest Rain',
              description: 'Peaceful forest sounds with light rain',
              category: 'Nature',
              audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              thumbnail_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
              is_published: true,
              sort_order: 2,
              duration_seconds: 2400,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'sample-3',
              title: 'White Noise',
              description: 'Pure white noise for concentration',
              category: 'Focus',
              audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              thumbnail_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
              is_published: true,
              sort_order: 3,
              duration_seconds: 1800,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ].filter(item => !category || item.category === category)
        }
        
        return NextResponse.json({
          success: true,
          data,
          categories: ['Sleep', 'Nature', 'White Noise', 'Focus']
        })
      } catch (error) {
        logger.error(`Error fetching soundscapes: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch soundscapes' },
          { status: 500 }
        )
      }
    },

    // Get specific soundscape by ID
    'GET:/soundscapes/:id': async (request: NextRequest, { params }: { params: Record<string, string> }) => {
      try {
        const data = await db.query({
          table: 'soundscapes',
          operation: 'select',
          where: { id: params.id, is_published: true }
        })
        
        if (!data || data.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Soundscape not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({
          success: true,
          data: data[0]
        })
      } catch (error) {
        logger.error(`Error fetching soundscape: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch soundscape' },
          { status: 500 }
        )
      }
    },

    // Admin API routes
    'GET:/admin/soundscapes': auth.requireAuth(auth.withRoles(['super_admin', 'admin'])(async (request: NextRequest) => {
      try {
        let data
        try {
          data = await db.query({
            table: 'soundscapes',
            operation: 'select'
          }, {
            orderBy: { column: 'sort_order', ascending: true }
          })
        } catch (dbError) {
          // If table doesn't exist, return sample data
          logger.warn('Soundscapes table not found, returning sample admin data')
          data = [
            {
              id: 'sample-1',
              title: 'Ocean Waves',
              description: 'Gentle ocean waves for relaxation',
              category: 'Sleep',
              audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              thumbnail_url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=300&h=200&fit=crop',
              is_published: true,
              sort_order: 1,
              duration_seconds: 3600,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'sample-2',
              title: 'Forest Rain',
              description: 'Peaceful forest sounds with light rain',
              category: 'Nature',
              audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              thumbnail_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
              is_published: true,
              sort_order: 2,
              duration_seconds: 2400,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'sample-3',
              title: 'White Noise',
              description: 'Pure white noise for concentration',
              category: 'Focus',
              audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              thumbnail_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
              is_published: true,
              sort_order: 3,
              duration_seconds: 1800,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
        }
        
        return NextResponse.json({
          success: true,
          data
        })
      } catch (error) {
        logger.error(`Error fetching soundscapes for admin: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch soundscapes' },
          { status: 500 }
        )
      }
    })),

    // Create new soundscape (admin only)
    'POST:/admin/soundscapes': auth.requireAuth(auth.withRoles(['super_admin', 'admin'])(async (request: NextRequest) => {
      try {
        const body = await request.json()
        const { title, description, category, audio_url, thumbnail_url, is_published = true, sort_order = 0, duration_seconds } = body
        
        // Validate required fields
        if (!title || !audio_url || !thumbnail_url || !category) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          )
        }

        const data = await db.query({
          table: 'soundscapes',
          operation: 'insert',
          data: {
            title, 
            description, 
            category, 
            audio_url, 
            thumbnail_url, 
            is_published, 
            sort_order, 
            duration_seconds
          }
        })
        
        logger.info(`Created soundscape: ${title}`)
        
        return NextResponse.json({
          success: true,
          data: data[0]
        })
      } catch (error) {
        logger.error(`Error creating soundscape: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return NextResponse.json(
          { success: false, error: 'Failed to create soundscape' },
          { status: 500 }
        )
      }
    })),

    // Update soundscape (admin only)
    'PUT:/admin/soundscapes/:id': auth.requireAuth(auth.withRoles(['super_admin', 'admin'])(async (request: NextRequest, { params }: { params: Record<string, string> }) => {
      try {
        const body = await request.json()
        const { title, description, category, audio_url, thumbnail_url, is_published, sort_order, duration_seconds } = body
        
        const data = await db.query({
          table: 'soundscapes',
          operation: 'update',
          where: { id: params.id },
          data: {
            title, 
            description, 
            category, 
            audio_url, 
            thumbnail_url, 
            is_published, 
            sort_order, 
            duration_seconds,
            updated_at: new Date().toISOString()
          }
        })
        
        if (!data || data.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Soundscape not found' },
            { status: 404 }
          )
        }
        
        logger.info(`Updated soundscape: ${params.id}`)
        
        return NextResponse.json({
          success: true,
          data: data[0]
        })
      } catch (error) {
        logger.error(`Error updating soundscape: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return NextResponse.json(
          { success: false, error: 'Failed to update soundscape' },
          { status: 500 }
        )
      }
    })),

    // Delete soundscape (admin only)
    'DELETE:/admin/soundscapes/:id': auth.requireAuth(auth.withRoles(['super_admin', 'admin'])(async (request: NextRequest, { params }: { params: Record<string, string> }) => {
      try {
        const data = await db.query({
          table: 'soundscapes',
          operation: 'delete',
          where: { id: params.id }
        })
        
        if (!data || data.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Soundscape not found' },
            { status: 404 }
          )
        }
        
        logger.info(`Deleted soundscape: ${params.id}`)
        
        return NextResponse.json({
          success: true,
          message: 'Soundscape deleted successfully'
        })
      } catch (error) {
        logger.error(`Error deleting soundscape: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return NextResponse.json(
          { success: false, error: 'Failed to delete soundscape' },
          { status: 500 }
        )
      }
    }))
  }
}
