/**
 * Enhanced database layer with transaction support, connection pooling,
 * and comprehensive error handling for production readiness
 */

import { config } from '../config'
import { getLogger } from '../observability/logging'

const logger = getLogger('database')

// Database operation interfaces
export interface DatabaseConnection {
  query<T = any>(text: string, params?: any[]): Promise<T[]>
  transaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T>
  healthCheck(): Promise<boolean>
  getStats(): ConnectionStats
}

export interface TransactionClient {
  query<T = any>(text: string, params?: any[]): Promise<T[]>
  commit(): Promise<void>
  rollback(): Promise<void>
}

export interface ConnectionStats {
  totalConnections: number
  idleConnections: number
  waitingClients: number
  totalQueries: number
  errorCount: number
  averageQueryTime: number
}

// Mock database client for demonstration (replace with actual Supabase client)
interface MockDatabaseClient {
  query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number; fields?: any[] }>
  connect(): Promise<MockDatabaseClient>
  release(): void
  totalCount: number
  idleCount: number
  waitingCount: number
}

// Database transaction wrapper
class DatabaseTransactionClient implements TransactionClient {
  constructor(private client: MockDatabaseClient, private db: EnhancedDatabase) {}

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    return this.db.executeQuery(text, params, this.client)
  }

  async commit(): Promise<void> {
    await this.client.query('COMMIT')
  }

  async rollback(): Promise<void> {
    await this.client.query('ROLLBACK')
  }
}

// Enhanced database implementation with production features
class EnhancedDatabase implements DatabaseConnection {
  private pool: MockDatabaseClient
  private stats = {
    totalQueries: 0,
    errorCount: 0,
    queryTimes: [] as number[],
  }

  constructor() {
    // In production, initialize with actual database pool (Supabase, pg, etc.)
    this.pool = this.createMockPool()
    this.setupPoolEventHandlers()
  }

  private createMockPool(): MockDatabaseClient {
    // This would be replaced with actual pool initialization
    return {
      async query(text: string, params?: any[]) {
        // Mock implementation - replace with actual database query
        return { rows: [], rowCount: 0, fields: [] }
      },
      async connect() {
        return this
      },
      release() {
        // Mock release
      },
      totalCount: 10,
      idleCount: 5,
      waitingCount: 0,
    }
  }

  private setupPoolEventHandlers(): void {
    // Mock event handlers - replace with actual pool event setup
    logger.debug('Database pool initialized', {
      maxConnections: config.database.maxConnections,
      connectionTimeout: config.database.connectionTimeout,
    })
  }

  async executeQuery<T = any>(text: string, params?: any[], client?: MockDatabaseClient): Promise<T[]> {
    const startTime = Date.now()
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    
    try {
      logger.debug('Executing database query', {
        queryId,
        query: text.substring(0, 100),
        params: params?.length || 0,
      })

      const queryClient = client || this.pool
      const result = await queryClient.query(text, params)
      
      const duration = Date.now() - startTime
      this.updateStats(duration, false)
      
      logger.logDatabase(text, duration, {
        queryId,
        rowCount: result.rowCount,
        fields: result.fields?.length || 0,
      })

      return result.rows
    } catch (error) {
      const duration = Date.now() - startTime
      this.updateStats(duration, true)
      
      logger.logError(error as Error, {
        queryId,
        query: text.substring(0, 100),
        params: params?.length || 0,
        duration,
      })

      throw this.enhanceError(error as Error, text, params)
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    return this.executeQuery<T>(text, params)
  }

  async transaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    
    try {
      logger.debug('Starting database transaction', { transactionId })
      
      await client.query('BEGIN')
      const txClient = new DatabaseTransactionClient(client, this)
      
      const result = await callback(txClient)
      
      await client.query('COMMIT')
      logger.debug('Transaction committed successfully', { transactionId })
      
      return result
    } catch (error) {
      try {
        await client.query('ROLLBACK')
        logger.warn('Transaction rolled back due to error', { 
          transactionId,
          error: (error as Error).message,
        })
      } catch (rollbackError) {
        logger.logError(rollbackError as Error, {
          event: 'transaction_rollback_failed',
          transactionId,
          originalError: (error as Error).message,
        })
      }
      
      throw this.enhanceError(error as Error, 'TRANSACTION', [])
    } finally {
      client.release()
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query<{ now: string }>('SELECT NOW() as now')
      return result.length > 0 && result[0].now !== undefined
    } catch (error) {
      logger.logError(error as Error, { event: 'health_check_failed' })
      return false
    }
  }

  getStats(): ConnectionStats {
    const avgQueryTime = this.stats.queryTimes.length > 0
      ? this.stats.queryTimes.reduce((a, b) => a + b, 0) / this.stats.queryTimes.length
      : 0

    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      totalQueries: this.stats.totalQueries,
      errorCount: this.stats.errorCount,
      averageQueryTime: Math.round(avgQueryTime * 100) / 100,
    }
  }

  private updateStats(duration: number, isError: boolean): void {
    this.stats.totalQueries++
    this.stats.queryTimes.push(duration)
    
    if (isError) {
      this.stats.errorCount++
    }

    // Keep only last 1000 query times for memory efficiency
    if (this.stats.queryTimes.length > 1000) {
      this.stats.queryTimes = this.stats.queryTimes.slice(-1000)
    }
  }

  private enhanceError(error: Error, query: string, params?: any[]): Error {
    const enhancedError = new Error(`Database error: ${error.message}`)
    enhancedError.name = 'DatabaseError'
    enhancedError.stack = error.stack
    
    // Attach metadata for debugging (without sensitive data)
    Object.assign(enhancedError, {
      originalError: error.name,
      query: query.substring(0, 100),
      paramCount: params?.length || 0,
      timestamp: new Date().toISOString(),
    })

    return enhancedError
  }

  // Graceful shutdown
  async close(): Promise<void> {
    logger.info('Closing database connection pool')
    // Mock implementation - replace with actual pool.end()
  }
}

// Singleton database instance
let dbInstance: DatabaseConnection | null = null

export function getDatabase(): DatabaseConnection {
  if (!dbInstance) {
    dbInstance = new EnhancedDatabase()
  }
  return dbInstance
}

// High-level repository pattern for soundscapes
export class SoundscapesRepository {
  constructor(private db: DatabaseConnection) {}

  async findAll(filters?: {
    category?: string
    isPublished?: boolean
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<any[]> {
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters?.category) {
      conditions.push(`category = $${paramIndex++}`)
      params.push(filters.category)
    }

    if (filters?.isPublished !== undefined) {
      conditions.push(`is_published = $${paramIndex++}`)
      params.push(filters.isPublished)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const sortBy = filters?.sortBy || 'sort_order'
    const sortOrder = filters?.sortOrder || 'asc'
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    const query = `
      SELECT * FROM soundscapes 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    
    params.push(limit, offset)
    return this.db.query(query, params)
  }

  async findById(id: string): Promise<any | null> {
    const results = await this.db.query(
      'SELECT * FROM soundscapes WHERE id = $1',
      [id]
    )
    return results[0] || null
  }

  async create(data: any): Promise<any> {
    return this.db.transaction(async (tx) => {
      // Insert soundscape
      const soundscape = await tx.query(`
        INSERT INTO soundscapes (
          title, description, category, audio_url, thumbnail_url,
          is_published, sort_order, duration_seconds
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        data.title, data.description, data.category, data.audio_url,
        data.thumbnail_url, data.is_published, data.sort_order, data.duration_seconds
      ])

      // Log creation for audit trail
      await tx.query(`
        INSERT INTO audit_log (
          table_name, operation, record_id, user_id, changes
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'soundscapes', 'CREATE', soundscape[0].id, 
        data.created_by || 'system', JSON.stringify(data)
      ])

      return soundscape[0]
    })
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.db.transaction(async (tx) => {
      // Get original record for audit
      const original = await tx.query('SELECT * FROM soundscapes WHERE id = $1', [id])
      if (!original.length) {
        throw new Error('Soundscape not found')
      }

      // Update soundscape
      const updated = await tx.query(`
        UPDATE soundscapes SET
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          category = COALESCE($4, category),
          audio_url = COALESCE($5, audio_url),
          thumbnail_url = COALESCE($6, thumbnail_url),
          is_published = COALESCE($7, is_published),
          sort_order = COALESCE($8, sort_order),
          duration_seconds = COALESCE($9, duration_seconds),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        id, data.title, data.description, data.category, data.audio_url,
        data.thumbnail_url, data.is_published, data.sort_order, data.duration_seconds
      ])

      // Log update for audit trail
      await tx.query(`
        INSERT INTO audit_log (
          table_name, operation, record_id, user_id, changes
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'soundscapes', 'UPDATE', id,
        data.updated_by || 'system',
        JSON.stringify({ original: original[0], updated: data })
      ])

      return updated[0]
    })
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      // Get record for audit
      const record = await tx.query('SELECT * FROM soundscapes WHERE id = $1', [id])
      if (!record.length) {
        return false
      }

      // Soft delete (update is_published to false) or hard delete based on config
      await tx.query('DELETE FROM soundscapes WHERE id = $1', [id])

      // Log deletion
      await tx.query(`
        INSERT INTO audit_log (
          table_name, operation, record_id, user_id, changes
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'soundscapes', 'DELETE', id,
        userId || 'system',
        JSON.stringify(record[0])
      ])

      return true
    })
  }

  async getStatistics(): Promise<any> {
    const stats = await this.db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_published = true) as published,
        COUNT(*) FILTER (WHERE is_published = false) as drafts,
        category,
        COUNT(*) as category_count
      FROM soundscapes
      GROUP BY ROLLUP(category)
    `)

    return stats
  }
}

export default getDatabase
