import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAppContainer, SERVICE_TOKENS } from '@/bootstrap'
import { GetAdminByClerkIdQuery, CheckAdminPermissionQuery } from '@/application/use-cases/admin-use-cases'
import { Mediator } from '@/application/use-cases/base'
import { Permission } from '@/domain/entities/admin'

/**
 * Middleware helper to check admin permissions
 */
export async function checkAdminAccess(
  request: NextRequest,
  requiredPermission?: Permission
): Promise<{ authorized: boolean; adminId?: string; error?: string }> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { authorized: false, error: 'Not authenticated' }
    }

    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    // Check if user is an admin
    const adminResult = await mediator.send(new GetAdminByClerkIdQuery(userId))
    
    if (adminResult.isFailure()) {
      return { authorized: false, error: 'Not an admin' }
    }

    const admin = adminResult.getValue() as any
    
    if (!admin.isActive) {
      return { authorized: false, error: 'Admin account is inactive' }
    }

    // If specific permission is required, check it
    if (requiredPermission) {
      const permissionResult = await mediator.send(
        new CheckAdminPermissionQuery(userId, requiredPermission)
      )
      
      if (permissionResult.isFailure() || !permissionResult.getValue()) {
        return { authorized: false, error: 'Insufficient permissions' }
      }
    }

    return { authorized: true, adminId: admin.id }
  } catch (error) {
    console.error('Admin access check error:', error)
    return { authorized: false, error: 'Internal server error' }
  }
}

// Types for Next.js route handler context
interface RouteContext {
  params?: Record<string, string | string[]>
}

/**
 * Create an admin-only route handler wrapper
 */
export function withAdminAuth(
  handler: (request: NextRequest, context: RouteContext) => Promise<NextResponse>,
  requiredPermission?: Permission
) {
  return async (request: NextRequest, context: RouteContext) => {
    const { authorized, error } = await checkAdminAccess(request, requiredPermission)
    
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Access denied' },
        { status: 403 }
      )
    }

    return handler(request, context)
  }
}

/**
 * Redirect users to admin dashboard if they have admin access
 */
export async function redirectIfAdmin(request: NextRequest): Promise<NextResponse | null> {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  try {
    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const adminResult = await mediator.send(new GetAdminByClerkIdQuery(userId))
    
    if (adminResult.isSuccess()) {
      const admin = adminResult.getValue() as any
      if (admin.isActive && request.nextUrl.pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  } catch (error) {
    console.error('Admin redirect check error:', error)
  }

  return null
}
