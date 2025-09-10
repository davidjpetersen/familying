/**
 * OrganizationRequired Guard Component
 * 
 * Protects routes that require organization membership.
 * Redirects users without organizations to creation flow.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useOrganizationNavigation } from '../../lib/hooks/useOrganizationNavigation';
import { FAMILY_ROUTES } from '../../lib/config/family-organization';

interface OrganizationRequiredProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Route guard that ensures user has an organization before accessing protected content
 */
export function OrganizationRequired({
  children,
  redirectTo = FAMILY_ROUTES.createFamily,
  fallback = <OrganizationRequiredFallback />,
}: OrganizationRequiredProps) {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { hasOrganization, isLoaded: orgLoaded } = useOrganizationNavigation();
  const router = useRouter();

  const isFullyLoaded = authLoaded && orgLoaded;

  useEffect(() => {
    // Only redirect once everything is loaded
    if (!isFullyLoaded) return;

    // Redirect unauthenticated users to sign in
    if (!isSignedIn) {
      router.replace(FAMILY_ROUTES.signIn);
      return;
    }

    // Redirect users without organizations to creation flow
    if (!hasOrganization) {
      router.replace(redirectTo);
      return;
    }
  }, [isFullyLoaded, isSignedIn, hasOrganization, redirectTo, router]);

  // Show loading state while checking auth and organization status
  if (!isFullyLoaded) {
    return (
      <div className="organization-required-loading">
        {fallback}
      </div>
    );
  }

  // Redirect in progress - show loading
  if (!isSignedIn || !hasOrganization) {
    return (
      <div className="organization-required-redirecting">
        {fallback}
      </div>
    );
  }

  // User is authenticated and has organization - render protected content
  return <>{children}</>;
}

/**
 * Default loading fallback component
 */
function OrganizationRequiredFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-4 p-6">
        {/* Loading spinner */}
        <div className="flex justify-center">
          <svg 
            className="animate-spin h-8 w-8 text-blue-600" 
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading Family Information
          </h3>
          <p className="text-gray-600">
            Checking your family organization status...
          </p>
        </div>

        {/* Skeleton content */}
        <div className="animate-pulse space-y-3">
          <div className="bg-gray-200 h-4 w-3/4 rounded mx-auto"></div>
          <div className="bg-gray-200 h-4 w-1/2 rounded mx-auto"></div>
          <div className="bg-gray-200 h-4 w-2/3 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default OrganizationRequired;