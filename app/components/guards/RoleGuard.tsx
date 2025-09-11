/**
 * RoleGuard Component
 * 
 * Ensures user has required role before accessing protected content.
 * Focused solely on role-based authorization.
 */

'use client';

import React from 'react';
import { useOrganization } from '@clerk/nextjs';
import { GuardLoadingSpinner, GuardErrorMessage } from './shared/GuardComponents';
import { hasRequiredRole, getRoleDisplayName } from '@/lib/utils/family-organization';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'basic_member';
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Guard that only checks user role permissions
 */
export function RoleGuard({
  children,
  requiredRole,
  fallback,
  loadingComponent = <GuardLoadingSpinner message="Checking permissions..." />
}: RoleGuardProps) {
  const { membership, isLoaded } = useOrganization();

  // Show loading while membership data is loading
  if (!isLoaded) {
    return <>{loadingComponent}</>;
  }

  // Check if user has required role
  const userRole = membership?.role;
  if (!userRole || !hasRequiredRole(userRole, requiredRole)) {
    return <>{fallback || <RoleGuardFallback requiredRole={requiredRole} />}</>;
  }

  return <>{children}</>;
}

/**
 * Default fallback for insufficient role permissions
 */
function RoleGuardFallback({ requiredRole }: { requiredRole: string }) {
  const requiredRoleDisplay = getRoleDisplayName(requiredRole as 'admin' | 'basic_member');

  return (
    <GuardErrorMessage
      variant="warning"
      title="Insufficient Permissions"
      message={`You need ${requiredRoleDisplay.toLowerCase()} privileges to access this feature. Contact a family administrator if you believe you should have access.`}
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
    />
  );
}

export default RoleGuard;