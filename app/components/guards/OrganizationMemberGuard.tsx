/**
 * OrganizationMemberGuard Component
 * 
 * Restricts access based on organization membership and role.
 * Provides role-based access control for family organization features.
 */

'use client';

import React from 'react';
import { useOrganization, useAuth } from '@clerk/nextjs';
import { type OrganizationMemberGuardProps } from '@/lib/types/family-organization-components';
import { hasRequiredRole, getRoleDisplayName } from '@/lib/utils/family-organization';

/**
 * Role-based access control guard for organization features
 */
export function OrganizationMemberGuard({
  children,
  requiredRole = 'basic_member',
  fallback = <OrganizationMemberGuardFallback requiredRole={requiredRole} />,
  organizationId,
}: OrganizationMemberGuardProps) {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();

  const isFullyLoaded = authLoaded && orgLoaded;

  // Show loading state while checking status
  if (!isFullyLoaded) {
    return (
      <div className="organization-member-guard-loading">
        <OrganizationMemberGuardLoading />
      </div>
    );
  }

  // User must be signed in
  if (!isSignedIn) {
    return (
      <div className="organization-member-guard-unauthorized">
        <OrganizationMemberGuardUnauthorized message="You must be signed in to access this content." />
      </div>
    );
  }

  // User must belong to an organization
  if (!organization || !membership) {
    return (
      <div className="organization-member-guard-no-org">
        <OrganizationMemberGuardUnauthorized message="You must be a member of a family organization to access this content." />
      </div>
    );
  }

  // Check if specific organization ID is required
  if (organizationId && organization.id !== organizationId) {
    return (
      <div className="organization-member-guard-wrong-org">
        <OrganizationMemberGuardUnauthorized message="You don't have access to this family organization." />
      </div>
    );
  }

  // Check role requirements
  const userRole = membership.role;
  if (!hasRequiredRole(userRole, requiredRole)) {
    return (
      <div className="organization-member-guard-insufficient-role">
        {fallback}
      </div>
    );
  }

  // User has required permissions - render protected content
  return <>{children}</>;
}

/**
 * Default fallback component for insufficient role
 */
function OrganizationMemberGuardFallback({ requiredRole }: { requiredRole: string }) {
  const requiredRoleDisplay = getRoleDisplayName(requiredRole as any);

  return (
    <div className="min-h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="max-w-md text-center p-6">
        {/* Icon */}
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Insufficient Permissions
        </h3>
        <p className="text-gray-600 mb-4">
          You need {requiredRoleDisplay.toLowerCase()} privileges to access this feature.
        </p>
        <p className="text-sm text-gray-500">
          Contact a family administrator if you believe you should have access to this content.
        </p>
      </div>
    </div>
  );
}

/**
 * Loading component for member guard
 */
function OrganizationMemberGuardLoading() {
  return (
    <div className="min-h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="max-w-md w-full space-y-4 p-6">
        {/* Loading spinner */}
        <div className="flex justify-center">
          <svg 
            className="animate-spin h-6 w-6 text-blue-600" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Loading message */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Checking permissions...
          </p>
        </div>

        {/* Skeleton content */}
        <div className="animate-pulse space-y-2">
          <div className="bg-gray-200 h-3 w-3/4 rounded mx-auto"></div>
          <div className="bg-gray-200 h-3 w-1/2 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Unauthorized access component
 */
function OrganizationMemberGuardUnauthorized({ message }: { message: string }) {
  return (
    <div className="min-h-64 flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
      <div className="max-w-md text-center p-6">
        {/* Icon */}
        <div className="mx-auto h-12 w-12 text-red-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Access Denied
        </h3>
        <p className="text-red-700">
          {message}
        </p>
      </div>
    </div>
  );
}

export default OrganizationMemberGuard;