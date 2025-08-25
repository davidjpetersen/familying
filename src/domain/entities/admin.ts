import { Entity } from './user'
import { ValidationResult } from '../types/result'

/**
 * Admin role value object
 */
export type AdminRole = 'super_admin' | 'admin' | 'moderator'

/**
 * Permission value object
 */
export type Permission = 
  | 'MANAGE_USERS'
  | 'MANAGE_ADMINS' 
  | 'MANAGE_PLUGINS'
  | 'VIEW_ANALYTICS'
  | 'SYSTEM_CONFIG'

/**
 * Admin domain entity
 */
export interface AdminProps {
  readonly clerkUserId: string
  readonly email: string
  readonly role: AdminRole
  readonly permissions: readonly Permission[]
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly isActive: boolean
}

export class AdminEntity extends Entity<AdminProps> {
  private constructor(id: string, props: AdminProps) {
    super(id, props)
    const validation = this.validate()
    if (validation.isInvalid()) {
      throw new Error(`Invalid admin: ${validation.errors.join(', ')}`)
    }
  }

  static create(props: AdminProps, id?: string): AdminEntity {
    return new AdminEntity(id ?? crypto.randomUUID(), props)
  }

  static fromUser(
    clerkUserId: string,
    email: string,
    role: AdminRole,
    id?: string
  ): AdminEntity {
    return AdminEntity.create({
      clerkUserId,
      email,
      role,
      permissions: AdminEntity.getDefaultPermissions(role),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }, id)
  }

  get clerkUserId(): string {
    return this.props.clerkUserId
  }

  get email(): string {
    return this.props.email
  }

  get role(): AdminRole {
    return this.props.role
  }

  get permissions(): readonly Permission[] {
    return this.props.permissions
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  // Business logic methods
  canManageUsers(): boolean {
    return this.hasPermission('MANAGE_USERS') || this.isSuperAdmin()
  }

  canManageAdmins(): boolean {
    return this.hasPermission('MANAGE_ADMINS') || this.isSuperAdmin()
  }

  canManagePlugins(): boolean {
    return this.hasPermission('MANAGE_PLUGINS') || this.isSuperAdmin()
  }

  canPromoteToRole(targetRole: AdminRole): boolean {
    if (!this.canManageAdmins()) {
      return false
    }

    // Super admins can promote to any role
    if (this.isSuperAdmin()) {
      return true
    }

    // Admins can only promote to moderator
    if (this.props.role === 'admin') {
      return targetRole === 'moderator'
    }

    // Moderators cannot promote
    return false
  }

  changeRole(newRole: AdminRole): AdminEntity {
    return new AdminEntity(this._id, {
      ...this.props,
      role: newRole,
      permissions: AdminEntity.getDefaultPermissions(newRole),
      updatedAt: new Date()
    })
  }

  deactivate(): AdminEntity {
    return new AdminEntity(this._id, {
      ...this.props,
      isActive: false,
      updatedAt: new Date()
    })
  }

  activate(): AdminEntity {
    return new AdminEntity(this._id, {
      ...this.props,
      isActive: true,
      updatedAt: new Date()
    })
  }

  private isSuperAdmin(): boolean {
    return this.props.role === 'super_admin'
  }

  hasPermission(permission: Permission): boolean {
    return this.props.permissions.includes(permission)
  }

  private static getDefaultPermissions(role: AdminRole): Permission[] {
    switch (role) {
      case 'super_admin':
        return [
          'MANAGE_USERS',
          'MANAGE_ADMINS',
          'MANAGE_PLUGINS',
          'VIEW_ANALYTICS',
          'SYSTEM_CONFIG'
        ]
      case 'admin':
        return [
          'MANAGE_USERS',
          'MANAGE_PLUGINS',
          'VIEW_ANALYTICS'
        ]
      case 'moderator':
        return [
          'VIEW_ANALYTICS'
        ]
      default:
        return []
    }
  }

  protected validate(): ValidationResult {
    const errors: string[] = []

    if (!this.props.clerkUserId) {
      errors.push('Clerk user ID is required')
    }

    if (!this.props.email || !this.isValidEmail(this.props.email)) {
      errors.push('Invalid email address')
    }

    if (!this.isValidRole(this.props.role)) {
      errors.push('Invalid admin role')
    }

    if (!this.props.createdAt) {
      errors.push('Created date is required')
    }

    return errors.length > 0 
      ? ValidationResult.failure(errors)
      : ValidationResult.success()
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidRole(role: AdminRole): boolean {
    return ['super_admin', 'admin', 'moderator'].includes(role)
  }
}
