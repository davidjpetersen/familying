/**
 * Permission System for Soundscapes Plugin
 * Implements role-based access control (RBAC) and attribute-based access control (ABAC)
 */

import { NextRequest } from 'next/server'
import { AuthContext } from './authentication'
import { createErrorResponse } from '../utils/error-handling'

// Permission definitions for soundscapes plugin
export const PERMISSIONS = {
  // Soundscapes management
  'soundscapes:read': 'Read soundscapes and audio files',
  'soundscapes:write': 'Create and update soundscapes',
  'soundscapes:delete': 'Delete soundscapes and audio files',
  'soundscapes:admin': 'Full soundscapes administration',
  
  // Storage management
  'soundscapes:storage:read': 'View storage files and structure',
  'soundscapes:storage:write': 'Upload and modify storage files',
  'soundscapes:storage:delete': 'Delete storage files',
  'soundscapes:storage:admin': 'Full storage administration',
  
  // Plugin management
  'soundscapes:plugin:configure': 'Configure plugin settings',
  'soundscapes:plugin:enable': 'Enable/disable plugin features',
  'soundscapes:plugin:admin': 'Full plugin administration',
  
  // System permissions
  'admin': 'Full system administration (all permissions)',
  'moderator': 'Content moderation permissions',
  'user': 'Basic user permissions'
} as const

export type Permission = keyof typeof PERMISSIONS

// Role definitions with associated permissions
export const ROLES = {
  super_admin: {
    name: 'Super Administrator',
    description: 'Full system access',
    permissions: ['admin'] as Permission[]
  },
  
  admin: {
    name: 'Administrator',
    description: 'System administration',
    permissions: [
      'admin',
      'soundscapes:admin',
      'soundscapes:storage:admin',
      'soundscapes:plugin:admin'
    ] as Permission[]
  },
  
  soundscapes_admin: {
    name: 'Soundscapes Administrator',
    description: 'Full soundscapes management',
    permissions: [
      'soundscapes:admin',
      'soundscapes:read',
      'soundscapes:write',
      'soundscapes:delete',
      'soundscapes:storage:admin',
      'soundscapes:plugin:configure'
    ] as Permission[]
  },
  
  soundscapes_editor: {
    name: 'Soundscapes Editor',
    description: 'Edit soundscapes content',
    permissions: [
      'soundscapes:read',
      'soundscapes:write',
      'soundscapes:storage:read',
      'soundscapes:storage:write'
    ] as Permission[]
  },
  
  soundscapes_viewer: {
    name: 'Soundscapes Viewer',
    description: 'View soundscapes content',
    permissions: [
      'soundscapes:read',
      'soundscapes:storage:read'
    ] as Permission[]
  },
  
  moderator: {
    name: 'Moderator',
    description: 'Content moderation',
    permissions: [
      'moderator',
      'soundscapes:read',
      'soundscapes:write'
    ] as Permission[]
  },
  
  user: {
    name: 'User',
    description: 'Basic user access',
    permissions: [
      'user',
      'soundscapes:read'
    ] as Permission[]
  }
} as const

export type Role = keyof typeof ROLES

// Resource types for attribute-based access control
export interface Resource {
  type: 'soundscape' | 'storage_file' | 'plugin_config' | 'user_data'
  id?: string
  attributes?: Record<string, any>
  owner?: string
  metadata?: Record<string, any>
}

// Context for permission evaluation
export interface PermissionContext {
  user: AuthContext['user']
  resource?: Resource
  action: string
  environment?: {
    ip?: string
    userAgent?: string
    timestamp?: string
    method?: string
    path?: string
  }
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLES[role]?.permissions || []
}

/**
 * Get all permissions for a user (including inherited permissions)
 */
export function getUserPermissions(user: AuthContext['user']): Permission[] {
  if (!user) return []
  
  const rolePermissions = user.role ? getRolePermissions(user.role as Role) : []
  const directPermissions = user.permissions as Permission[] || []
  
  // Combine role permissions and direct permissions
  const allPermissions = [...new Set([...rolePermissions, ...directPermissions])]
  
  // If user has admin permission, they get all permissions
  if (allPermissions.includes('admin')) {
    return Object.keys(PERMISSIONS) as Permission[]
  }
  
  return allPermissions
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: AuthContext['user'],
  permission: Permission
): boolean {
  const userPermissions = getUserPermissions(user)
  
  // Admin has all permissions
  if (userPermissions.includes('admin')) return true
  
  // Direct permission check
  if (userPermissions.includes(permission)) return true
  
  // Check for wildcard permissions
  const permissionParts = permission.split(':')
  for (let i = permissionParts.length - 1; i > 0; i--) {
    const wildcardPermission = permissionParts.slice(0, i).join(':') + ':*'
    if (userPermissions.includes(wildcardPermission as Permission)) return true
  }
  
  return false
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: AuthContext['user'],
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(user, permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: AuthContext['user'],
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(user, permission))
}

/**
 * Check resource-based permissions (ABAC)
 */
export function hasResourcePermission(
  context: PermissionContext,
  permission: Permission
): boolean {
  // First check basic permission
  if (!hasPermission(context.user, permission)) return false
  
  // If no resource specified, basic permission is sufficient
  if (!context.resource) return true
  
  // Resource ownership check
  if (context.resource.owner && context.user?.id === context.resource.owner) {
    // Owners can perform most actions on their resources
    const ownerPermissions: Permission[] = [
      'soundscapes:read',
      'soundscapes:write',
      'soundscapes:storage:read',
      'soundscapes:storage:write'
    ]
    if (ownerPermissions.includes(permission)) return true
  }
  
  // Special cases for different resource types
  switch (context.resource.type) {
    case 'soundscape':
      return checkSoundscapePermission(context, permission)
    
    case 'storage_file':
      return checkStoragePermission(context, permission)
    
    case 'plugin_config':
      return checkPluginConfigPermission(context, permission)
    
    default:
      return true // Default to allowing if resource type not recognized
  }
}

/**
 * Check soundscape-specific permissions
 */
function checkSoundscapePermission(
  context: PermissionContext,
  permission: Permission
): boolean {
  const resource = context.resource!
  
  // Public soundscapes can be read by anyone with basic read permission
  if (permission === 'soundscapes:read' && resource.attributes?.isPublic) {
    return hasPermission(context.user, 'soundscapes:read')
  }
  
  // Private soundscapes require ownership or admin
  if (resource.attributes?.isPrivate) {
    return context.user?.id === resource.owner || 
           hasPermission(context.user, 'soundscapes:admin')
  }
  
  return true
}

/**
 * Check storage-specific permissions
 */
function checkStoragePermission(
  context: PermissionContext,
  permission: Permission
): boolean {
  const resource = context.resource!
  
  // System files require admin access
  if (resource.attributes?.isSystemFile) {
    return hasPermission(context.user, 'admin')
  }
  
  // Large files might require special permission
  if (resource.attributes?.size > 100 * 1024 * 1024) { // 100MB
    return hasPermission(context.user, 'soundscapes:storage:admin')
  }
  
  return true
}

/**
 * Check plugin configuration permissions
 */
function checkPluginConfigPermission(
  context: PermissionContext,
  permission: Permission
): boolean {
  // Plugin configuration always requires admin or specific plugin admin permission
  return hasPermission(context.user, 'admin') || 
         hasPermission(context.user, 'soundscapes:plugin:admin')
}

/**
 * Create permission middleware
 */
export function createPermissionMiddleware(
  requiredPermissions: Permission[],
  options: {
    requireAll?: boolean // Require all permissions (default: false - require any)
    resourceExtractor?: (request: NextRequest) => Promise<Resource | undefined>
  } = {}
) {
  return async function permissionMiddleware(
    request: NextRequest,
    authContext: AuthContext,
    handler: (request: NextRequest, context: AuthContext) => Promise<any>
  ) {
    if (!authContext.isAuthenticated) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        'Valid authentication required to access this resource',
        401,
        request.url
      )
    }
    
    // Extract resource if extractor provided
    const resource = options.resourceExtractor ? 
      await options.resourceExtractor(request) : 
      undefined
    
    // Create permission context
    const permissionContext: PermissionContext = {
      user: authContext.user,
      resource,
      action: request.method,
      environment: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
        method: request.method,
        path: new URL(request.url).pathname
      }
    }
    
    // Check permissions
    const hasRequiredPermissions = options.requireAll ?
      requiredPermissions.every(permission => 
        hasResourcePermission(permissionContext, permission)
      ) :
      requiredPermissions.some(permission => 
        hasResourcePermission(permissionContext, permission)
      )
    
    if (!hasRequiredPermissions) {
      return createErrorResponse(
        'FORBIDDEN',
        'Insufficient permissions',
        `Required permissions: ${requiredPermissions.join(', ')}`,
        403,
        request.url
      )
    }
    
    // Add permission context to request for use in handlers
    const extendedContext = {
      ...authContext,
      permissionContext
    }
    
    return handler(request, extendedContext as any)
  }
}

/**
 * Pre-configured permission middleware
 */
export const PermissionMiddleware = {
  // Soundscapes permissions
  soundscapesRead: createPermissionMiddleware(['soundscapes:read']),
  soundscapesWrite: createPermissionMiddleware(['soundscapes:write']),
  soundscapesDelete: createPermissionMiddleware(['soundscapes:delete']),
  soundscapesAdmin: createPermissionMiddleware(['soundscapes:admin']),
  
  // Storage permissions
  storageRead: createPermissionMiddleware(['soundscapes:storage:read']),
  storageWrite: createPermissionMiddleware(['soundscapes:storage:write']),
  storageDelete: createPermissionMiddleware(['soundscapes:storage:delete']),
  storageAdmin: createPermissionMiddleware(['soundscapes:storage:admin']),
  
  // Plugin permissions
  pluginConfigure: createPermissionMiddleware(['soundscapes:plugin:configure']),
  pluginAdmin: createPermissionMiddleware(['soundscapes:plugin:admin']),
  
  // System permissions
  admin: createPermissionMiddleware(['admin']),
  moderator: createPermissionMiddleware(['moderator', 'admin'])
}

/**
 * Get permission summary for debugging
 */
export function getPermissionSummary(user: AuthContext['user']) {
  const userPermissions = getUserPermissions(user)
  const effectiveRole = user?.role as Role || 'user'
  
  return {
    userId: user?.id,
    role: effectiveRole,
    rolePermissions: getRolePermissions(effectiveRole),
    directPermissions: user?.permissions || [],
    effectivePermissions: userPermissions,
    isAdmin: userPermissions.includes('admin'),
    permissionCount: userPermissions.length
  }
}
