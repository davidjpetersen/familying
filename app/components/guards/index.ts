/**
 * Route Guards Export Index
 * 
 * Centralized exports for all authorization guards
 */

// New composable guard architecture (RECOMMENDED)
export { AuthenticationGuard } from './AuthenticationGuard';
export { OrganizationMembershipGuard } from './OrganizationMembershipGuard';
export { RoleGuard } from './RoleGuard';
export { ComposableGuard, AdminGuard, MemberGuard } from './ComposableGuard';

// Shared guard components
export { GuardLoadingSpinner, GuardErrorMessage } from './shared/GuardComponents';

// Legacy guards (DEPRECATED - use composable guards above)
export { OrganizationRequired } from './OrganizationRequired';
export { OrganizationMemberGuard } from './OrganizationMemberGuard';

// Re-export types for convenience
export type { 
  OrganizationRequiredProps,
  OrganizationMemberGuardProps 
} from '../../lib/types/family-organization-components';