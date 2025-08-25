# Pluggable Microservices Architecture - Implementation

This implementation provides a pluggable microservices architecture for Next.js applications with Clerk authentication and Supabase database integration.

## Architecture Overview

The system allows you to extend your application through self-contained plugins that are:
- **Automatically discovered** from `packages/services/*`
- **Enabled by default** with no complex configuration
- **Authenticated centrally** via Clerk
- **Database-integrated** with automatic migrations
- **Type-safe** with full TypeScript support

## Core Components

### 1. Plugin System (`src/lib/plugins/`)

- **`types.ts`**: Core type definitions for plugins, routes, and context
- **`manager.ts`**: Plugin discovery, registration, and lifecycle management  
- **`auth.ts`**: Clerk-integrated authentication helpers
- **`database.ts`**: Supabase database helpers and migration runner
- **`logger.ts`**: Structured logging for plugins
- **`init.ts`**: Plugin initialization orchestration

### 2. Route Handlers

- **`/app/[plugin]/[[...path]]`**: User-facing plugin routes  
- **`/admin/[plugin]/[[...path]]`**: Admin-only plugin routes
- **`/api/admin/plugins`**: Plugin management API

### 3. Plugin Generator

- **`scripts/create-plugin.mjs`**: Interactive plugin scaffolding tool
- **`pnpm create:plugin`**: Command to generate new plugins

## Plugin Structure

Each plugin follows this standard structure:

```
packages/services/your-plugin/
├── package.json              # Dependencies and build scripts
├── plugin.manifest.json      # Plugin metadata and route declarations
├── src/
│   ├── index.ts              # Main plugin entry point
│   ├── routes.user.ts        # User-facing routes
│   ├── routes.admin.ts       # Admin routes  
│   ├── config.ts             # Configuration schema
│   └── service.ts            # Business logic
├── migrations/
│   └── 0001_init.sql         # Database migrations
└── README.md                 # Plugin documentation
```

### Plugin Manifest

```json
{
  "name": "todo-list",
  "displayName": "Todo List", 
  "version": "0.1.0",
  "author": "Your Team",
  "description": "Family task management",
  "routes": {
    "user": ["/app/todo-list", "/app/todo-list/:id"],
    "admin": ["/admin/todo-list", "/admin/todo-list/settings"]
  },
  "migrations": ["migrations/0001_init.sql"]
}
```

### Plugin Entry Point

```typescript
import type { PluginContext, PluginRoutes } from '../../../../src/lib/plugins/types'

export async function register(ctx: PluginContext): Promise<PluginRoutes> {
  const { logger, auth, db, config } = ctx

  return {
    user: createUserRoutes({ db, logger, auth }),
    admin: createAdminRoutes({ db, logger, auth, config })
  }
}

export async function deregister(ctx: PluginContext): Promise<void> {
  // Cleanup logic
}
```

## Route Definition

Plugins define routes as handlers that receive Next.js Request/Response objects:

```typescript
export function createUserRoutes({ db, logger, auth }: Dependencies) {
  return {
    'GET:/': auth.requireAuth(async (request: NextRequest) => {
      return NextResponse.json({ message: 'Hello from plugin!' })
    }),
    
    'POST:/items': auth.requireAuth(async (request: NextRequest) => {
      const body = await request.json()
      // Handle creation
      return NextResponse.json({ success: true }, { status: 201 })
    })
  }
}
```

## Authentication & Authorization

The system provides Clerk-integrated auth helpers:

```typescript
// Require authentication
'GET:/': auth.requireAuth(handler)

// Require specific roles  
'GET:/admin': auth.requireAuth(auth.withRoles(['admin'])(handler))

// Check permissions programmatically
if (await auth.isAdmin(user)) {
  // Admin logic
}
```

## Database Integration

Plugins get database helpers that work with your existing Supabase setup:

```typescript
// Execute queries
const result = await db.query('SELECT * FROM todo_items WHERE owner_id = $1', [userId])

// Run transactions
const result = await db.transaction(async (tx) => {
  // Transactional operations
})
```

### Migrations

Plugin migrations are automatically discovered and run:

```sql
-- migrations/0001_init.sql
CREATE TABLE todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own items" ON todo_items 
  FOR SELECT USING (owner_id = auth.uid()::text);
```

## Getting Started

### 1. Create a New Plugin

```bash
pnpm create:plugin
```

Follow the interactive prompts to scaffold your plugin.

### 2. Develop Your Plugin

```bash
cd packages/services/your-plugin
pnpm install
pnpm build
```

### 3. Test Your Plugin

The plugin routes will be automatically available:
- User routes: `http://localhost:3000/app/your-plugin`
- Admin routes: `http://localhost:3000/admin/your-plugin`

### 4. Monitor Plugins

Visit the admin interface at `/admin/plugins` to see all registered plugins and their health status.

## Example: Todo List Plugin

The included `todo-list` plugin demonstrates:
- ✅ User and admin route handlers
- ✅ Database table creation with RLS
- ✅ Clerk authentication integration  
- ✅ Structured logging
- ✅ Error handling
- ✅ TypeScript types

## Development Workflow

1. **Create**: Use `pnpm create:plugin` to scaffold
2. **Develop**: Write your business logic and routes
3. **Test**: Routes are hot-reloaded during development
4. **Deploy**: Plugins are built and deployed with the main app

## Security Considerations

- **Authentication**: All plugin routes require Clerk authentication
- **Authorization**: Admin routes require admin role verification
- **Database**: RLS policies protect data access
- **Input Validation**: Use Zod schemas for request validation
- **Error Handling**: Structured error responses

## CI/CD Ready

Each plugin includes standard scripts for CI:

```bash
pnpm lint        # ESLint checking
pnpm typecheck   # TypeScript validation  
pnpm test        # Vitest unit tests
pnpm build       # Compile to JavaScript
```

## Key Adaptations for Next.js

This implementation adapts the original Express-oriented plan for Next.js:

1. **Route Handlers**: Uses Next.js route handlers instead of Express routers
2. **Plugin Discovery**: Happens at build time and runtime
3. **Middleware Integration**: Works with Next.js middleware system
4. **API Routes**: Plugin APIs use Next.js API route conventions
5. **Type Safety**: Full TypeScript integration throughout

## Next Steps

1. **Add Plugin UI Components**: Create reusable React components for plugins
2. **Implement Plugin Store**: Add plugin enable/disable functionality  
3. **Add Plugin Dependencies**: Support inter-plugin dependencies
4. **Enhance Observability**: Add metrics and health checks
5. **Add Plugin Marketplace**: Build discovery and installation flows

## Troubleshooting

### Plugin Not Loading
- Check `plugin.manifest.json` syntax
- Verify file structure matches requirements
- Check server logs for discovery errors

### Route Not Found
- Verify route definition in plugin code
- Check route key format: `METHOD:/path`
- Ensure plugin is healthy in admin interface

### Authentication Issues  
- Verify Clerk configuration
- Check admin role assignment in database
- Review middleware configuration

### Database Errors
- Check Supabase connection
- Verify RLS policies
- Review migration SQL syntax

---

**Built for families, by families** 🏠
