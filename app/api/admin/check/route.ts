import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    
    if (authResult instanceof NextResponse) {
      return NextResponse.json({ 
        success: false, 
        data: null 
      }, { status: 401 })
    }

    const { admin } = authResult

    return NextResponse.json({ 
      success: true, 
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive ?? false
      }
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}