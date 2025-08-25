import { NextRequest, NextResponse } from 'next/server'
import type { AuthHelpers, DatabaseHelpers, Logger, PluginConfig, RouteHandler } from '../../../../src/lib/plugins/types'

interface RouteDependencies {
  db: DatabaseHelpers
  logger: Logger
  auth: AuthHelpers
  config: PluginConfig
}

export function createAdminRoutes({ db, logger, auth, config }: RouteDependencies): Record<string, RouteHandler> {
  return {
    'GET:/': auth.requireAuth(
      auth.withRoles(['admin'])(async (request: NextRequest) => {
        logger.info('todo-list admin index route accessed')
        
        return NextResponse.json({
          message: 'Todo List Admin Dashboard',
          plugin: 'todo-list',
          config
        })
      })
    ),

    'GET:/settings': auth.requireAuth(
      auth.withRoles(['admin'])(async (request: NextRequest) => {
        logger.info('todo-list admin settings route accessed')
        
        return NextResponse.json({
          message: 'Todo List Settings',
          plugin: 'todo-list',
          settings: {
            // Add your settings here
          }
        })
      })
    ),

    'POST:/settings': auth.requireAuth(
      auth.withRoles(['admin'])(async (request: NextRequest) => {
        try {
          const settings = await request.json()
          logger.info({ settings }, 'Updating todo-list settings')
          
          // Implement your settings update logic here
          
          return NextResponse.json({
            message: 'Settings updated successfully',
            plugin: 'todo-list'
          })
        } catch (error) {
          logger.error({ error }, 'Error updating todo-list settings')
          return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
          )
        }
      })
    )
  }
}
