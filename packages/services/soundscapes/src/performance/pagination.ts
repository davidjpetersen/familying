import { z } from 'zod'
import { NextRequest } from 'next/server'

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  defaultLimit: number
  maxLimit: number
  defaultOffset: number
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number
  offset: number
  page?: number
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  count: number
  page: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
  limit: number
  offset: number
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Pagination schema for query parameter validation
 */
export const PaginationSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
  offset: z.coerce
    .number()
    .int()
    .min(0, 'Offset must be non-negative')
    .optional()
    .default(0),
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .optional()
})

/**
 * Sorting schema for query parameters
 */
export const SortingSchema = z.object({
  sortBy: z.enum(['title', 'created_at', 'updated_at', 'sort_order', 'category'])
    .optional()
    .default('sort_order'),
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('asc')
})

/**
 * Combined pagination and sorting schema
 */
export const PaginationSortingSchema = PaginationSchema.merge(SortingSchema)

/**
 * Default pagination configurations
 */
export const PaginationConfigs = {
  soundscapes: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultOffset: 0
  },
  storage: {
    defaultLimit: 50,
    maxLimit: 200,
    defaultOffset: 0
  },
  admin: {
    defaultLimit: 10,
    maxLimit: 50,
    defaultOffset: 0
  }
} as const

/**
 * Extract pagination parameters from request
 */
export function extractPaginationParams(
  request: NextRequest,
  config: PaginationConfig = PaginationConfigs.soundscapes
): PaginationParams {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get('limit') || String(config.defaultLimit))),
    config.maxLimit
  )

  let offset = Math.max(0, parseInt(searchParams.get('offset') || String(config.defaultOffset)))
  const page = parseInt(searchParams.get('page') || '0')

  // If page is provided, calculate offset from page
  if (page > 0) {
    offset = (page - 1) * limit
  }

  return { limit, offset, page: page > 0 ? page : undefined }
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  params: PaginationParams
): PaginationMeta {
  const { limit, offset } = params
  const currentPage = params.page || Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)
  const count = Math.min(limit, total - offset)

  return {
    total,
    count: Math.max(0, count),
    page: currentPage,
    pages: totalPages,
    hasNext: offset + limit < total,
    hasPrev: offset > 0,
    limit,
    offset
  }
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    meta: createPaginationMeta(total, params)
  }
}

/**
 * Supabase query builder with pagination
 */
export function applyPagination(
  query: any,
  params: PaginationParams,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  return query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(params.offset, params.offset + params.limit - 1)
}

/**
 * SQL pagination helpers for complex queries
 */
export const SQLPagination = {
  /**
   * Generate COUNT query for total records
   */
  countQuery(baseQuery: string, whereClause?: string): string {
    const where = whereClause ? `WHERE ${whereClause}` : ''
    return `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query ${where}`
  },

  /**
   * Generate paginated query with sorting
   */
  paginatedQuery(
    baseQuery: string,
    params: PaginationParams,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'asc',
    whereClause?: string
  ): string {
    const where = whereClause ? `WHERE ${whereClause}` : ''
    const orderBy = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`
    const limitOffset = `LIMIT ${params.limit} OFFSET ${params.offset}`
    
    return `${baseQuery} ${where} ${orderBy} ${limitOffset}`
  }
}

/**
 * Cursor-based pagination for large datasets
 */
export interface CursorParams {
  cursor?: string
  limit: number
  direction: 'next' | 'prev'
}

export interface CursorMeta {
  hasNext: boolean
  hasPrev: boolean
  nextCursor?: string
  prevCursor?: string
  limit: number
}

export interface CursorResponse<T> {
  data: T[]
  meta: CursorMeta
}

/**
 * Create cursor-based pagination for efficient large dataset traversal
 */
export function createCursorPagination<T extends { id: string; created_at: string }>(
  data: T[],
  params: CursorParams
): CursorResponse<T> {
  const { limit, direction } = params
  
  // Determine if there are more records
  const hasMore = data.length > limit
  const actualData = hasMore ? data.slice(0, limit) : data
  
  // Generate cursors from the first and last items
  const nextCursor = actualData.length > 0 && hasMore 
    ? btoa(JSON.stringify({ 
        id: actualData[actualData.length - 1].id,
        created_at: actualData[actualData.length - 1].created_at 
      }))
    : undefined
    
  const prevCursor = actualData.length > 0 && params.cursor
    ? btoa(JSON.stringify({
        id: actualData[0].id,
        created_at: actualData[0].created_at
      }))
    : undefined

  return {
    data: actualData,
    meta: {
      hasNext: direction === 'next' ? hasMore : !!params.cursor,
      hasPrev: direction === 'prev' ? hasMore : !!params.cursor,
      nextCursor,
      prevCursor,
      limit
    }
  }
}

/**
 * Parse cursor for database queries
 */
export function parseCursor(cursor: string): { id: string; created_at: string } | null {
  try {
    const decoded = atob(cursor)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Performance-optimized pagination middleware
 */
export function withPagination<T>(config: PaginationConfig = PaginationConfigs.soundscapes) {
  return function(
    handler: (params: PaginationParams, ...args: any[]) => Promise<PaginatedResponse<T>>
  ) {
    return async (request: NextRequest, ...args: any[]): Promise<PaginatedResponse<T>> => {
      const paginationParams = extractPaginationParams(request, config)
      return handler(paginationParams, request, ...args)
    }
  }
}
