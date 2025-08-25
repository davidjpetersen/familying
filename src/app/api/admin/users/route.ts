import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { addAdmin, checkIsAdmin, getAllAdmins, removeAdmin, updateAdminRole, type Admin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const admin = await checkIsAdmin(userId)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const admins = await getAllAdmins()
    
    // Enrich with Clerk user data
    const enrichedAdmins = await Promise.all(
      admins.map(async (adminUser) => {
        try {
          const client = await clerkClient()
          const clerkUser = await client.users.getUser(adminUser.clerk_user_id)
          return {
            ...adminUser,
            clerkData: {
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              imageUrl: clerkUser.imageUrl,
              lastSignInAt: clerkUser.lastSignInAt,
              createdAt: clerkUser.createdAt
            }
          }
        } catch (error) {
          console.error(`Error fetching Clerk data for user ${adminUser.clerk_user_id}:`, error)
          return {
            ...adminUser,
            clerkData: null
          }
        }
      })
    )

    return NextResponse.json({ admins: enrichedAdmins })

  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions (only super_admin can add admins)
    const admin = await checkIsAdmin(userId)
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { clerkUserId, email, role = 'admin' } = body

    if (!clerkUserId || !email) {
      return NextResponse.json(
        { error: 'Clerk user ID and email are required' },
        { status: 400 }
      )
    }

    // Verify the Clerk user exists
    try {
      const client = await clerkClient()
      await client.users.getUser(clerkUserId)
    } catch (error) {
      return NextResponse.json(
        { error: 'Clerk user not found' },
        { status: 404 }
      )
    }

    // Check if already an admin
    const existingAdmin = await checkIsAdmin(clerkUserId)
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'User is already an admin' },
        { status: 409 }
      )
    }

    const newAdmin = await addAdmin(clerkUserId, email, role)
    
    if (!newAdmin) {
      return NextResponse.json(
        { error: 'Failed to add admin' },
        { status: 500 }
      )
    }

    return NextResponse.json({ admin: newAdmin }, { status: 201 })

  } catch (error) {
    console.error('Error adding admin:', error)
    return NextResponse.json(
      { error: 'Failed to add admin' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const admin = await checkIsAdmin(userId)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { clerkUserId, role } = body

    if (!clerkUserId || !role) {
      return NextResponse.json(
        { error: 'Clerk user ID and role are required' },
        { status: 400 }
      )
    }

    // Only super_admin can modify other admins
    if (admin.role !== 'super_admin' && admin.clerk_user_id !== clerkUserId) {
      return NextResponse.json(
        { error: 'Super admin access required to modify other admins' },
        { status: 403 }
      )
    }

    // Prevent super_admin from demoting themselves if they're the only super_admin
    if (admin.clerk_user_id === clerkUserId && admin.role === 'super_admin' && role !== 'super_admin') {
      const allAdmins = await getAllAdmins()
      const superAdmins = allAdmins.filter(a => a.role === 'super_admin')
      
      if (superAdmins.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last super admin' },
          { status: 400 }
        )
      }
    }

    const updatedAdmin = await updateAdminRole(clerkUserId, role)
    
    if (!updatedAdmin) {
      return NextResponse.json(
        { error: 'Failed to update admin role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ admin: updatedAdmin })

  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const admin = await checkIsAdmin(userId)
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const clerkUserId = searchParams.get('clerkUserId')

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Clerk user ID is required' },
        { status: 400 }
      )
    }

    // Prevent super_admin from removing themselves if they're the only super_admin
    if (admin.clerk_user_id === clerkUserId) {
      const allAdmins = await getAllAdmins()
      const superAdmins = allAdmins.filter(a => a.role === 'super_admin')
      
      if (superAdmins.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last super admin' },
          { status: 400 }
        )
      }
    }

    const success = await removeAdmin(clerkUserId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove admin' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Admin removed successfully' })

  } catch (error) {
    console.error('Error removing admin:', error)
    return NextResponse.json(
      { error: 'Failed to remove admin' },
      { status: 500 }
    )
  }
}
