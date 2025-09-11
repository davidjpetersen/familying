/**
 * Navigation State Types
 * 
 * Types for organization-aware navigation and routing
 */

/**
 * Context data for organization-aware navigation
 * Used by the useOrganizationNavigation hook
 */
export interface OrganizationNavigationContext {
  /** Whether user has any organization membership */
  hasOrganization: boolean;
  /** Currently active organization */
  currentOrganization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  /** Whether user can create new organizations */
  canCreateOrganization: boolean;
  /** Loading state for organization data */
  isLoaded: boolean;
  /** Whether to show the 'Create Family' option */
  shouldShowCreateFamily: boolean;
  /** Whether to show family settings */
  shouldShowFamilySettings: boolean;
}

/**
 * State for route guards and protected pages
 */
export interface OrganizationRouteGuardState {
  /** Whether the route requires organization membership */
  requiresOrganization: boolean;
  /** Whether the user meets the requirements */
  hasAccess: boolean;
  /** Where to redirect if access is denied */
  redirectPath: string | null;
  /** Loading state */
  isChecking: boolean;
}