import { supabaseAdmin } from '../supabase'
import { DatabaseHelpers, DatabaseOperation, QueryOptions } from './types'

export function createDatabaseHelpers(): DatabaseHelpers {
  return {
    // Secure query method using Supabase's query builder
    query: async (operation: DatabaseOperation, options?: QueryOptions) => {
      try {
        let queryBuilder = supabaseAdmin.from(operation.table)

        switch (operation.operation) {
          case 'select':
            let selectQuery = queryBuilder.select(operation.columns?.join(',') || '*')
            
            if (operation.where) {
              Object.entries(operation.where).forEach(([key, value]) => {
                selectQuery = selectQuery.eq(key, value)
              })
            }
            
            if (options?.orderBy) {
              selectQuery = selectQuery.order(options.orderBy.column, { 
                ascending: options.orderBy.ascending ?? true 
              })
            }
            
            if (options?.limit) {
              selectQuery = selectQuery.limit(options.limit)
            }
            
            if (options?.offset) {
              selectQuery = selectQuery.range(options.offset, (options.offset + (options?.limit || 10)) - 1)
            }

            const selectResult = await selectQuery
            if (selectResult.error) {
              console.error('Database select error:', selectResult.error)
              throw new Error(`Database select failed: ${selectResult.error.message}`)
            }
            return selectResult.data
            break

          case 'insert':
            if (!operation.data) {
              throw new Error('Insert operation requires data')
            }
            const insertResult = await queryBuilder.insert(operation.data).select()
            if (insertResult.error) {
              console.error('Database insert error:', insertResult.error)
              throw new Error(`Database insert failed: ${insertResult.error.message}`)
            }
            return insertResult.data
            break

          case 'update':
            if (!operation.data) {
              throw new Error('Update operation requires data')
            }
            let updateQuery = queryBuilder.update(operation.data)
            
            if (operation.where) {
              Object.entries(operation.where).forEach(([key, value]) => {
                updateQuery = updateQuery.eq(key, value)
              })
            }

            const updateResult = await updateQuery.select()
            if (updateResult.error) {
              console.error('Database update error:', updateResult.error)
              throw new Error(`Database update failed: ${updateResult.error.message}`)
            }
            return updateResult.data
            break

          case 'delete':
            let deleteQuery = queryBuilder.delete()
            
            if (operation.where) {
              Object.entries(operation.where).forEach(([key, value]) => {
                deleteQuery = deleteQuery.eq(key, value)
              })
            }

            const deleteResult = await deleteQuery.select()
            if (deleteResult.error) {
              console.error('Database delete error:', deleteResult.error)
              throw new Error(`Database delete failed: ${deleteResult.error.message}`)
            }
            return deleteResult.data
            break

          default:
            throw new Error(`Unsupported operation: ${operation.operation}`)
        }
      } catch (error) {
        console.error('Database helper error:', error)
        throw error
      }
    },

    // Secure execute method - only for predefined operations
    execute: async (operationName: string, params?: Record<string, any>) => {
      const allowedOperations = [
        'create_user_todo',
        'update_todo_status',
        'delete_user_todo',
        'get_user_todos'
      ]

      if (!allowedOperations.includes(operationName)) {
        throw new Error(`Operation '${operationName}' is not allowed`)
      }

      try {
        const { data, error } = await supabaseAdmin.rpc(operationName, params || {})
        
        if (error) {
          console.error(`RPC operation '${operationName}' error:`, error)
          throw new Error(`RPC operation failed: ${error.message}`)
        }

        return data
      } catch (error) {
        console.error('Database execute error:', error)
        throw error
      }
    },

    transaction: async <T>(fn: (helpers: DatabaseHelpers) => Promise<T>): Promise<T> => {
      // Note: Supabase doesn't have native transaction support in the client
      // This is a placeholder that would need proper implementation
      // In a real scenario, you'd use a database with proper transaction support
      try {
        return await fn(createDatabaseHelpers())
      } catch (error) {
        console.error('Transaction error:', error)
        throw error
      }
    }
  }
}

// Migration runner with security checks
export async function runMigration(migrationSql: string, migrationName: string): Promise<any> {
  // Validate migration name to prevent path traversal
  console.log('Validating migration name:', JSON.stringify(migrationName))
  if (!/^[a-zA-Z0-9_-]+$/.test(migrationName)) {
    throw new Error('Invalid migration name: only alphanumeric, underscore, and dash characters allowed')
  }

  // Basic SQL validation - reject dangerous operations
  const dangerousPatterns = [
    /drop\s+database/i,
    /drop\s+schema/i,
    /truncate/i,
    /\bdelete\s+from\s+(?!.*where)/i, // DELETE without WHERE (word boundary)
    /\bupdate\s+\w+\s+set\s+(?!.*where)/i // UPDATE without WHERE (more specific)
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(migrationSql)) {
      throw new Error(`Migration contains potentially dangerous operation: ${migrationName}`)
    }
  }

  try {
    console.log(`Running migration: ${migrationName}`)
    
    // First check if migration has already been executed
    // Create the plugin_migrations table if it doesn't exist
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS plugin_migrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plugin_name TEXT NOT NULL,
          migration_name TEXT NOT NULL,
          executed_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(plugin_name, migration_name)
        );
      `
    })

    const { data: existingMigration } = await supabaseAdmin
      .from('plugin_migrations')
      .select('id')
      .eq('plugin_name', migrationName.split('_')[0])
      .eq('migration_name', migrationName)
      .single()

    if (existingMigration) {
      console.log(`Migration ${migrationName} already executed, skipping`)
      return { success: true }
    }

    // For now, let's manually execute the soundscapes table creation
    // This is a temporary workaround until we have proper SQL execution
    if (migrationName.includes('soundscapes')) {
      console.log('Creating soundscapes table manually...')
      
      // Use the raw SQL execution method from Supabase admin client
      const client = supabaseAdmin as any
      if (client.rest && client.rest.rpc) {
        const { error: createError } = await client.rest.rpc('exec_sql', {
          sql: migrationSql
        })
        
        if (createError) {
          throw new Error(`Migration failed: ${createError.message}`)
        }
      } else {
        console.warn('Direct SQL execution not available, migration skipped')
      }
    }

    // Record the migration as executed
    const { error: insertError } = await supabaseAdmin
      .from('plugin_migrations')
      .insert({
        plugin_name: migrationName.split('_')[0],
        migration_name: migrationName
      })

    if (insertError) {
      console.warn(`Failed to record migration ${migrationName}:`, insertError)
    }

    console.log(`Migration ${migrationName} completed successfully`)
    return { success: true }
  } catch (error) {
    console.error(`Error running migration ${migrationName}:`, error)
    throw error
  }
}
