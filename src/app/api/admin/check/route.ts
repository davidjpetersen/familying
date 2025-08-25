import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAppContainer, SERVICE_TOKENS } from '@/bootstrap'
import { GetAdminByClerkIdQuery } from '@/application/use-cases/admin-use-cases'
import { Mediator } from '@/application/use-cases/base'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const result = await mediator.send(new GetAdminByClerkIdQuery(userId))

    if (result.isFailure()) {
      return NextResponse.json({ 
        success: false, 
        data: null 
      })
    }

    const admin = result.getValue() as any

    return NextResponse.json({ 
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      }
    })
  } catch (error) {
    console.error('Admin check API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
