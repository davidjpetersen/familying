import type { PluginContext, PluginRoutes } from '../../../../src/lib/plugins/types'

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
  const { logger } = ctx

  logger.info('Registering soundscapes plugin')

  // Temporarily return empty routes to avoid type conflicts
  // The main functionality is handled by the page component
  return {
    user: {},
    admin: {},
    api: {}
  }
}

export async function deregister(ctx: PluginContext): Promise<void> {
  const { logger } = ctx
  logger.info('Deregistering soundscapes plugin')
}
