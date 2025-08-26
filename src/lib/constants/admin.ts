/**
 * Shared constants for admin roles and permissions
 * Used across client and server to ensure consistency
 */

export const ADMIN_ROLES = ['super_admin', 'admin', 'moderator'] as const;

export type AdminRole = typeof ADMIN_ROLES[number];

export const PERMISSIONS = [
  'MANAGE_USERS',
  'MANAGE_ADMINS', 
  'MANAGE_PLUGINS',
  'VIEW_ANALYTICS',
  'SYSTEM_CONFIG'
] as const;

export type Permission = typeof PERMISSIONS[number];

/**
 * Type guard to check if a string is a valid admin role
 */
export function isValidAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Type guard to check if a string is a valid permission
 */
export function isValidPermission(permission: string): permission is Permission {
  return PERMISSIONS.includes(permission as Permission);
}

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  'super_admin': 3,
  'admin': 2,
  'moderator': 1
} as const;
