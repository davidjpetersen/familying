/**
 * Authentication Middleware for Soundscapes Plugin
 * Handles JWT validation, session management, and user verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '../utils/error-handling'

// JWT payload interface
export interface JWTPayload {
  sub: string // User ID
  email?: string
  role?: string
  permissions?: string[]
  iat: number // Issued at
  exp: number // Expires at
  aud?: string // Audience
  iss?: string // Issuer
}

// Authentication context
export interface AuthContext {
  isAuthenticated: boolean
  user?: {
    id: string
    email?: string
    role?: string
    permissions?: string[]
  }
  session?: {
    id: string
    expiresAt: number
  }
  token?: string
}

// Authentication configuration
export interface AuthConfig {
  requireAuth?: boolean
  requiredRole?: string
  requiredPermissions?: string[]
  allowAnonymous?: boolean
  jwtSecret?: string // In production, use environment variable
}

/**
 * Extract JWT token from request headers
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Check cookie (for web sessions)
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const authCookie = cookies.find(c => c.startsWith('auth-token='))
    if (authCookie) {
      return authCookie.split('=')[1]
    }
  }
  
  // Check query parameter (less secure, use with caution)
  const url = new URL(request.url)
  const tokenParam = url.searchParams.get('token')
  if (tokenParam) {
    return tokenParam
  }
  
  return null
}

/**
 * Simple JWT verification (in production, use proper JWT library)
 * This is a simplified implementation for demonstration
 */
function verifyJWT(token: string, secret: string = 'default-secret'): JWTPayload | null {
  try {
    // In production, use proper JWT library like jose or jsonwebtoken
    // This is a simplified implementation
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }
    
    return payload as JWTPayload
  } catch {
    return null
  }
}

/**
 * Get user session from Supabase (example implementation)
 */
async function getSession(token: string): Promise<AuthContext['session'] | null> {
  try {
    // In a real implementation, this would query Supabase auth
    // For now, return a mock session
    const payload = verifyJWT(token)
    if (!payload) return null
    
    return {
      id: `session_${payload.sub}`,
      expiresAt: payload.exp * 1000
    }
  } catch {
    return null
  }
}

/**
 * Check if user has required permissions
 */
function hasPermission(
  userPermissions: string[] = [],
  requiredPermissions: string[] = []
): boolean {
  if (requiredPermissions.length === 0) return true
  
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission) || 
    userPermissions.includes('admin') || // Admin has all permissions
    userPermissions.includes('*') // Wildcard permission
  )
}

/**
 * Check if user has required role
 */
function hasRole(userRole: string = '', requiredRole: string = ''): boolean {
  if (!requiredRole) return true
  
  // Role hierarchy
  const roleHierarchy: Record<string, string[]> = {
    'super_admin': ['admin', 'moderator', 'user'],
    'admin': ['moderator', 'user'],
    'moderator': ['user'],
    'user': []
  }
  
  return userRole === requiredRole || 
         roleHierarchy[userRole]?.includes(requiredRole) ||
         false
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(config: AuthConfig = {}) {
  return async function authMiddleware(
    request: NextRequest,
    handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const authContext: AuthContext = {
      isAuthenticated: false
    }
    
    // Extract token
    const token = extractToken(request)
    
    if (token) {
      // Verify token
      const payload = verifyJWT(token, config.jwtSecret)
      
      if (payload) {
        // Get session info
        const session = await getSession(token)
        
        if (session) {
          authContext.isAuthenticated = true
          authContext.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions
          }
          authContext.session = session
          authContext.token = token
        }
      }
    }
    
    // Check authentication requirements
    if (config.requireAuth && !authContext.isAuthenticated) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        'Valid authentication token required to access this resource',
        401,
        request.url
      )
    }
    
    // Check role requirements
    if (config.requiredRole && authContext.user) {
      if (!hasRole(authContext.user.role, config.requiredRole)) {
        return createErrorResponse(
          'FORBIDDEN',
          'Insufficient role privileges',
          `Required role: ${config.requiredRole}, current role: ${authContext.user.role || 'none'}`,
          403,
          request.url
        )
      }
    }
    
    // Check permission requirements
    if (config.requiredPermissions && authContext.user) {
      if (!hasPermission(authContext.user.permissions, config.requiredPermissions)) {
        return createErrorResponse(
          'FORBIDDEN',
          'Insufficient permissions',
          `Required permissions: ${config.requiredPermissions.join(', ')}`,
          403,
          request.url
        )
      }
    }
    
    // Allow anonymous access if configured
    if (!authContext.isAuthenticated && !config.allowAnonymous && config.requireAuth !== false) {
      // Default to requiring auth for admin endpoints
      const isAdminEndpoint = request.url.includes('/admin/')
      if (isAdminEndpoint) {
        return createErrorResponse(
          'UNAUTHORIZED',
          'Authentication required',
          'Admin endpoints require authentication',
          401,
          request.url
        )
      }
    }
    
    // Call the handler with auth context
    return handler(request, authContext)
  }
}

/**
 * Pre-configured authentication middleware for common use cases
 */
export const AuthMiddleware = {
  // Require authentication but no specific role
  authenticated: createAuthMiddleware({
    requireAuth: true,
    allowAnonymous: false
  }),
  
  // Require admin role
  admin: createAuthMiddleware({
    requireAuth: true,
    requiredRole: 'admin',
    allowAnonymous: false
  }),
  
  // Require moderator or admin role
  moderator: createAuthMiddleware({
    requireAuth: true,
    requiredRole: 'moderator',
    allowAnonymous: false
  }),
  
  // Optional authentication (works for both authenticated and anonymous)
  optional: createAuthMiddleware({
    requireAuth: false,
    allowAnonymous: true
  }),
  
  // Require specific soundscapes permissions
  soundscapesAdmin: createAuthMiddleware({
    requireAuth: true,
    requiredPermissions: ['soundscapes:admin', 'admin'],
    allowAnonymous: false
  }),
  
  soundscapesRead: createAuthMiddleware({
    requireAuth: true,
    requiredPermissions: ['soundscapes:read', 'soundscapes:admin', 'admin'],
    allowAnonymous: false
  }),
  
  soundscapesWrite: createAuthMiddleware({
    requireAuth: true,
    requiredPermissions: ['soundscapes:write', 'soundscapes:admin', 'admin'],
    allowAnonymous: false
  })
}

/**
 * Extract auth context from a request (utility function)
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const authContext: AuthContext = {
    isAuthenticated: false
  }
  
  const token = extractToken(request)
  
  if (token) {
    const payload = verifyJWT(token)
    
    if (payload) {
      const session = await getSession(token)
      
      if (session) {
        authContext.isAuthenticated = true
        authContext.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          permissions: payload.permissions
        }
        authContext.session = session
        authContext.token = token
      }
    }
  }
  
  return authContext
}

/**
 * Check if request is from an admin user
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const context = await getAuthContext(request)
  return context.user?.role === 'admin' || 
         context.user?.role === 'super_admin' ||
         context.user?.permissions?.includes('admin') ||
         false
}

/**
 * Check if request has specific permission
 */
export async function hasPermissionForRequest(
  request: NextRequest,
  permission: string
): Promise<boolean> {
  const context = await getAuthContext(request)
  return hasPermission(context.user?.permissions, [permission])
}
