import { NextRequest, NextResponse } from 'next/server'
import { getAppContainer, SERVICE_TOKENS } from '@/bootstrap'
import { 
  GetAdminByIdQuery,
  UpdateAdminRoleCommand,
  DeactivateAdminCommand,
  ActivateAdminCommand
} from '@/application/use-cases/admin-use-cases'
import { Mediator } from '@/application/use-cases/base'
import { AdminRole } from '@/domain/entities/admin'
import { requireAdmin, requirePermissions } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await requireAdmin()
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { admin } = authResult

    // Only admins and super_admins can view admin details
    const permissionError = requirePermissions(admin, 'admin')
    if (permissionError) {
      return permissionError
    }

    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const result = await mediator.send(new GetAdminByIdQuery(id))

    if (result.isFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 404 })
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await requireAdmin()
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { admin } = authResult

    // Only super_admins can modify other admins
    const permissionError = requirePermissions(admin, 'super_admin')
    if (permissionError) {
      return permissionError
    }

    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const body = await request.json()
    const { role, action } = body

    if (action === 'deactivate') {
      const result = await mediator.send(new DeactivateAdminCommand(id))
      
      if (result.isFailure()) {
        return NextResponse.json({ error: result.getError() }, { status: 400 })
      }

      return NextResponse.json({ 
        data: result.getValue(),
        success: true 
      })
    }

    if (action === 'activate') {
      const result = await mediator.send(new ActivateAdminCommand(id))
      
      if (result.isFailure()) {
        return NextResponse.json({ error: result.getError() }, { status: 400 })
      }

      return NextResponse.json({ 
        data: result.getValue(),
        success: true 
      })
    }

    if (role) {
      // Validate role
      const validRoles: AdminRole[] = ['super_admin', 'admin', 'moderator']
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be one of: super_admin, admin, moderator' }, 
          { status: 400 }
        )
      }

      const result = await mediator.send(new UpdateAdminRoleCommand(id, role))
      
      if (result.isFailure()) {
        return NextResponse.json({ error: result.getError() }, { status: 400 })
      }

      return NextResponse.json({ 
        data: result.getValue(),
        success: true 
      })
    }

    return NextResponse.json(
      { error: 'No valid action or role specified' }, 
      { status: 400 }
    )
  } catch (error) {
    console.error('Admin API PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
