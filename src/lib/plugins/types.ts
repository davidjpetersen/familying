import { NextRequest, NextResponse } from 'next/server'
import { User } from '@clerk/nextjs/server'
import { EventEmitter } from 'events'

export interface PluginManifest {
  name: string
  displayName: string
  version: string
  author: string
  description: string
  routes: {
    user: string[]
    admin: string[]
    api?: string[]
  }
  migrations: string[]
  configSchemaRef?: string
}

export interface PluginConfig {
  [key: string]: unknown
}

export interface Logger {
  info: (data: any, message?: string) => void
  error: (data: any, message?: string) => void
  warn: (data: any, message?: string) => void
  debug: (data: any, message?: string) => void
}

export interface AuthHelpers {
  requireAuth: (handler: RouteHandler) => RouteHandler
  withRoles: (roles: string[]) => (handler: RouteHandler) => RouteHandler
  isAdmin: (user: User) => Promise<boolean>
  hasRole: (user: User, role: string) => Promise<boolean>
  assertRole: (user: User, role: string) => Promise<void>
}

// Define allowed database operations to prevent arbitrary SQL execution
export interface DatabaseOperation {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  where?: Record<string, any>
  data?: Record<string, any>
  columns?: string[]
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: { column: string; ascending?: boolean }
}

export interface DatabaseHelpers {
  query: (operation: DatabaseOperation, options?: QueryOptions) => Promise<any>
  execute: (operationName: string, params?: Record<string, any>) => Promise<any>
  transaction: <T>(fn: (helpers: DatabaseHelpers) => Promise<T>) => Promise<T>
}

export interface PluginContext {
  manifest: PluginManifest
  config: PluginConfig
  logger: Logger
  auth: AuthHelpers
  db: DatabaseHelpers
  events?: EventEmitter
}

export type RouteHandler = (
  request: NextRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse

export interface PluginRoutes {
  user?: Record<string, RouteHandler>
  admin?: Record<string, RouteHandler>
  api?: Record<string, RouteHandler>
}

export interface Plugin {
  manifest: PluginManifest
  register: (context: PluginContext) => Promise<PluginRoutes>
  deregister?: (context: PluginContext) => Promise<void>
}

export interface PluginRegistry {
  plugins: Map<string, Plugin>
  routes: Map<string, PluginRoutes>
  health: Map<string, 'healthy' | 'unhealthy' | 'unknown'>
}

export interface MigrationResult {
  success: boolean
  error?: string
  appliedMigrations: string[]
}
