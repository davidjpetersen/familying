import { NextRequest, NextResponse } from 'next/server'
import { soundscapesCache, storageCache, categoriesCache } from './cache'
import { createPaginatedResponse, extractPaginationParams, applyPagination } from './pagination'
import { executeOptimizedQuery } from './query-optimization'
import { withPerformanceTracking } from './monitoring'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Enhanced soundscapes listing with performance optimizations
 */
export const optimizedSoundscapesList = withPerformanceTracking(
  async (request: NextRequest): Promise<NextResponse> => {
    const cacheKey = (() => {
      const url = new URL(request.url)
      const params = new URLSearchParams()
      
      for (const [key, value] of url.searchParams) {
        params.set(key, value)
      }
      
      return `soundscapes:list:${params.toString()}`
    })()
    
    // Check cache first
    const cached = soundscapesCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }
    
    try {
      const supabase = supabaseAdmin
      const pagination = extractPaginationParams(request)
      const url = new URL(request.url)
      
      // Extract filters
      const category = url.searchParams.get('category')
      const search = url.searchParams.get('search')
      const featured = url.searchParams.get('featured') === 'true'
      
      // Build query with optimization
      let query = supabase
        .from('soundscapes')
        .select('*', { count: 'exact' })
      
      // Apply filters
      if (category) {
        query = query.eq('category', category)
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }
      
      if (featured) {
        query = query.eq('featured', true)
      }
      
      // Apply pagination and sorting
      query = applyPagination(query, pagination, 'created_at', 'desc')
      
      const { data, error, count } = await query
      
      if (error) {
        throw error
      }
      
      // Create paginated response
      const response = createPaginatedResponse(
        data || [], 
        count || 0,
        pagination
      )
      
      // Cache the response
      soundscapesCache.set(cacheKey, response, 5 * 60 * 1000) // 5 minutes
      
      return NextResponse.json(response)
    } catch (error) {
      console.error('Error fetching soundscapes:', error)
      
      return NextResponse.json(
        { error: 'Failed to fetch soundscapes' },
        { status: 500 }
      )
    }
  }
)

/**
 * Enhanced soundscape creation with optimizations
 */
export const optimizedSoundscapeCreate = withPerformanceTracking(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      const supabase = supabaseAdmin
      const body = await request.json()
      
      // Validate required fields
      if (!body.name || !body.audio_url) {
        return NextResponse.json(
          { error: 'Name and audio_url are required' },
          { status: 400 }
        )
      }
      
      // Create soundscape with optimized query
      const result = await executeOptimizedQuery(
        supabase.from('soundscapes').insert({
          name: body.name,
          description: body.description || '',
          audio_url: body.audio_url,
          duration: body.duration || 0,
          category: body.category || 'nature',
          featured: body.featured || false,
          created_at: new Date().toISOString()
        }).select().single()
      )
      
      if (result.error) {
        return NextResponse.json(
          { error: 'Failed to create soundscape' },
          { status: 500 }
        )
      }
      
      // Invalidate related caches
      soundscapesCache.clear() // Simple cache invalidation
      categoriesCache.clear()
      
      return NextResponse.json(result.data, { status: 201 })
    } catch (error) {
      console.error('Error creating soundscape:', error)
      
      return NextResponse.json(
        { error: 'Failed to create soundscape' },
        { status: 500 }
      )
    }
  }
)

/**
 * Enhanced soundscape update with optimized queries
 */
export const optimizedSoundscapeUpdate = withPerformanceTracking(
  async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
    try {
      const supabase = supabaseAdmin
      const body = await request.json()
      const { id } = params
      
      // Optimized update query
      const result = await executeOptimizedQuery(
        supabase
          .from('soundscapes')
          .update({
            ...body,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
      )
      
      if (result.error) {
        if (result.error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Soundscape not found' },
            { status: 404 }
          )
        }
        
        throw result.error
      }
      
      // Invalidate caches
      soundscapesCache.clear()
      
      return NextResponse.json(result.data)
    } catch (error) {
      console.error('Error updating soundscape:', error)
      
      return NextResponse.json(
        { error: 'Failed to update soundscape' },
        { status: 500 }
      )
    }
  }
)

/**
 * Enhanced soundscape deletion with cleanup
 */
export const optimizedSoundscapeDelete = withPerformanceTracking(
  async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
    try {
      const supabase = supabaseAdmin
      const { id } = params
      
      // Check if soundscape exists first
      const { data: existing } = await supabase
        .from('soundscapes')
        .select('id, audio_url')
        .eq('id', id)
        .single()
      
      if (!existing) {
        return NextResponse.json(
          { error: 'Soundscape not found' },
          { status: 404 }
        )
      }
      
      // Delete soundscape
      const result = await executeOptimizedQuery(
        supabase.from('soundscapes').delete().eq('id', id)
      )
      
      if (result.error) {
        throw result.error
      }
      
      // Invalidate caches
      soundscapesCache.clear()
      
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting soundscape:', error)
      
      return NextResponse.json(
        { error: 'Failed to delete soundscape' },
        { status: 500 }
      )
    }
  }
)

/**
 * Enhanced storage operations with caching
 */
export const optimizedStorageList = withPerformanceTracking(
  async (request: NextRequest): Promise<NextResponse> => {
    const url = new URL(request.url)
    const bucket = url.searchParams.get('bucket') || 'soundscapes'
    const prefix = url.searchParams.get('prefix') || ''
    const page = url.searchParams.get('page') || '1'
    const limit = url.searchParams.get('limit') || '10'
    
    const cacheKey = `storage:list:${bucket}:${prefix}:${page}:${limit}`
    
    // Check cache first
    const cached = storageCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }
    
    try {
      const supabase = supabaseAdmin
      const pagination = extractPaginationParams(request)
      
      // List storage objects with pagination
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(prefix, {
          limit: pagination.limit,
          offset: pagination.offset
        })
      
      if (error) {
        throw error
      }
      
      // Create paginated response
      const response = createPaginatedResponse(
        data || [], 
        data?.length || 0, // Storage API doesn't provide total count
        pagination
      )
      
      // Cache the response
      storageCache.set(cacheKey, response, 2 * 60 * 1000) // 2 minutes
      
      return NextResponse.json(response)
    } catch (error) {
      console.error('Error listing storage objects:', error)
      
      return NextResponse.json(
        { error: 'Failed to list storage objects' },
        { status: 500 }
      )
    }
  }
)

/**
 * Enhanced categories with caching
 */
export const optimizedCategoriesList = withPerformanceTracking(
  async (request: NextRequest): Promise<NextResponse> => {
    const cacheKey = 'categories:list'
    
    // Check cache first
    const cached = categoriesCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }
    
    try {
      const supabase = supabaseAdmin
      
      // Get categories with counts using optimized query
      const result = await executeOptimizedQuery(
        supabase
          .from('soundscapes')
          .select('category')
          .not('category', 'is', null)
      )
      
      if (result.error) {
        throw result.error
      }
      
      // Count occurrences
      const categoryCounts = (result.data || []).reduce((acc, item) => {
        const category = item.category
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Format response
      const categories = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count
      }))
      
      // Cache the response
      categoriesCache.set(cacheKey, categories, 10 * 60 * 1000) // 10 minutes
      
      return NextResponse.json(categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }
  }
)

/**
 * Admin operations with enhanced performance
 */
export const optimizedAdminStats = withPerformanceTracking(
  async (request: NextRequest): Promise<NextResponse> => {
    const cacheKey = 'admin:stats'
    
    // Check cache first
    const cached = soundscapesCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }
    
    try {
      const supabase = supabaseAdmin
      
      // Get stats using optimized queries
      const [countResult, durationResult] = await Promise.all([
        executeOptimizedQuery(
          supabase.from('soundscapes').select('*', { count: 'exact', head: true })
        ),
        executeOptimizedQuery(
          supabase.from('soundscapes').select('duration')
        )
      ])
      
      if (countResult.error || durationResult.error) {
        throw countResult.error || durationResult.error
      }
      
      const totalSoundscapes = countResult.count || 0
      const durations = durationResult.data || []
      const totalDuration = durations.reduce((sum, item) => sum + (item.duration || 0), 0)
      
      const stats = {
        totalSoundscapes,
        totalDuration,
        avgDuration: totalSoundscapes ? totalDuration / totalSoundscapes : 0,
        generatedAt: new Date().toISOString()
      }
      
      // Cache the response
      soundscapesCache.set(cacheKey, stats, 5 * 60 * 1000) // 5 minutes
      
      return NextResponse.json(stats)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      
      return NextResponse.json(
        { error: 'Failed to fetch admin stats' },
        { status: 500 }
      )
    }
  }
)

/**
 * Export all optimized handlers
 */
export const optimizedHandlers = {
  soundscapesList: optimizedSoundscapesList,
  soundscapeCreate: optimizedSoundscapeCreate,
  soundscapeUpdate: optimizedSoundscapeUpdate,
  soundscapeDelete: optimizedSoundscapeDelete,
  storageList: optimizedStorageList,
  categoriesList: optimizedCategoriesList,
  adminStats: optimizedAdminStats
}
