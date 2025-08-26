import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      service: 'API'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date().toISOString(),
        service: 'API',
        error: 'Health check failed'
      },
      { status: 500 }
    )
  }
}
