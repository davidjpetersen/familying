import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        authenticated: false 
      });
    }

    // Check if user is already an admin
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking admin:', checkError);
      return NextResponse.json({ 
        error: 'Database error',
        details: checkError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      clerkUserId: userId,
      email: user.emailAddresses[0]?.emailAddress,
      fullName: user.fullName,
      isAlreadyAdmin: !!existingAdmin,
      existingAdminRecord: existingAdmin,
      sqlToMakeAdmin: `INSERT INTO admins (clerk_user_id, email, role) VALUES ('${userId}', '${user.emailAddresses[0]?.emailAddress}', 'super_admin');`
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Check if user is already an admin
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'User is already an admin',
        admin: existingAdmin
      });
    }

    // Add user as super admin
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admins')
      .insert({
        clerk_user_id: userId,
        email: user.emailAddresses[0]?.emailAddress,
        role: 'super_admin'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating admin:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create admin',
        details: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Successfully added as admin',
      admin: newAdmin
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
