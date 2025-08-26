import { NextRequest, NextResponse } from 'next/server'

/**
 * Internal health endpoint for API health checks
 * This endpoint does NOT call other health check functions to avoid recursion
 */
export async function GET(request: NextRequest) {
  try {
    // Simple health check without calling other health functions
    const timestamp = new Date().toISOString()
    
    return NextResponse.json({
      status: 'ok',
      timestamp,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    console.error('Internal health check error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}
