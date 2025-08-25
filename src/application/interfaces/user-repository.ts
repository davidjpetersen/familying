import { User } from '../../domain/entities/user'

/**
 * User repository interface
 */
export interface UserFilters {
  readonly email?: string
  readonly username?: string
  readonly isActive?: boolean
  readonly createdAfter?: Date
  readonly createdBefore?: Date
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findAll(filters?: UserFilters): Promise<User[]>
  findAllActive(): Promise<User[]>
  save(user: User): Promise<void>
  update(user: User): Promise<void>
  delete(id: string): Promise<void>
  exists(email: string): Promise<boolean>
  count(filters?: UserFilters): Promise<number>
  updateLastSeen(id: string): Promise<void>
  deactivate(id: string): Promise<void>
  activate(id: string): Promise<void>
}

/**
 * User repository error types
 */
export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`)
    this.name = 'UserNotFoundError'
  }
}

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User already exists: ${email}`)
    this.name = 'UserAlreadyExistsError'
  }
}

export class UserInactiveError extends Error {
  constructor(id: string) {
    super(`User is inactive: ${id}`)
    this.name = 'UserInactiveError'
  }
}
