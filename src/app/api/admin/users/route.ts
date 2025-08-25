import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { addAdmin, checkIsAdmin, getAllAdmins, removeAdmin, updateAdminRole, type Admin } from '@/lib/admin'
import { createErrorResponse, AuthenticationError, AuthorizationError, ValidationError, DatabaseError, asyncHandler } from '@/lib/errors'
import { validateRequestBody, createAdminSchema, updateAdminRoleSchema, deleteAdminSchema } from '@/lib/validation'

export const GET = asyncHandler(async function(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new AuthenticationError('Authentication required')
  }

  // Check admin permissions
  const admin = await checkIsAdmin(userId)
  if (!admin) {
    throw new AuthorizationError('Admin access required')
  }

  try {
    const admins = await getAllAdmins()
    
    // Fetch all Clerk user data in batch to avoid N+1 query problem
    const clerkUserIds = admins.map(admin => admin.clerk_user_id)
    const client = await clerkClient()
    
    // Use Clerk's batch user fetching
    const clerkUsers = await client.users.getUserList({
      userId: clerkUserIds,
      limit: clerkUserIds.length
    })

    // Create a map for fast lookup
    const clerkUserMap = new Map(
      clerkUsers.data.map(user => [user.id, user])
    )
    
    // Enrich admin data with Clerk user information
    const enrichedAdmins = admins.map(adminUser => {
      const clerkUser = clerkUserMap.get(adminUser.clerk_user_id)
      return {
        ...adminUser,
        clerkData: clerkUser ? {
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          lastSignInAt: clerkUser.lastSignInAt,
          createdAt: clerkUser.createdAt
        } : null
      }
    })

    return NextResponse.json({ 
      admins: enrichedAdmins,
      total: enrichedAdmins.length
    })

  } catch (error) {
    console.error('Error fetching admins:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse.error, { status: errorResponse.statusCode })
  }
})

export const POST = asyncHandler(async function(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new AuthenticationError('Authentication required')
  }

  // Check admin permissions (only super_admin can add admins)
  const admin = await checkIsAdmin(userId)
  if (!admin || admin.role !== 'super_admin') {
    throw new AuthorizationError('Super admin access required')
  }

  try {
    const validatedData = await validateRequestBody(request, createAdminSchema)

    // Verify the Clerk user exists
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(validatedData.clerkUserId)
    
    if (!clerkUser) {
      throw new ValidationError('Clerk user not found')
    }

    // Check if already an admin
    const existingAdmin = await checkIsAdmin(validatedData.clerkUserId)
    if (existingAdmin) {
      throw new ValidationError('User is already an admin')
    }

    // Add the admin
    const newAdmin = await addAdmin(
      validatedData.clerkUserId,
      validatedData.email,
      validatedData.role
    )

    return NextResponse.json({ 
      admin: newAdmin,
      message: 'Admin added successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding admin:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse.error, { status: errorResponse.statusCode })
  }
})

export const PUT = asyncHandler(async function(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new AuthenticationError('Authentication required')
  }

  // Check admin permissions
  const admin = await checkIsAdmin(userId)
  if (!admin) {
    throw new AuthorizationError('Admin access required')
  }

  try {
    const validatedData = await validateRequestBody(request, updateAdminRoleSchema)

    // Only super_admin can modify other admins
    if (admin.role !== 'super_admin' && admin.clerk_user_id !== validatedData.adminId) {
      throw new AuthorizationError('Super admin access required to modify other admins')
    }

    // Prevent super_admin from demoting themselves if they're the only super_admin
    if (admin.clerk_user_id === validatedData.adminId && admin.role === 'super_admin' && validatedData.role !== 'super_admin') {
      const allAdmins = await getAllAdmins()
      const superAdmins = allAdmins.filter(a => a.role === 'super_admin')
      
      if (superAdmins.length <= 1) {
        throw new ValidationError('Cannot demote the last super admin')
      }
    }

    const updatedAdmin = await updateAdminRole(validatedData.adminId, validatedData.role)
    
    return NextResponse.json({ 
      admin: updatedAdmin,
      message: 'Admin role updated successfully'
    })

  } catch (error) {
    console.error('Error updating admin:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse.error, { status: errorResponse.statusCode })
  }
})

export const DELETE = asyncHandler(async function(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new AuthenticationError('Authentication required')
  }

  // Check admin permissions
  const admin = await checkIsAdmin(userId)
  if (!admin || admin.role !== 'super_admin') {
    throw new AuthorizationError('Super admin access required')
  }

  try {
    const { searchParams } = new URL(request.url)
    const clerkUserId = searchParams.get('clerkUserId')

    if (!clerkUserId) {
      throw new ValidationError('Clerk user ID is required')
    }

    // Prevent super_admin from removing themselves if they're the only super_admin
    if (admin.clerk_user_id === clerkUserId) {
      const allAdmins = await getAllAdmins()
      const superAdmins = allAdmins.filter(a => a.role === 'super_admin')
      
      if (superAdmins.length <= 1) {
        throw new ValidationError('Cannot remove the last super admin')
      }
    }

    const success = await removeAdmin(clerkUserId)
    
    if (!success) {
      throw new DatabaseError('Failed to remove admin')
    }

    return NextResponse.json({ 
      message: 'Admin removed successfully'
    })

  } catch (error) {
    console.error('Error removing admin:', error)
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(errorResponse.error, { status: errorResponse.statusCode })
  }
})
