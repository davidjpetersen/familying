import { getAppContainer, SERVICE_TOKENS } from '@/bootstrap'
import { 
  GetAdminByClerkIdQuery,
  ListAdminsQuery,
  CheckAdminPermissionQuery,
  AdminDto 
} from '@/application/use-cases/admin-use-cases'
import { Mediator } from '@/application/use-cases/base'
import { Permission } from '@/domain/entities/admin'

/**
 * Legacy adapter to bridge existing admin lib with new clean architecture
 */
export interface LegacyAdmin {
  id: string
  clerk_user_id: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  created_at: string
  updated_at: string
}

/**
 * Check if user is an admin using the new architecture
 */
export async function checkIsAdmin(clerkUserId: string): Promise<LegacyAdmin | null> {
  try {
    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const result = await mediator.send(new GetAdminByClerkIdQuery(clerkUserId))

    if (result.isFailure()) {
      return null
    }

    const admin = result.getValue() as AdminDto
    return mapAdminDtoToLegacy(admin)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return null
  }
}

/**
 * Get all admins using the new architecture
 */
export async function getAllAdmins(): Promise<LegacyAdmin[]> {
  try {
    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const result = await mediator.send(new ListAdminsQuery())

    if (result.isFailure()) {
      console.error('Error fetching admins:', result.getError())
      return []
    }

    const admins = result.getValue() as AdminDto[]
    return admins.map(mapAdminDtoToLegacy)
  } catch (error) {
    console.error('Error fetching admins:', error)
    return []
  }
}

/**
 * Check if admin has specific permission
 */
export async function checkAdminPermission(
  clerkUserId: string, 
  permission: Permission
): Promise<boolean> {
  try {
    const container = getAppContainer()
    const mediator = container.resolve<Mediator>(SERVICE_TOKENS.MEDIATOR)

    const result = await mediator.send(new CheckAdminPermissionQuery(
      clerkUserId,
      permission
    ))

    if (result.isFailure()) {
      return false
    }

    return result.getValue() as boolean
  } catch (error) {
    console.error('Error checking admin permission:', error)
    return false
  }
}

/**
 * Helper functions
 */
function mapAdminDtoToLegacy(admin: AdminDto): LegacyAdmin {
  return {
    id: admin.id,
    clerk_user_id: admin.clerkUserId,
    email: admin.email,
    role: admin.role,
    created_at: admin.createdAt,
    updated_at: admin.updatedAt
  }
}

// Re-export the legacy interface for backward compatibility
export type Admin = LegacyAdmin
