/**
 * Route Guards Export Index
 * 
 * Centralized exports for all organization-related route guards
 */

export { OrganizationRequired } from './OrganizationRequired';
export { OrganizationMemberGuard } from './OrganizationMemberGuard';

// Re-export types for convenience
export type { 
  OrganizationRequiredProps,
  OrganizationMemberGuardProps 
} from '@/lib/types/family-organization-components';