import type { PluginContext, PluginRoutes } from '../../../../src/lib/plugins/types'
import { createUserRoutes } from './routes.user'
import { createAdminRoutes } from './routes.admin'
import { createApiRoutes } from './routes.api'

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

export async function register(ctx: PluginContext): Promise<PluginRoutes> {
  const { logger, auth, db, config } = ctx

  logger.info('Registering soundscapes plugin')

  const userRoutes = createUserRoutes({ db, logger, auth })
  const adminRoutes = createAdminRoutes({ db, logger, auth, config })
  const apiRoutes = createApiRoutes({ db, logger, auth })

  return {
    user: userRoutes,
    admin: adminRoutes,
    api: apiRoutes
  }
}

export async function deregister(ctx: PluginContext): Promise<void> {
  const { logger } = ctx
  logger.info('Deregistering soundscapes plugin')
}
