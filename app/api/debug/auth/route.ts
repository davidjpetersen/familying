import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    return NextResponse.json({
      clerkUserId: userId,
      authenticated: !!userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
