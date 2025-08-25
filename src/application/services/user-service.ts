import { Result } from '../../domain/types/result'
import { User } from '../../domain/entities/user'
import { UserRepository, UserFilters } from '../interfaces/user-repository'
import { EventBus } from '../../domain/events/event-bus'

/**
 * User service for business operations
 */
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus
  ) {}

  async createUser(data: {
    clerkUserId: string
    email: string
  }): Promise<Result<User, string>> {
    try {
      // Check if user already exists
      const existingByEmail = await this.userRepository.findByEmail(data.email)
      if (existingByEmail) {
        return Result.failure('User already exists with this email')
      }

      // Create user entity
      const user = User.create({
        clerkUserId: data.clerkUserId,
        email: data.email,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Save to repository
      await this.userRepository.save(user)

      return Result.success(user)
    } catch (error) {
      return Result.failure(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getUserById(id: string): Promise<Result<User, string>> {
    try {
      const user = await this.userRepository.findById(id)
      if (!user) {
        return Result.failure('User not found')
      }
      return Result.success(user)
    } catch (error) {
      return Result.failure(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getUserByEmail(email: string): Promise<Result<User, string>> {
    try {
      const user = await this.userRepository.findByEmail(email)
      if (!user) {
        return Result.failure('User not found')
      }
      return Result.success(user)
    } catch (error) {
      return Result.failure(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getUserByUsername(username: string): Promise<Result<User, string>> {
    try {
      const user = await this.userRepository.findByUsername(username)
      if (!user) {
        return Result.failure('User not found')
      }
      return Result.success(user)
    } catch (error) {
      return Result.failure(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateUser(
    userId: string,
    data: {
      email?: string
    }
  ): Promise<Result<User, string>> {
    try {
      const user = await this.userRepository.findById(userId)
      if (!user) {
        return Result.failure('User not found')
      }

      // Check email uniqueness if updating
      if (data.email && data.email !== user.email) {
        const existingUser = await this.userRepository.findByEmail(data.email)
        if (existingUser) {
          return Result.failure('Email already taken')
        }
      }

      // Create updated user with new props
      const updatedUser = User.create({
        clerkUserId: user.clerkUserId,
        email: data.email || user.email,
        createdAt: user.createdAt,
        updatedAt: new Date()
      }, user.id)

      await this.userRepository.update(updatedUser)
      return Result.success(updatedUser)
    } catch (error) {
      return Result.failure(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateLastSeen(userId: string): Promise<Result<void, string>> {
    try {
      await this.userRepository.updateLastSeen(userId)
      return Result.success(undefined)
    } catch (error) {
      return Result.failure(`Failed to update last seen: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deactivateUser(userId: string): Promise<Result<void, string>> {
    try {
      // Use repository method directly since User entity doesn't have deactivate method
      await this.userRepository.deactivate(userId)
      return Result.success(undefined)
    } catch (error) {
      return Result.failure(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async activateUser(userId: string): Promise<Result<void, string>> {
    try {
      // Use repository method directly since User entity doesn't have activate method
      await this.userRepository.activate(userId)
      return Result.success(undefined)
    } catch (error) {
      return Result.failure(`Failed to activate user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteUser(userId: string): Promise<Result<void, string>> {
    try {
      const user = await this.userRepository.findById(userId)
      if (!user) {
        return Result.failure('User not found')
      }

      await this.userRepository.delete(userId)
      return Result.success(undefined)
    } catch (error) {
      return Result.failure(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listUsers(filters?: UserFilters): Promise<Result<User[], string>> {
    try {
      const users = await this.userRepository.findAll(filters)
      return Result.success(users)
    } catch (error) {
      return Result.failure(`Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listActiveUsers(): Promise<Result<User[], string>> {
    try {
      const users = await this.userRepository.findAllActive()
      return Result.success(users)
    } catch (error) {
      return Result.failure(`Failed to list active users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async userExists(email: string): Promise<Result<boolean, string>> {
    try {
      const exists = await this.userRepository.exists(email)
      return Result.success(exists)
    } catch (error) {
      return Result.failure(`Failed to check user existence: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getUserCount(filters?: UserFilters): Promise<Result<number, string>> {
    try {
      const count = await this.userRepository.count(filters)
      return Result.success(count)
    } catch (error) {
      return Result.failure(`Failed to get user count: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
