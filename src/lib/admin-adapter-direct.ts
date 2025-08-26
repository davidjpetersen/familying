import { supabaseAdmin } from '@/lib/supabase';

export async function checkIsAdminDirect(clerkUserId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Direct admin check error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Return in the expected legacy format
    return {
      id: data.id,
      clerk_user_id: data.clerk_user_id,
      email: data.email,
      role: data.role,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Direct admin check error:', error);
    return null;
  }
}
