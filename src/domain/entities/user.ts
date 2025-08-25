import { ValidationResult } from '../types/result'

/**
 * Base entity class with common properties
 */
export abstract class Entity<T> {
  protected constructor(
    protected readonly _id: string,
    protected props: T
  ) {}

  get id(): string {
    return this._id
  }

  equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) {
      return false
    }
    
    if (this === other) {
      return true
    }
    
    return this._id === other._id
  }

  protected abstract validate(): ValidationResult
}

/**
 * User domain entity
 */
export interface UserProps {
  readonly email: string
  readonly clerkUserId: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class User extends Entity<UserProps> {
  private constructor(id: string, props: UserProps) {
    super(id, props)
    const validation = this.validate()
    if (validation.isInvalid()) {
      throw new Error(`Invalid user: ${validation.errors.join(', ')}`)
    }
  }

  static create(props: UserProps, id?: string): User {
    return new User(id ?? crypto.randomUUID(), props)
  }

  get email(): string {
    return this.props.email
  }

  get clerkUserId(): string {
    return this.props.clerkUserId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  protected validate(): ValidationResult {
    const errors: string[] = []

    if (!this.props.email || !this.isValidEmail(this.props.email)) {
      errors.push('Invalid email address')
    }

    if (!this.props.clerkUserId) {
      errors.push('Clerk user ID is required')
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
}
