/**
 * AuthenticationGuard Component
 * 
 * Ensures user is signed in before accessing protected content.
 * Focused solely on authentication state.
 */

'use client';

import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { GuardLoadingSpinner } from './shared/GuardComponents';

interface AuthenticationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Guard that only checks authentication status
 */
export function AuthenticationGuard({
  children,
  fallback = <AuthenticationGuardFallback />,
  loadingComponent = <GuardLoadingSpinner message="Checking authentication..." />
}: AuthenticationGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while auth status is loading
  if (!isLoaded) {
    return <>{loadingComponent}</>;
  }

  // User must be signed in
  if (!isSignedIn) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Default fallback for unauthenticated users
 */
function AuthenticationGuardFallback() {
  return (
    <div className="min-h-64 flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
      <div className="max-w-md text-center p-6">
        <div className="mx-auto h-12 w-12 text-red-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Authentication Required
        </h3>
        <p className="text-red-700">
          You must be signed in to access this content.
        </p>
      </div>
    </div>
  );
}

export default AuthenticationGuard;