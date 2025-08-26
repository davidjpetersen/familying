import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin-adapter';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        userId: null,
        isAdmin: false 
      });
    }

    console.log('Debug: Checking admin status for userId:', userId);
    
    const admin = await checkIsAdmin(userId);
    
    console.log('Debug: Admin result:', admin);
    
    return NextResponse.json({
      userId,
      isAdmin: !!admin,
      admin,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
