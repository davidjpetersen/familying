import { supabaseAdmin } from '../supabase'
import { DatabaseHelpers } from './types'

export function createDatabaseHelpers(): DatabaseHelpers {
  return {
    execute: async (query: string, params?: any[]) => {
      try {
        const { data, error } = await supabaseAdmin.rpc('execute_sql', {
          query,
          params: params || []
        })
        
        if (error) throw error
        return data
      } catch (error) {
        console.error('Database execute error:', error)
        throw error
      }
    },

    query: async (query: string, params?: any[]) => {
      try {
        // For now, use the execute method
        // In a real implementation, you might want to use prepared statements
        // or a query builder that supports parameterized queries
        const { data, error } = await supabaseAdmin.rpc('query_sql', {
          query,
          params: params || []
        })
        
        if (error) throw error
        return data
      } catch (error) {
        console.error('Database query error:', error)
        throw error
      }
    },

    transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
      // Supabase doesn't directly expose transactions in the client
      // For now, we'll execute the function directly
      // In a production setup, you might want to use a different approach
      try {
        return await fn(supabaseAdmin)
      } catch (error) {
        console.error('Database transaction error:', error)
        throw error
      }
    }
  }
}

// Helper function to run migrations
export async function runMigration(migrationSql: string, migrationName: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('run_migration', {
      sql: migrationSql,
      name: migrationName
    })
    
    if (error) throw error
  } catch (error) {
    console.error(`Migration ${migrationName} failed:`, error)
    throw error
  }
}
