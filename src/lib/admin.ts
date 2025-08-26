import { supabaseAdmin } from './supabase'

export interface Admin {
  id: string
  clerk_user_id: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  created_at: string
  updated_at: string
  isActive?: boolean
}

export async function checkIsAdmin(clerkUserId: string): Promise<Admin | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return null
    }

    return data as Admin
  } catch (error) {
    console.error('Error checking admin status:', error)
    return null
  }
}

export async function getAllAdmins(): Promise<Admin[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admins:', error)
      return []
    }

    return data as Admin[]
  } catch (error) {
    console.error('Error fetching admins:', error)
    return []
  }
}

export async function addAdmin(clerkUserId: string, email: string, role: Admin['role'] = 'admin'): Promise<Admin | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert({
        clerk_user_id: clerkUserId,
        email,
        role
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding admin:', error)
      return null
    }

    return data as Admin
  } catch (error) {
    console.error('Error adding admin:', error)
    return null
  }
}

export async function removeAdmin(clerkUserId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('clerk_user_id', clerkUserId)

    if (error) {
      console.error('Error removing admin:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error removing admin:', error)
    return false
  }
}

export async function updateAdminRole(clerkUserId: string, role: Admin['role']): Promise<Admin | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating admin role:', error)
      return null
    }

    return data as Admin
  } catch (error) {
    console.error('Error updating admin role:', error)
    return null
  }
}
