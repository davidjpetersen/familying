/**
 * useOrganizationNavigation Hook
 * 
 * Provides organization-aware navigation state for conditional rendering
 * and navigation decisions throughout the application.
 */

import { useMemo } from 'react';
import { useOrganization } from '@clerk/nextjs';

export interface UseOrganizationNavigationReturn {
  hasOrganization: boolean;
  isLoaded: boolean;
  shouldShowCreateFamily: boolean;
  shouldShowFamilySettings: boolean;
  currentOrganization: {
    id: string;
    name: string;
    imageUrl?: string;
  } | null;
}

/**
 * Custom hook that provides organization-aware navigation state
 * 
 * @returns {UseOrganizationNavigationReturn} Navigation state object
 */
export function useOrganizationNavigation(): UseOrganizationNavigationReturn {
  // Get organization data from Clerk
  const { organization, isLoaded } = useOrganization();

  // Memoize computed values to prevent unnecessary re-renders
  const navigationState = useMemo(() => {
    const hasOrganization = !!organization;
    const shouldShowCreateFamily = isLoaded && !organization;
    const shouldShowFamilySettings = isLoaded && !!organization;
    
    // Transform current organization to match contract interface
    const currentOrganization = organization ? {
      id: organization.id,
      name: organization.name,
      imageUrl: organization.imageUrl,
    } : null;

    return {
      hasOrganization,
      isLoaded,
      shouldShowCreateFamily,
      shouldShowFamilySettings,
      currentOrganization,
    };
  }, [organization, isLoaded]);

  return navigationState;
}

export default useOrganizationNavigation;