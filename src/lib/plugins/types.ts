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

export interface DatabaseHelpers {
  execute: (query: string, params?: any[]) => Promise<any>
  query: (query: string, params?: any[]) => Promise<any>
  transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T>
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
