import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated'
      });
    }

    // Simple direct Supabase query
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    console.log('Simple admin check:', { userId, data, error });

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      userId,
      isAdmin: !!data,
      adminData: data,
      hasError: !!error,
      errorCode: error?.code
    });
  } catch (error) {
    console.error('Simple debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
