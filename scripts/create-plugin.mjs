#!/usr/bin/env node

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createInterface } from 'readline'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve)
  })
}

async function generatePlugin() {
  console.log('🚀 Plugin Generator')
  console.log('===================\n')

  const name = await question('Plugin name (kebab-case): ')
  const displayName = await question('Display name: ')
  const author = await question('Author: ')
  const description = await question('Description: ')

  const pluginInfo = { name, displayName, author, description }

  const pluginPath = join(process.cwd(), 'packages', 'services', name)

  try {
    // Create directory structure
    await mkdir(pluginPath, { recursive: true })
    await mkdir(join(pluginPath, 'src'))
    await mkdir(join(pluginPath, 'migrations'))
    await mkdir(join(pluginPath, 'tests'))
    await mkdir(join(pluginPath, 'src', 'ui'))

    // Generate files
    await generatePackageJson(pluginPath, pluginInfo)
    await generateManifest(pluginPath, pluginInfo)
    await generateIndex(pluginPath, pluginInfo)
    await generateUserRoutes(pluginPath, pluginInfo)
    await generateAdminRoutes(pluginPath, pluginInfo)
    await generateConfig(pluginPath, pluginInfo)
    await generateService(pluginPath, pluginInfo)
    await generateMigration(pluginPath, pluginInfo)
    await generateTests(pluginPath, pluginInfo)
    await generateReadme(pluginPath, pluginInfo)

    console.log(`\n✅ Plugin "${name}" created successfully!`)
    console.log(`📁 Location: packages/services/${name}`)
    console.log('\n📝 Next steps:')
    console.log('1. Run `pnpm install` to install dependencies')
    console.log(`2. Build the plugin: \`cd packages/services/${name} && pnpm build\``)
    console.log('3. Restart your development server to load the plugin')
    
  } catch (error) {
    console.error('❌ Error creating plugin:', error)
  } finally {
    rl.close()
  }
}

async function generatePackageJson(pluginPath, info) {
  const packageJson = {
    name: `@app/services-${info.name}`,
    version: '0.1.0',
    description: info.description,
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc -p .',
      dev: 'tsc -p . --watch',
      test: 'vitest run',
      'test:watch': 'vitest',
      lint: 'eslint src --ext .ts,.tsx',
      typecheck: 'tsc --noEmit'
    },
    dependencies: {
      zod: '^4.1.1'
    },
    devDependencies: {
      '@types/node': '^20',
      typescript: '^5',
      vitest: '^2'
    },
    peerDependencies: {
      '@clerk/nextjs': '*',
      '@supabase/supabase-js': '*'
    }
  }

  await writeFile(
    join(pluginPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
}

async function generateManifest(pluginPath, info) {
  const manifest = {
    name: info.name,
    displayName: info.displayName,
    version: '0.1.0',
    author: info.author,
    description: info.description,
    routes: {
      user: [`/app/${info.name}`, `/app/${info.name}/:id`],
      admin: [`/admin/${info.name}`, `/admin/${info.name}/settings`]
    },
    migrations: ['migrations/0001_init.sql'],
    configSchemaRef: '#config'
  }

  await writeFile(
    join(pluginPath, 'plugin.manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
}

async function generateIndex(pluginPath, info) {
  const content = `import type { PluginContext, PluginRoutes } from '../../../../src/lib/plugins/types'
import { createUserRoutes } from './routes.user'
import { createAdminRoutes } from './routes.admin'

export async function register(ctx: PluginContext): Promise<PluginRoutes> {
  const { logger, auth, db, config } = ctx

  logger.info('Registering ${info.name} plugin')

  // Initialize any services here
  
  return {
    user: createUserRoutes({ db, logger, auth }),
    admin: createAdminRoutes({ db, logger, auth, config })
  }
}

export async function deregister(ctx: PluginContext): Promise<void> {
  const { logger } = ctx
  
  // Clean up any resources here
  logger.info('Deregistering ${info.name} plugin')
}
`

  await writeFile(join(pluginPath, 'src', 'index.ts'), content)
}

async function generateUserRoutes(pluginPath, info) {
  const content = `import { NextRequest, NextResponse } from 'next/server'
import type { AuthHelpers, DatabaseHelpers, Logger, RouteHandler } from '../../../../src/lib/plugins/types'

interface RouteDependencies {
  db: DatabaseHelpers
  logger: Logger
  auth: AuthHelpers
}

export function createUserRoutes({ db, logger, auth }: RouteDependencies): Record<string, RouteHandler> {
  return {
    'GET:/': auth.requireAuth(async (request: NextRequest) => {
      logger.info('${info.name} user index route accessed')
      
      return NextResponse.json({
        message: 'Welcome to ${info.displayName}',
        plugin: '${info.name}'
      })
    }),

    'GET:/:id': auth.requireAuth(async (request: NextRequest, { params }) => {
      const { id } = params
      logger.info({ id }, '${info.name} user detail route accessed')
      
      return NextResponse.json({
        message: \`${info.displayName} item \${id}\`,
        id,
        plugin: '${info.name}'
      })
    }),

    'POST:/': auth.requireAuth(async (request: NextRequest) => {
      try {
        const body = await request.json()
        logger.info({ body }, 'Creating new ${info.name} item')
        
        // Implement your creation logic here
        
        return NextResponse.json({
          message: 'Item created successfully',
          plugin: '${info.name}'
        }, { status: 201 })
      } catch (error) {
        logger.error({ error }, 'Error creating ${info.name} item')
        return NextResponse.json(
          { error: 'Failed to create item' },
          { status: 500 }
        )
      }
    })
  }
}
`

  await writeFile(join(pluginPath, 'src', 'routes.user.ts'), content)
}

async function generateAdminRoutes(pluginPath, info) {
  const content = `import { NextRequest, NextResponse } from 'next/server'
import type { AuthHelpers, DatabaseHelpers, Logger, PluginConfig, RouteHandler } from '../../../../src/lib/plugins/types'

interface RouteDependencies {
  db: DatabaseHelpers
  logger: Logger
  auth: AuthHelpers
  config: PluginConfig
}

export function createAdminRoutes({ db, logger, auth, config }: RouteDependencies): Record<string, RouteHandler> {
  return {
    'GET:/': auth.requireAuth(
      auth.withRoles(['admin'])(async (request: NextRequest) => {
        logger.info('${info.name} admin index route accessed')
        
        return NextResponse.json({
          message: '${info.displayName} Admin Dashboard',
          plugin: '${info.name}',
          config
        })
      })
    ),

    'GET:/settings': auth.requireAuth(
      auth.withRoles(['admin'])(async (request: NextRequest) => {
        logger.info('${info.name} admin settings route accessed')
        
        return NextResponse.json({
          message: '${info.displayName} Settings',
          plugin: '${info.name}',
          settings: {
            // Add your settings here
          }
        })
      })
    ),

    'POST:/settings': auth.requireAuth(
      auth.withRoles(['admin'])(async (request: NextRequest) => {
        try {
          const settings = await request.json()
          logger.info({ settings }, 'Updating ${info.name} settings')
          
          // Implement your settings update logic here
          
          return NextResponse.json({
            message: 'Settings updated successfully',
            plugin: '${info.name}'
          })
        } catch (error) {
          logger.error({ error }, 'Error updating ${info.name} settings')
          return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
          )
        }
      })
    )
  }
}
`

  await writeFile(join(pluginPath, 'src', 'routes.admin.ts'), content)
}

async function generateConfig(pluginPath, info) {
  const content = `import { z } from 'zod'

export const ConfigSchema = z.object({
  FEATURE_ENABLED: z.boolean().default(true),
  LIMIT: z.number().int().positive().default(100),
  // Add your config schema here
})

export type Config = z.infer<typeof ConfigSchema>

export const defaultConfig: Config = {
  FEATURE_ENABLED: true,
  LIMIT: 100
}
`

  await writeFile(join(pluginPath, 'src', 'config.ts'), content)
}

async function generateService(pluginPath, info) {
  const content = `import type { DatabaseHelpers, Logger } from '../../../../src/lib/plugins/types'

export class ${info.name.charAt(0).toUpperCase() + info.name.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Service {
  constructor(
    private db: DatabaseHelpers,
    private logger: Logger
  ) {}

  async initialize(): Promise<void> {
    this.logger.info('Initializing ${info.name} service')
    // Add initialization logic here
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up ${info.name} service')
    // Add cleanup logic here
  }

  // Add your service methods here
}
`

  await writeFile(join(pluginPath, 'src', 'service.ts'), content)
}

async function generateMigration(pluginPath, info) {
  const content = `-- Migration: Initialize ${info.name} plugin
-- Created: ${new Date().toISOString()}

-- Create plugin-specific tables
CREATE TABLE IF NOT EXISTS ${info.name.replace(/-/g, '_')}_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_${info.name.replace(/-/g, '_')}_owner ON ${info.name.replace(/-/g, '_')}_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_${info.name.replace(/-/g, '_')}_created ON ${info.name.replace(/-/g, '_')}_items(created_at);

-- Add RLS policies
ALTER TABLE ${info.name.replace(/-/g, '_')}_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own items
CREATE POLICY "${info.name.replace(/-/g, '_')}_items_select_policy" ON ${info.name.replace(/-/g, '_')}_items
  FOR SELECT USING (owner_id = auth.uid()::text);

-- Users can only insert their own items
CREATE POLICY "${info.name.replace(/-/g, '_')}_items_insert_policy" ON ${info.name.replace(/-/g, '_')}_items
  FOR INSERT WITH CHECK (owner_id = auth.uid()::text);

-- Users can only update their own items
CREATE POLICY "${info.name.replace(/-/g, '_')}_items_update_policy" ON ${info.name.replace(/-/g, '_')}_items
  FOR UPDATE USING (owner_id = auth.uid()::text);

-- Users can only delete their own items
CREATE POLICY "${info.name.replace(/-/g, '_')}_items_delete_policy" ON ${info.name.replace(/-/g, '_')}_items
  FOR DELETE USING (owner_id = auth.uid()::text);
`

  await writeFile(join(pluginPath, 'migrations', '0001_init.sql'), content)
}

async function generateTests(pluginPath, info) {
  const content = `import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PluginContext } from '../../../../src/lib/plugins/types'
import { register, deregister } from '../src/index'

// Mock dependencies
const mockContext: PluginContext = {
  manifest: {
    name: '${info.name}',
    displayName: '${info.displayName}',
    version: '0.1.0',
    author: '${info.author}',
    description: '${info.description}',
    routes: { user: [], admin: [] },
    migrations: []
  },
  config: {},
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  },
  auth: {
    requireAuth: vi.fn(),
    withRoles: vi.fn(),
    isAdmin: vi.fn(),
    hasRole: vi.fn(),
    assertRole: vi.fn()
  },
  db: {
    execute: vi.fn(),
    query: vi.fn(),
    transaction: vi.fn()
  }
}

describe('${info.name} Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register successfully', async () => {
    const routes = await register(mockContext)
    
    expect(routes).toBeDefined()
    expect(routes.user).toBeDefined()
    expect(routes.admin).toBeDefined()
    expect(mockContext.logger.info).toHaveBeenCalledWith('Registering ${info.name} plugin')
  })

  it('should deregister successfully', async () => {
    await deregister(mockContext)
    
    expect(mockContext.logger.info).toHaveBeenCalledWith('Deregistering ${info.name} plugin')
  })

  // Add more tests here
})
`

  await writeFile(join(pluginPath, 'tests', 'plugin.spec.ts'), content)
}

async function generateReadme(pluginPath, info) {
  const content = `# ${info.displayName}

${info.description}

## Installation

This plugin is automatically discovered when placed in the \`packages/services\` directory.

## Configuration

The plugin accepts the following configuration options:

- \`FEATURE_ENABLED\`: Enable/disable the plugin (default: true)
- \`LIMIT\`: Maximum number of items (default: 100)

Set these via environment variables:
\`\`\`bash
${info.name.toUpperCase().replace(/-/g, '_')}_FEATURE_ENABLED=true
${info.name.toUpperCase().replace(/-/g, '_')}_LIMIT=100
\`\`\`

## Routes

### User Routes

- \`GET /app/${info.name}\`: List items
- \`GET /app/${info.name}/:id\`: Get item by ID  
- \`POST /app/${info.name}\`: Create new item

### Admin Routes

- \`GET /admin/${info.name}\`: Admin dashboard
- \`GET /admin/${info.name}/settings\`: Plugin settings
- \`POST /admin/${info.name}/settings\`: Update settings

## Database Schema

The plugin creates the following tables:

- \`${info.name.replace(/-/g, '_')}_items\`: Main data table

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint
\`\`\`

## Migration

The plugin includes database migrations in the \`migrations/\` directory. These are automatically run when the plugin is loaded.

## Author

${info.author}
`

  await writeFile(join(pluginPath, 'README.md'), content)
}

// Generate TypeScript config
async function generateTsConfig(pluginPath) {
  const tsConfig = {
    extends: '../../../../tsconfig.json',
    compilerOptions: {
      outDir: './dist',
      rootDir: './src',
      composite: true
    },
    include: ['src/**/*'],
    exclude: ['dist', 'node_modules', 'tests']
  }

  await writeFile(
    join(pluginPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generatePlugin().catch(console.error)
}
