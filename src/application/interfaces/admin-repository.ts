import { AdminEntity } from '../../domain/entities/admin'
import { Result } from '../../domain/types/result'

/**
 * Admin repository interface
 */
export interface AdminFilters {
  readonly role?: string
  readonly isActive?: boolean
  readonly email?: string
  readonly searchTerm?: string
}

export interface AdminRepository {
  findById(id: string): Promise<AdminEntity | null>
  findByClerkId(clerkId: string): Promise<AdminEntity | null>
  findByEmail(email: string): Promise<AdminEntity | null>
  findAll(filters?: AdminFilters): Promise<AdminEntity[]>
  save(admin: AdminEntity): Promise<void>
  update(admin: AdminEntity): Promise<void>
  delete(id: string): Promise<void>
  exists(clerkId: string): Promise<boolean>
  count(filters?: AdminFilters): Promise<number>
}

/**
 * Repository error types
 */
export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export class AdminNotFoundError extends RepositoryError {
  constructor(identifier: string) {
    super(`Admin not found: ${identifier}`)
    this.name = 'AdminNotFoundError'
  }
}

export class AdminAlreadyExistsError extends RepositoryError {
  constructor(clerkId: string) {
    super(`Admin already exists with Clerk ID: ${clerkId}`)
    this.name = 'AdminAlreadyExistsError'
  }
}
