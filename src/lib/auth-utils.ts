import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { checkIsAdmin, Admin } from './admin'
import { ROLE_HIERARCHY, type AdminRole } from './constants/admin'

export interface AuthorizedRequest {
  userId: string
  admin: Admin
}

/**
 * Check if the current user is authenticated and has admin privileges
 */
export async function requireAdmin(): Promise<AuthorizedRequest | NextResponse> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await checkIsAdmin(userId)
    
    if (!admin) {
      return NextResponse.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 })
    }

    return { userId, admin }
  } catch (error) {
    console.error('Error in requireAdmin:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

/**
 * Check if the current admin has sufficient permissions for an action
 */
export function checkAdminPermissions(
  admin: Admin, 
  requiredRole: AdminRole = 'admin'
): boolean {
  // Validate that both roles exist in the hierarchy
  if (!(admin.role in ROLE_HIERARCHY)) {
    console.error(`Invalid admin role: ${admin.role}`)
    return false
  }
  
  if (!(requiredRole in ROLE_HIERARCHY)) {
    console.error(`Invalid required role: ${requiredRole}`)
    return false
  }

  return ROLE_HIERARCHY[admin.role as AdminRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Require specific admin permissions
 */
export function requirePermissions(
  admin: Admin, 
  requiredRole: AdminRole = 'admin'
): NextResponse | null {
  if (!checkAdminPermissions(admin, requiredRole)) {
    return NextResponse.json({ 
      error: `Forbidden: ${requiredRole} role required` 
    }, { status: 403 })
  }
  return null
}
