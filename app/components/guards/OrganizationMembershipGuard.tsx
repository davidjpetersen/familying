/**
 * OrganizationMembershipGuard Component
 * 
 * Ensures user belongs to an organization before accessing protected content.
 * Focused solely on organization membership.
 */

'use client';

import React from 'react';
import { useOrganization } from '@clerk/nextjs';
import { GuardLoadingSpinner, GuardErrorMessage } from './shared/GuardComponents';

interface OrganizationMembershipGuardProps {
  children: React.ReactNode;
  organizationId?: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Guard that only checks organization membership
 */
export function OrganizationMembershipGuard({
  children,
  organizationId,
  fallback,
  loadingComponent = <GuardLoadingSpinner message="Checking organization membership..." />
}: OrganizationMembershipGuardProps) {
  const { organization, membership, isLoaded } = useOrganization();

  // Show loading while organization data is loading
  if (!isLoaded) {
    return <>{loadingComponent}</>;
  }

  // User must belong to an organization
  if (!organization || !membership) {
    return <>{fallback || <OrganizationMembershipGuardFallback />}</>;
  }

  // Check if specific organization ID is required
  if (organizationId && organization.id !== organizationId) {
    return <>{fallback || <WrongOrganizationFallback />}</>;
  }

  return <>{children}</>;
}

/**
 * Default fallback for users without organization membership
 */
function OrganizationMembershipGuardFallback() {
  return (
    <GuardErrorMessage
      variant="warning"
      title="Organization Membership Required"
      message="You must be a member of a family organization to access this content."
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
    />
  );
}

/**
 * Fallback for users in wrong organization
 */
function WrongOrganizationFallback() {
  return (
    <GuardErrorMessage
      variant="error"
      title="Access Denied"
      message="You don't have access to this family organization."
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
    />
  );
}

export default OrganizationMembershipGuard;