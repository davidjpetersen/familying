import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@clerk/nextjs/server'
import { checkIsAdmin } from '../admin'
import { AuthHelpers, RouteHandler } from './types'

export function createAuthHelpers(): AuthHelpers {
  return {
    requireAuth: (handler: RouteHandler) => {
      return async (request: NextRequest, context: { params: Record<string, string> }) => {
        const { userId } = await auth()
        
        if (!userId) {
          return new NextResponse('Unauthorized', { status: 401 })
        }

        return handler(request, context)
      }
    },

    withRoles: (roles: string[]) => (handler: RouteHandler) => {
      return async (request: NextRequest, context: { params: Record<string, string> }) => {
        const user = await currentUser()
        
        if (!user) {
          return new NextResponse('Unauthorized', { status: 401 })
        }

        // Check if user has any of the required roles
        const hasRole = await Promise.all(
          roles.map(role => checkUserRole(user, role))
        )

        if (!hasRole.some(Boolean)) {
          return new NextResponse('Forbidden', { status: 403 })
        }

        return handler(request, context)
      }
    },

    isAdmin: async (user: User): Promise<boolean> => {
      if (!user?.id) return false
      const admin = await checkIsAdmin(user.id)
      return admin !== null
    },

    hasRole: async (user: User, role: string): Promise<boolean> => {
      return checkUserRole(user, role)
    },

    assertRole: async (user: User, role: string): Promise<void> => {
      const hasRole = await checkUserRole(user, role)
      if (!hasRole) {
        throw new Error(`User does not have required role: ${role}`)
      }
    }
  }
}

async function checkUserRole(user: User, role: string): Promise<boolean> {
  if (!user?.id) return false
  
  // For admin roles, check the admins table
  if (['admin', 'super_admin', 'moderator'].includes(role)) {
    const admin = await checkIsAdmin(user.id)
    return admin?.role === role || (role === 'admin' && admin?.role === 'super_admin')
  }
  
  // For other roles, you could check Clerk metadata or other systems
  // For now, just return false for unknown roles
  return false
}
