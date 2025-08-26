import { NextRequest, NextResponse } from 'next/server'
import { getAllHealthChecks } from '@/lib/health/health-checks'

export async function GET(request: NextRequest) {
  try {
    const healthChecks = await getAllHealthChecks()
    
    return NextResponse.json({
      data: healthChecks,
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health checks error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get health status',
        success: false 
      }, 
      { status: 500 }
    )
  }
}
