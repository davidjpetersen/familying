import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAppContainer, SERVICE_TOKENS } from '@/bootstrap'
import { 
  CreateAdminCommand, 
  ListAdminsQuery,
  AdminDto 
} from '@/application/use-cases/admin-use-cases'
import { Mediator } from '@/application/use-cases/base'
import { AdminRole } from '@/domain/entities/admin'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    // Check if user can manage admins
    const result = await mediator.send(new ListAdminsQuery())

    if (result.isFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 })
    }

    return NextResponse.json({ 
      data: result.getValue(),
      success: true 
    })
  } catch (error) {
    console.error('Admin API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
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

    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const body = await request.json()
    const { clerkUserId, email, role } = body

    if (!clerkUserId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: clerkUserId, email, role' }, 
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: AdminRole[] = ['super_admin', 'admin', 'moderator']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: super_admin, admin, moderator' }, 
        { status: 400 }
      )
    }

    const result = await mediator.send(new CreateAdminCommand(
      clerkUserId,
      email,
      role
    ))

    if (result.isFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 })
    }

    return NextResponse.json({ 
      data: result.getValue(),
      success: true 
    }, { status: 201 })
  } catch (error) {
    console.error('Admin API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
