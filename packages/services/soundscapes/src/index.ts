import type { PluginContext, PluginRoutes } from '../../../../src/lib/plugins/types'
import { NextResponse } from 'next/server'

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
  const { logger } = ctx

  logger.info('Registering soundscapes plugin')

  return {
    user: {},
    admin: {},
    api: {
      'GET:/data': async (request, context) => {
        try {
          // Filter to only published soundscapes for users
          const publishedSoundscapes = sampleSoundscapes.filter(s => s.is_published)
          
          return NextResponse.json({
            success: true,
            data: publishedSoundscapes.sort((a, b) => a.sort_order - b.sort_order)
          })
        } catch (error) {
          console.error('Error fetching soundscapes:', error)
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch soundscapes'
          }, { status: 500 })
        }
      }
    }
  }
}

export async function deregister(ctx: PluginContext): Promise<void> {
  const { logger } = ctx
  logger.info('Deregistering soundscapes plugin')
}
