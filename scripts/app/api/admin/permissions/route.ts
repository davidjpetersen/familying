import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAppContainer, SERVICE_TOKENS } from '@/bootstrap'
import { CheckAdminPermissionQuery } from '@/application/use-cases/admin-use-cases'
import { Mediator } from '@/application/use-cases/base'
import { Permission } from '@/domain/entities/admin'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const permission = searchParams.get('permission') as Permission

    if (!permission) {
      return NextResponse.json(
        { success: false, error: 'Permission parameter is required' }, 
        { status: 400 }
      )
    }

    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const result = await mediator.send(new CheckAdminPermissionQuery(userId, permission))

    if (result.isFailure()) {
      return NextResponse.json({ 
        success: false, 
        data: false,
        error: result.getError()
      })
    }

    return NextResponse.json({ 
      success: true,
      data: result.getValue() as boolean
    })
  } catch (error) {
    console.error('Permission check API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
