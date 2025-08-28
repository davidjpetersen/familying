/**
 * Security - Authentication Tests
 */

import { NextRequest } from 'next/server'
import { 
  createAuthMiddleware,
  AuthMiddleware,
  getAuthContext,
  isAdmin,
  hasPermissionForRequest
} from '../../../src/security/authentication'

// Mock NextRequest helper
function createMockRequest(options: {
  token?: string
  url?: string
  method?: string
} = {}): NextRequest {
  const url = options.url || 'http://localhost:3000/api/test'
  const headers = new Headers()
  
  if (options.token) {
    headers.set('authorization', `Bearer ${options.token}`)
  }
  
  return {
    url,
    method: options.method || 'GET',
    headers,
    nextUrl: new URL(url)
  } as NextRequest
}

// Mock JWT token helper
function createMockToken(payload: any): string {
  // Simple mock token for testing
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payloadEncoded = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  })).toString('base64')
  const signature = Buffer.from('mock-signature').toString('base64')
  
  return `${header}.${payloadEncoded}.${signature}`
}

const mockHandler = jest.fn().mockResolvedValue(
  new Response(JSON.stringify({ success: true }), { status: 200 })
)

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createAuthMiddleware', () => {
    it('should allow requests when authentication not required', async () => {
      const authMiddleware = createAuthMiddleware({
        requireAuth: false,
        allowAnonymous: true
      })
      
      const request = createMockRequest()
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith(request, expect.objectContaining({
        isAuthenticated: false
      }))
    })

    it('should reject requests when authentication required but no token', async () => {
      const authMiddleware = createAuthMiddleware({
        requireAuth: true
      })
      
      const request = createMockRequest()
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(401)
      expect(mockHandler).not.toHaveBeenCalled()
      
      const responseBody = await response.json()
      expect(responseBody.error.code).toBe('UNAUTHORIZED')
    })

    it('should accept valid token', async () => {
      const authMiddleware = createAuthMiddleware({
        requireAuth: true
      })
      
      const token = createMockToken({
        sub: 'user123',
        email: 'test@example.com',
        role: 'user'
      })
      
      const request = createMockRequest({ token })
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith(request, expect.objectContaining({
        isAuthenticated: true,
        user: expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          role: 'user'
        })
      }))
    })

    it('should reject expired token', async () => {
      const authMiddleware = createAuthMiddleware({
        requireAuth: true
      })
      
      // Create a token with past expiration time
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
      const payloadEncoded = Buffer.from(JSON.stringify({
        sub: 'user123',
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600  // 1 hour ago (expired)
      })).toString('base64')
      const signature = Buffer.from('mock-signature').toString('base64')
      const expiredToken = `${header}.${payloadEncoded}.${signature}`
      
      const request = createMockRequest({ token: expiredToken })
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(401)
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should check required role', async () => {
      const authMiddleware = createAuthMiddleware({
        requireAuth: true,
        requiredRole: 'admin'
      })
      
      const userToken = createMockToken({
        sub: 'user123',
        role: 'user'
      })
      
      const request = createMockRequest({ token: userToken })
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(403)
      expect(mockHandler).not.toHaveBeenCalled()
      
      const responseBody = await response.json()
      expect(responseBody.error.code).toBe('FORBIDDEN')
    })

    it('should accept admin role for moderator requirement', async () => {
      const authMiddleware = createAuthMiddleware({
        requireAuth: true,
        requiredRole: 'moderator'
      })
      
      const adminToken = createMockToken({
        sub: 'admin123',
        role: 'admin'
      })
      
      const request = createMockRequest({ token: adminToken })
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should check required permissions', async () => {
      const authMiddleware = createAuthMiddleware({
        requireAuth: true,
        requiredPermissions: ['soundscapes:write', 'admin']
      })
      
      const userToken = createMockToken({
        sub: 'user123',
        permissions: ['soundscapes:read']
      })
      
      const request = createMockRequest({ token: userToken })
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(403)
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should accept admin permission for any requirement', async () => {
      const authMiddleware = createAuthMiddleware({
        requireAuth: true,
        requiredPermissions: ['soundscapes:write']
      })
      
      const adminToken = createMockToken({
        sub: 'admin123',
        permissions: ['admin']
      })
      
      const request = createMockRequest({ token: adminToken })
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalled()
    })

    it('should require auth for admin endpoints by default', async () => {
      const authMiddleware = createAuthMiddleware()
      
      const request = createMockRequest({ 
        url: 'http://localhost:3000/admin/soundscapes' 
      })
      const response = await authMiddleware(request, mockHandler)
      
      expect(response.status).toBe(401)
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('Pre-configured middleware', () => {
    it('should have authenticated middleware', async () => {
      const token = createMockToken({ sub: 'user123' })
      const request = createMockRequest({ token })
      
      const response = await AuthMiddleware.authenticated(request, mockHandler)
      expect(response.status).toBe(200)
    })

    it('should have admin middleware', async () => {
      const userToken = createMockToken({ sub: 'user123', role: 'user' })
      const request = createMockRequest({ token: userToken })
      
      const response = await AuthMiddleware.admin(request, mockHandler)
      expect(response.status).toBe(403)
    })

    it('should have optional middleware', async () => {
      const request = createMockRequest() // No token
      
      const response = await AuthMiddleware.optional(request, mockHandler)
      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith(request, expect.objectContaining({
        isAuthenticated: false
      }))
    })
  })

  describe('getAuthContext', () => {
    it('should return auth context for valid token', async () => {
      const token = createMockToken({
        sub: 'user123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['soundscapes:admin']
      })
      
      const request = createMockRequest({ token })
      const context = await getAuthContext(request)
      
      expect(context.isAuthenticated).toBe(true)
      expect(context.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['soundscapes:admin']
      })
    })

    it('should return unauthenticated context for invalid token', async () => {
      const request = createMockRequest({ token: 'invalid-token' })
      const context = await getAuthContext(request)
      
      expect(context.isAuthenticated).toBe(false)
      expect(context.user).toBeUndefined()
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin role', async () => {
      const token = createMockToken({ sub: 'admin123', role: 'admin' })
      const request = createMockRequest({ token })
      
      const result = await isAdmin(request)
      expect(result).toBe(true)
    })

    it('should return true for super_admin role', async () => {
      const token = createMockToken({ sub: 'super123', role: 'super_admin' })
      const request = createMockRequest({ token })
      
      const result = await isAdmin(request)
      expect(result).toBe(true)
    })

    it('should return true for admin permission', async () => {
      const token = createMockToken({ 
        sub: 'user123', 
        role: 'user', 
        permissions: ['admin'] 
      })
      const request = createMockRequest({ token })
      
      const result = await isAdmin(request)
      expect(result).toBe(true)
    })

    it('should return false for regular user', async () => {
      const token = createMockToken({ sub: 'user123', role: 'user' })
      const request = createMockRequest({ token })
      
      const result = await isAdmin(request)
      expect(result).toBe(false)
    })

    it('should return false for unauthenticated request', async () => {
      const request = createMockRequest()
      
      const result = await isAdmin(request)
      expect(result).toBe(false)
    })
  })

  describe('hasPermissionForRequest', () => {
    it('should return true for matching permission', async () => {
      const token = createMockToken({ 
        sub: 'user123', 
        permissions: ['soundscapes:read'] 
      })
      const request = createMockRequest({ token })
      
      const result = await hasPermissionForRequest(request, 'soundscapes:read')
      expect(result).toBe(true)
    })

    it('should return false for missing permission', async () => {
      const token = createMockToken({ 
        sub: 'user123', 
        permissions: ['soundscapes:read'] 
      })
      const request = createMockRequest({ token })
      
      const result = await hasPermissionForRequest(request, 'soundscapes:write')
      expect(result).toBe(false)
    })

    it('should return false for unauthenticated request', async () => {
      const request = createMockRequest()
      
      const result = await hasPermissionForRequest(request, 'soundscapes:read')
      expect(result).toBe(false)
    })
  })

  describe('Token extraction', () => {
    it('should extract token from Authorization header', async () => {
      const token = createMockToken({ sub: 'user123' })
      const request = createMockRequest({ token })
      
      const context = await getAuthContext(request)
      expect(context.isAuthenticated).toBe(true)
    })

    it('should extract token from cookie', async () => {
      const token = createMockToken({ sub: 'user123' })
      const headers = new Headers()
      headers.set('cookie', `auth-token=${token}; other=value`)
      
      const request = {
        url: 'http://localhost:3000/api/test',
        headers
      } as NextRequest
      
      const context = await getAuthContext(request)
      expect(context.isAuthenticated).toBe(true)
    })

    it('should extract token from query parameter', async () => {
      const token = createMockToken({ sub: 'user123' })
      const request = {
        url: `http://localhost:3000/api/test?token=${token}`,
        headers: new Headers()
      } as NextRequest
      
      const context = await getAuthContext(request)
      expect(context.isAuthenticated).toBe(true)
    })
  })
})
