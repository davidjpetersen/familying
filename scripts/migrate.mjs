#!/usr/bin/env node

import { readdir, readFile, stat } from 'fs/promises'
import { join, resolve, extname } from 'path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

// Environment variables validation
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
}

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`❌ Missing required environment variable: ${key}`)
    process.exit(1)
  }
}

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Migration tracking table setup
const MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'global', -- 'global' or 'plugin'
    plugin_name TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    file_path TEXT NOT NULL,
    checksum TEXT
  );
  
  CREATE INDEX IF NOT EXISTS idx_migrations_name ON migrations(name);
  CREATE INDEX IF NOT EXISTS idx_migrations_plugin ON migrations(plugin_name);
  CREATE INDEX IF NOT EXISTS idx_migrations_type ON migrations(type);
`

// Plugin migrations tracking table (for backward compatibility)
const PLUGIN_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS plugin_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_name TEXT NOT NULL,
    migration_name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plugin_name, migration_name)
  );
`

class MigrationRunner {
  constructor() {
    this.executedMigrations = new Set()
    this.totalMigrations = 0
    this.successfulMigrations = 0
    this.failedMigrations = []
  }

  async initialize() {
    console.log('🔧 Initializing migration system...')
    
    try {
      // Create migrations tracking tables
      const { error: migrationsTableError } = await supabaseAdmin.rpc('exec_sql', {
        sql: MIGRATIONS_TABLE_SQL
      })
      
      if (migrationsTableError) {
        console.error('Failed to create migrations table:', migrationsTableError)
        throw migrationsTableError
      }

      const { error: pluginMigrationsTableError } = await supabaseAdmin.rpc('exec_sql', {
        sql: PLUGIN_MIGRATIONS_TABLE_SQL
      })
      
      if (pluginMigrationsTableError) {
        console.error('Failed to create plugin_migrations table:', pluginMigrationsTableError)
        throw pluginMigrationsTableError
      }

      // Load already executed migrations
      await this.loadExecutedMigrations()
      console.log('✅ Migration system initialized')
    } catch (error) {
      console.error('❌ Failed to initialize migration system:', error)
      throw error
    }
  }

  async loadExecutedMigrations() {
    try {
      // Load from both tables for backward compatibility
      const [migrationsResult, pluginMigrationsResult] = await Promise.all([
        supabaseAdmin.from('migrations').select('name'),
        supabaseAdmin.from('plugin_migrations').select('plugin_name, migration_name')
      ])

      if (migrationsResult.data) {
        migrationsResult.data.forEach(row => {
          this.executedMigrations.add(row.name)
        })
      }

      if (pluginMigrationsResult.data) {
        pluginMigrationsResult.data.forEach(row => {
          this.executedMigrations.add(`${row.plugin_name}_${row.migration_name}`)
        })
      }

      console.log(`📊 Found ${this.executedMigrations.size} previously executed migrations`)
    } catch (error) {
      console.warn('⚠️  Warning: Could not load executed migrations:', error)
    }
  }

  async findMigrationFiles() {
    const migrations = []

    // Find global migrations in sql/ folder
    await this.findGlobalMigrations(migrations)

    // Find plugin migrations
    await this.findPluginMigrations(migrations)

    // Sort migrations by name to ensure consistent execution order
    migrations.sort((a, b) => a.name.localeCompare(b.name))

    this.totalMigrations = migrations.length
    console.log(`📁 Found ${migrations.length} total migration files`)

    return migrations
  }

  async findGlobalMigrations(migrations) {
    const sqlPath = join(projectRoot, 'sql')
    
    try {
      const files = await readdir(sqlPath)
      
      for (const file of files) {
        if (extname(file) === '.sql') {
          const filePath = join(sqlPath, file)
          const name = file.replace('.sql', '')
          
          migrations.push({
            name,
            type: 'global',
            filePath,
            pluginName: null
          })
        }
      }
      
      console.log(`📄 Found ${migrations.length} global migrations`)
    } catch (error) {
      console.warn('⚠️  No global sql/ directory found or error reading it:', error.message)
    }
  }

  async findPluginMigrations(migrations) {
    const pluginsPath = join(projectRoot, 'packages', 'services')
    
    try {
      const plugins = await readdir(pluginsPath)
      let pluginMigrationCount = 0
      
      for (const pluginName of plugins) {
        const pluginPath = join(pluginsPath, pluginName)
        const pluginStat = await stat(pluginPath)
        
        if (pluginStat.isDirectory()) {
          const migrationsPath = join(pluginPath, 'migrations')
          
          try {
            const migrationFiles = await readdir(migrationsPath)
            
            for (const file of migrationFiles) {
              if (extname(file) === '.sql') {
                const filePath = join(migrationsPath, file)
                const migrationFileName = file.replace('.sql', '')
                const name = `${pluginName}_${migrationFileName}`
                
                migrations.push({
                  name,
                  type: 'plugin',
                  filePath,
                  pluginName
                })
                
                pluginMigrationCount++
              }
            }
          } catch (error) {
            // Plugin doesn't have migrations folder, skip
            continue
          }
        }
      }
      
      console.log(`🔌 Found ${pluginMigrationCount} plugin migrations`)
    } catch (error) {
      console.warn('⚠️  No plugins directory found or error reading it:', error.message)
    }
  }

  async executeMigration(migration) {
    const { name, filePath, type, pluginName } = migration

    if (this.executedMigrations.has(name)) {
      console.log(`⏭️  Skipping ${name} (already executed)`)
      return true
    }

    try {
      console.log(`🚀 Executing ${type} migration: ${name}`)
      
      const migrationSql = await readFile(filePath, 'utf-8')
      
      // Calculate checksum for integrity
      const checksum = await this.calculateChecksum(migrationSql)
      
      // Execute the migration SQL
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
        sql: migrationSql
      })
      
      if (sqlError) {
        throw sqlError
      }

      // Record the migration in the migrations table
      const { error: recordError } = await supabaseAdmin
        .from('migrations')
        .insert({
          name,
          type,
          plugin_name: pluginName,
          file_path: filePath,
          checksum
        })

      if (recordError) {
        console.warn(`⚠️  Warning: Failed to record migration ${name}:`, recordError)
      }

      // Also record in plugin_migrations table for backward compatibility
      if (type === 'plugin' && pluginName) {
        const migrationFileName = name.replace(`${pluginName}_`, '')
        await supabaseAdmin
          .from('plugin_migrations')
          .insert({
            plugin_name: pluginName,
            migration_name: migrationFileName
          })
      }

      this.executedMigrations.add(name)
      this.successfulMigrations++
      console.log(`✅ Successfully executed ${name}`)
      
      return true
    } catch (error) {
      console.error(`❌ Failed to execute ${name}:`, error)
      this.failedMigrations.push({ name, error: error.message })
      return false
    }
  }

  async calculateChecksum(content) {
    // Simple checksum calculation
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  async run() {
    console.log('🎯 Starting migration process...')
    console.log('=' .repeat(50))
    
    const startTime = Date.now()
    
    try {
      await this.initialize()
      
      const migrations = await this.findMigrationFiles()
      
      if (migrations.length === 0) {
        console.log('📭 No migration files found')
        return
      }

      console.log('\n🔄 Executing migrations...')
      
      for (const migration of migrations) {
        const success = await this.executeMigration(migration)
        if (!success && process.env.CI_FAIL_FAST !== 'false') {
          console.error('💥 Migration failed and CI_FAIL_FAST is enabled, stopping...')
          break
        }
      }

      await this.printSummary(startTime)
      
      // Exit with error code if any migrations failed
      if (this.failedMigrations.length > 0) {
        process.exit(1)
      }
      
    } catch (error) {
      console.error('💥 Migration process failed:', error)
      process.exit(1)
    }
  }

  async printSummary(startTime) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('\n' + '=' .repeat(50))
    console.log('📊 Migration Summary')
    console.log('=' .repeat(50))
    console.log(`⏱️  Duration: ${duration}s`)
    console.log(`📝 Total migrations: ${this.totalMigrations}`)
    console.log(`✅ Successful: ${this.successfulMigrations}`)
    console.log(`❌ Failed: ${this.failedMigrations.length}`)
    console.log(`⏭️  Skipped: ${this.totalMigrations - this.successfulMigrations - this.failedMigrations.length}`)
    
    if (this.failedMigrations.length > 0) {
      console.log('\n❌ Failed migrations:')
      this.failedMigrations.forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error}`)
      })
    }
    
    console.log('=' .repeat(50))
  }
}

// Handle CLI arguments
const args = process.argv.slice(2)
const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log(`
🚀 Migration Runner for Familying Project

Usage: node scripts/migrate.mjs [options]

Options:
  --help, -h          Show this help message
  --dry-run           Show what migrations would be executed without running them
  
Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL     Supabase project URL (required)
  SUPABASE_SERVICE_ROLE_KEY    Supabase service role key (required)
  CI_FAIL_FAST                 Set to 'false' to continue on migration failures (default: true)

Examples:
  node scripts/migrate.mjs
  CI_FAIL_FAST=false node scripts/migrate.mjs
  node scripts/migrate.mjs --dry-run
`)
  process.exit(0)
}

if (args.includes('--dry-run')) {
  console.log('🔍 DRY RUN MODE - No migrations will be executed')
  
  const runner = new MigrationRunner()
  await runner.initialize()
  const migrations = await runner.findMigrationFiles()
  
  console.log('\nMigrations that would be executed:')
  for (const migration of migrations) {
    const status = runner.executedMigrations.has(migration.name) ? '⏭️  SKIP' : '🚀 RUN'
    console.log(`${status} ${migration.type.padEnd(8)} ${migration.name}`)
  }
  
  process.exit(0)
}

// Run migrations
const runner = new MigrationRunner()
await runner.run()
