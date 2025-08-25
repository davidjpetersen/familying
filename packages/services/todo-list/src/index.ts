import type { PluginContext, PluginRoutes } from '../../../../src/lib/plugins/types'
import { createUserRoutes } from './routes.user'
import { createAdminRoutes } from './routes.admin'

export async function register(ctx: PluginContext): Promise<PluginRoutes> {
  const { logger, auth, db, config } = ctx

  logger.info('Registering todo-list plugin')

  // Initialize any services here
  
  return {
    user: createUserRoutes({ db, logger, auth }),
    admin: createAdminRoutes({ db, logger, auth, config })
  }
}

export async function deregister(ctx: PluginContext): Promise<void> {
  const { logger } = ctx
  
  // Clean up any resources here
  logger.info('Deregistering todo-list plugin')
}
