/**
 * ComposableGuard Component
 * 
 * A higher-order component that demonstrates how to compose the individual guards
 * for complex authorization scenarios. This shows the preferred pattern for 
 * combining multiple guard conditions.
 */

'use client';

import React from 'react';
import { AuthenticationGuard } from './AuthenticationGuard';
import { OrganizationMembershipGuard } from './OrganizationMembershipGuard';
import { RoleGuard } from './RoleGuard';

interface ComposableGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOrganization?: boolean;
  organizationId?: string;
  requiredRole?: 'admin' | 'basic_member';
  authFallback?: React.ReactNode;
  organizationFallback?: React.ReactNode;
  roleFallback?: React.ReactNode;
}

/**
 * Composable guard that can combine multiple authorization requirements
 * 
 * Example usage:
 * <ComposableGuard requireAuth requireOrganization requiredRole="admin">
 *   <AdminPanel />
 * </ComposableGuard>
 */
export function ComposableGuard({
  children,
  requireAuth = true,
  requireOrganization = false,
  organizationId,
  requiredRole,
  authFallback,
  organizationFallback,
  roleFallback
}: ComposableGuardProps) {
  let wrappedChildren = <>{children}</>;

  // Apply guards in reverse order (innermost first)
  if (requiredRole) {
    wrappedChildren = (
      <RoleGuard requiredRole={requiredRole} fallback={roleFallback}>
        {wrappedChildren}
      </RoleGuard>
    );
  }

  if (requireOrganization) {
    wrappedChildren = (
      <OrganizationMembershipGuard 
        organizationId={organizationId}
        fallback={organizationFallback}
      >
        {wrappedChildren}
      </OrganizationMembershipGuard>
    );
  }

  if (requireAuth) {
    wrappedChildren = (
      <AuthenticationGuard fallback={authFallback}>
        {wrappedChildren}
      </AuthenticationGuard>
    );
  }

  return wrappedChildren;
}

/**
 * Convenience component for the most common combination:
 * Authentication + Organization membership + Admin role
 */
export function AdminGuard({ 
  children, 
  organizationId,
  ...props 
}: Omit<ComposableGuardProps, 'requireAuth' | 'requireOrganization' | 'requiredRole'>) {
  return (
    <ComposableGuard
      requireAuth
      requireOrganization
      requiredRole="admin"
      organizationId={organizationId}
      {...props}
    >
      {children}
    </ComposableGuard>
  );
}

/**
 * Convenience component for organization member access
 */
export function MemberGuard({ 
  children, 
  organizationId,
  ...props 
}: Omit<ComposableGuardProps, 'requireAuth' | 'requireOrganization'>) {
  return (
    <ComposableGuard
      requireAuth
      requireOrganization
      organizationId={organizationId}
      {...props}
    >
      {children}
    </ComposableGuard>
  );
}

export default ComposableGuard;