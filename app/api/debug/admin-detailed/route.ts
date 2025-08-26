import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/admin-adapter';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        step: 'auth_check',
        userId: null
      });
    }

    console.log('🔍 Debug: Starting admin check for userId:', userId);

    // Step 1: Check directly in Supabase
    const { data: directDbCheck, error: dbError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('clerk_user_id', userId);

    console.log('🔍 Debug: Direct DB check result:', { directDbCheck, dbError });

    // Step 2: Check via admin adapter
    let adapterResult;
    let adapterError;
    try {
      adapterResult = await checkIsAdmin(userId);
      console.log('🔍 Debug: Adapter result:', adapterResult);
    } catch (error) {
      adapterError = error;
      console.log('🔍 Debug: Adapter error:', error);
    }

    // Step 3: Check if admin table exists
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('admins')
      .select('count(*)', { count: 'exact', head: true });

    console.log('🔍 Debug: Table existence check:', { tableCheck, tableError });

    return NextResponse.json({
      userId,
      step1_directDbCheck: {
        data: directDbCheck,
        error: dbError,
        found: directDbCheck && directDbCheck.length > 0
      },
      step2_adapterCheck: {
        result: adapterResult,
        error: adapterError ? (adapterError instanceof Error ? adapterError.message : String(adapterError)) : null,
        isAdmin: !!adapterResult
      },
      step3_tableCheck: {
        error: tableError,
        tableExists: !tableError
      },
      summary: {
        authPassed: !!userId,
        dbHasRecord: directDbCheck && directDbCheck.length > 0,
        adapterWorks: !!adapterResult && !adapterError,
        shouldAllowAdmin: !!(directDbCheck && directDbCheck.length > 0)
      }
    });
  } catch (error) {
    console.error('🔍 Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
