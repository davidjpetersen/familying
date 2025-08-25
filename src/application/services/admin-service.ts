import { Result } from '../../domain/types/result'
import { AdminEntity, AdminRole, Permission } from '../../domain/entities/admin'
import { AdminRepository, AdminFilters } from '../interfaces/admin-repository'
import { EventBus } from '../../domain/events/event-bus'

/**
 * Admin service for business operations
 */
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly eventBus: EventBus
  ) {}

  async createAdmin(data: {
    clerkUserId: string
    email: string
    role: AdminRole
  }): Promise<Result<AdminEntity, string>> {
    try {
      // Check if admin already exists
      const existing = await this.adminRepository.findByClerkId(data.clerkUserId)
      if (existing) {
        return Result.failure('Admin already exists for this user')
      }

      // Create admin entity
      const admin = AdminEntity.fromUser(
        data.clerkUserId,
        data.email,
        data.role
      )

      // Save to repository
      await this.adminRepository.save(admin)

      return Result.success(admin)
    } catch (error) {
      return Result.failure(`Failed to create admin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateAdminRole(
    adminId: string,
    newRole: AdminRole
  ): Promise<Result<AdminEntity, string>> {
    try {
      const admin = await this.adminRepository.findById(adminId)
      if (!admin) {
        return Result.failure('Admin not found')
      }

      const updatedAdmin = admin.changeRole(newRole)
      await this.adminRepository.update(updatedAdmin)
      return Result.success(updatedAdmin)
    } catch (error) {
      return Result.failure(`Failed to update admin role: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deactivateAdmin(adminId: string): Promise<Result<AdminEntity, string>> {
    try {
      const admin = await this.adminRepository.findById(adminId)
      if (!admin) {
        return Result.failure('Admin not found')
      }

      const deactivatedAdmin = admin.deactivate()
      await this.adminRepository.update(deactivatedAdmin)
      return Result.success(deactivatedAdmin)
    } catch (error) {
      return Result.failure(`Failed to deactivate admin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async activateAdmin(adminId: string): Promise<Result<AdminEntity, string>> {
    try {
      const admin = await this.adminRepository.findById(adminId)
      if (!admin) {
        return Result.failure('Admin not found')
      }

      const activatedAdmin = admin.activate()
      await this.adminRepository.update(activatedAdmin)
      return Result.success(activatedAdmin)
    } catch (error) {
      return Result.failure(`Failed to activate admin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAdminById(id: string): Promise<Result<AdminEntity, string>> {
    try {
      const admin = await this.adminRepository.findById(id)
      if (!admin) {
        return Result.failure('Admin not found')
      }
      return Result.success(admin)
    } catch (error) {
      return Result.failure(`Failed to get admin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAdminByClerkId(clerkId: string): Promise<Result<AdminEntity, string>> {
    try {
      const admin = await this.adminRepository.findByClerkId(clerkId)
      if (!admin) {
        return Result.failure('Admin not found')
      }
      return Result.success(admin)
    } catch (error) {
      return Result.failure(`Failed to get admin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listAdmins(filters?: AdminFilters): Promise<Result<AdminEntity[], string>> {
    try {
      const admins = await this.adminRepository.findAll(filters)
      return Result.success(admins)
    } catch (error) {
      return Result.failure(`Failed to list admins: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async hasPermission(clerkUserId: string, permission: Permission): Promise<Result<boolean, string>> {
    try {
      const admin = await this.adminRepository.findByClerkId(clerkUserId)
      if (!admin || !admin.isActive) {
        return Result.success(false)
      }
      return Result.success(admin.hasPermission(permission))
    } catch (error) {
      return Result.failure(`Failed to check permission: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async canManageUsers(clerkUserId: string): Promise<Result<boolean, string>> {
    try {
      const admin = await this.adminRepository.findByClerkId(clerkUserId)
      if (!admin || !admin.isActive) {
        return Result.success(false)
      }
      return Result.success(admin.canManageUsers())
    } catch (error) {
      return Result.failure(`Failed to check user management permission: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async canManageAdmins(clerkUserId: string): Promise<Result<boolean, string>> {
    try {
      const admin = await this.adminRepository.findByClerkId(clerkUserId)
      if (!admin || !admin.isActive) {
        return Result.success(false)
      }
      return Result.success(admin.canManageAdmins())
    } catch (error) {
      return Result.failure(`Failed to check admin management permission: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
