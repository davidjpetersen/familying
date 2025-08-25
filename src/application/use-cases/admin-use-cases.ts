import { AdminEntity, AdminRole } from '../../domain/entities/admin'
import { Command, Query } from './base'

/**
 * Admin Commands
 */
export class CreateAdminCommand implements Command {
  constructor(
    public readonly clerkUserId: string,
    public readonly email: string,
    public readonly role: AdminRole
  ) {}
}

export class UpdateAdminRoleCommand implements Command {
  constructor(
    public readonly adminId: string,
    public readonly newRole: AdminRole
  ) {}
}

export class DeactivateAdminCommand implements Command {
  constructor(public readonly adminId: string) {}
}

export class ActivateAdminCommand implements Command {
  constructor(public readonly adminId: string) {}
}

/**
 * Admin Queries
 */
export class GetAdminByIdQuery implements Query {
  constructor(public readonly adminId: string) {}
}

export class GetAdminByClerkIdQuery implements Query {
  constructor(public readonly clerkUserId: string) {}
}

export class ListAdminsQuery implements Query {
  constructor(
    public readonly filters?: {
      role?: string
      isActive?: boolean
      email?: string
      searchTerm?: string
    }
  ) {}
}

export class CheckAdminPermissionQuery implements Query {
  constructor(
    public readonly clerkUserId: string,
    public readonly permission: string
  ) {}
}

/**
 * Admin DTOs for responses
 */
export interface AdminDto {
  readonly id: string
  readonly clerkUserId: string
  readonly email: string
  readonly role: AdminRole
  readonly permissions: readonly string[]
  readonly createdAt: string
  readonly updatedAt: string
  readonly isActive: boolean
}

export function mapAdminToDto(admin: AdminEntity): AdminDto {
  return {
    id: admin.id,
    clerkUserId: admin.clerkUserId,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
    isActive: admin.isActive
  }
}
