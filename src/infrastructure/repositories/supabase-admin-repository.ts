import { AdminEntity, AdminRole, Permission } from '../../domain/entities/admin'
import { 
  AdminRepository, 
  AdminFilters, 
  AdminNotFoundError, 
  AdminAlreadyExistsError 
} from '../../application/interfaces/admin-repository'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase implementation of AdminRepository
 */
// Types for Supabase database rows
interface AdminDbRow {
  id: string
  clerk_user_id: string
  email: string
  role: AdminRole
  permissions?: Permission[]
  created_at: string
  updated_at: string
  is_active: boolean
}

interface AdminInsertData {
  id: string
  clerk_user_id: string
  email: string
  role: AdminRole
  permissions: Permission[]
  created_at: string
  updated_at: string
  is_active: boolean
}

export class SupabaseAdminRepository implements AdminRepository {
  private client: SupabaseClient

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey)
  }

  async findById(id: string): Promise<AdminEntity | null> {
    try {
      const { data, error } = await this.client
        .from('admins')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        throw new Error(`Database error: ${error.message}`)
      }

      if (!data) {
        return null
      }

      return this.mapToEntity(data)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while finding admin by ID')
    }
  }

  async findByClerkId(clerkId: string): Promise<AdminEntity | null> {
    try {
      const { data, error } = await this.client
        .from('admins')
        .select('*')
        .eq('clerk_user_id', clerkId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Database error: ${error.message}`)
      }

      if (!data) {
        return null
      }

      return this.mapToEntity(data)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while finding admin by Clerk ID')
    }
  }

  async findByEmail(email: string): Promise<AdminEntity | null> {
    try {
      const { data, error } = await this.client
        .from('admins')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Database error: ${error.message}`)
      }

      if (!data) {
        return null
      }

      return this.mapToEntity(data)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while finding admin by email')
    }
  }

  async findAll(filters?: AdminFilters): Promise<AdminEntity[]> {
    try {
      let query = this.client.from('admins').select('*')

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      }

      if (filters?.email) {
        query = query.ilike('email', `%${filters.email}%`)
      }

      if (filters?.searchTerm) {
        query = query.or(`email.ilike.%${filters.searchTerm}%,role.ilike.%${filters.searchTerm}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data.map(row => this.mapToEntity(row))
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while finding admins')
    }
  }

  async save(admin: AdminEntity): Promise<void> {
    try {
      // Check if admin already exists
      const existing = await this.findByClerkId(admin.clerkUserId)
      if (existing) {
        throw new AdminAlreadyExistsError(admin.clerkUserId)
      }

      const { error } = await this.client
        .from('admins')
        .insert(this.mapToRow(admin))

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      if (error instanceof AdminAlreadyExistsError) {
        throw error
      }
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while saving admin')
    }
  }

  async update(admin: AdminEntity): Promise<void> {
    try {
      const { error } = await this.client
        .from('admins')
        .update(this.mapToRow(admin))
        .eq('id', admin.id)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while updating admin')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('admins')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while deleting admin')
    }
  }

  async exists(clerkId: string): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from('admins')
        .select('id', { count: 'exact', head: true })
        .eq('clerk_user_id', clerkId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return (count || 0) > 0
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while checking admin existence')
    }
  }

  async count(filters?: AdminFilters): Promise<number> {
    try {
      let query = this.client.from('admins').select('id', { count: 'exact', head: true })

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
      }

      if (filters?.email) {
        query = query.ilike('email', `%${filters.email}%`)
      }

      const { count, error } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred while counting admins')
    }
  }

  private mapToEntity(row: AdminDbRow): AdminEntity {
    return AdminEntity.create({
      clerkUserId: row.clerk_user_id,
      email: row.email,
      role: row.role,
      permissions: row.permissions || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: row.is_active
    }, row.id)
  }

  private mapToRow(admin: AdminEntity): AdminInsertData {
    return {
      id: admin.id,
      clerk_user_id: admin.clerkUserId,
      email: admin.email,
      role: admin.role,
      permissions: [...admin.permissions],
      created_at: admin.createdAt.toISOString(),
      updated_at: admin.updatedAt.toISOString(),
      is_active: admin.isActive
    }
  }
}
